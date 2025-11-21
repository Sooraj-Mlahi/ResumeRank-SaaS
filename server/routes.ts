import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from "multer";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { storage } from "./storage";
import { fetchCVsFromGmail } from "./gmail";
import { fetchCVsFromOutlook } from "./outlook";
import { extractTextFromCV } from "./cv-extractor";
import { scoreResume, extractCandidateInfo } from "./openai";
import { getOutlookAuthUrl, getOutlookAccessToken, testOutlookConnection } from "./outlook-oauth";
import { getGmailAuthUrl, exchangeCodeForTokens, getGmailUserInfo } from "./gmail-oauth";
import { insertResumeSchema, insertAnalysisSchema, resumes, analyses, analysisResults, emailConnections, fetchHistory } from "@shared/schema";
import { db } from "./db";
import { sql, eq, desc } from "drizzle-orm";

// Simple in-memory session store for demo
declare module "express-session" {
  interface SessionData {
    userId?: string;
    email?: string;
    name?: string;
    provider?: string;
    outlookAccessToken?: string;
    gmailTokens?: any;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "resume-rank-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Authentication middleware (disabled for testing)
  const requireAuth = (req: any, res: any, next: any) => {
    console.log("🔐 Auth check - Session:", {
      userId: req.session.userId,
      email: req.session.email,
      provider: req.session.provider
    });
    
    // Auth disabled for testing - allows all requests through
    // Set a default test userId if none exists
    if (!req.session.userId) {
      req.session.userId = "test-user-" + Date.now();
    }
    next();
  };

  // Auth routes
  app.get("/api/auth/me", async (req, res) => {
    // Set a default test user for testing (auth disabled)
    if (!req.session.userId) {
      req.session.userId = "test-user-" + Date.now();
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      // Return test user for development/testing without database
      return res.json({
        id: req.session.userId,
        email: "test@example.com",
        name: "Test User",
        provider: "test",
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    });
  });

  // Handle Google OAuth redirect at root (matching google-credentials.json)
  // Note: In development, Vite middleware will handle serving the app
  // This route only handles OAuth callbacks that come to root
  app.get("/", (req, res, next) => {
    const { code, error } = req.query;
    
    // If this is an OAuth callback (has code or error), forward to proper callback
    if (code || error) {
      console.log("🔄 Redirecting OAuth callback from root to /api/auth/google/callback");
      return res.redirect(`/api/auth/google/callback?${req.url.split('?')[1] || ''}`);
    }
    
    // Otherwise, let Vite middleware handle it (in dev) or serve static files (in prod)
    next();
  });

  app.get("/api/auth/google", (req, res) => {
    try {
      const authUrl = getGmailAuthUrl();
      res.redirect(authUrl);
    } catch (error) {
      console.error("Gmail auth error:", error);
      res.status(500).json({ error: "Failed to initiate Gmail authentication" });
    }
  });

  app.get("/api/auth/callback/google", async (req, res) => {
    const { code, error } = req.query;
    
    console.log("📧 Google callback received:", { code: !!code, error });
    
    if (error) {
      console.error("Google OAuth error:", error);
      return res.redirect("/login?error=oauth_failed");
    }
    
    if (!code || typeof code !== "string") {
      console.error("Google OAuth - Missing or invalid code");
      return res.redirect("/login?error=missing_code");
    }
    
    try {
      console.log("🔄 Exchanging code for Gmail tokens...");
      // Exchange code for access token
      const tokens = await exchangeCodeForTokens(code);
      console.log("✅ Gmail tokens received");
      
      console.log("🔄 Getting Gmail user info...");
      // Get user info from Gmail API
      const userInfo = await getGmailUserInfo(tokens);
      console.log("✅ Gmail user info:", userInfo);
      
      req.session.email = userInfo.email;
      req.session.name = userInfo.name;
      req.session.provider = "google";
      req.session.gmailTokens = tokens;
      
      console.log("✅ Gmail session set:", {
        email: req.session.email,
        provider: req.session.provider
      });
      
      res.redirect("/api/auth/callback");
    } catch (error) {
      console.error("Gmail callback error:", error);
      res.redirect("/login?error=callback_failed");
    }
  });

  app.get("/api/auth/microsoft", async (req, res) => {
    try {
      const authUrl = await getOutlookAuthUrl();
      res.redirect(authUrl);
    } catch (error) {
      console.error("Microsoft auth error:", error);
      res.status(500).json({ error: "Failed to initiate Microsoft authentication" });
    }
  });

  app.get("/api/auth/outlook/callback", async (req, res) => {
    const { code, error } = req.query;
    
    if (error) {
      console.error("Microsoft OAuth error:", error);
      return res.redirect("/login?error=oauth_failed");
    }
    
    if (!code || typeof code !== "string") {
      return res.redirect("/login?error=missing_code");
    }
    
    try {
      // Exchange code for access token
      const accessToken = await getOutlookAccessToken(code);
      
      // Get user info from Microsoft Graph
      const userInfo = await testOutlookConnection(accessToken);
      
      req.session.email = userInfo.email;
      req.session.name = userInfo.name;
      req.session.provider = "microsoft";
      req.session.outlookAccessToken = accessToken;
      
      res.redirect("/api/auth/callback");
    } catch (error) {
      console.error("Microsoft callback error:", error);
      res.redirect("/login?error=callback_failed");
    }
  });

  app.get("/api/auth/callback", async (req, res) => {
    console.log("📞 Auth callback - Session:", {
      email: req.session.email,
      provider: req.session.provider
    });
    
    if (!req.session.email || !req.session.provider) {
      console.log("❌ Auth callback failed - Missing email or provider");
      return res.redirect("/login");
    }

    try {
      let user = await storage.getUserByEmail(req.session.email);

      if (!user) {
        user = await storage.createUser({
          email: req.session.email,
          name: req.session.name || null,
          provider: req.session.provider,
          providerId: `${req.session.provider}-${req.session.email}`,
        });
      }

      req.session.userId = user.id;
      
      console.log("✅ User authenticated successfully:", {
        userId: user.id,
        email: user.email,
        provider: user.provider
      });
      
      // Create email connection if this is from Outlook OAuth
      if (req.session.provider === "microsoft" && req.session.outlookAccessToken) {
        const existingConnection = await storage.getEmailConnection(user.id, "outlook");
        
        if (!existingConnection) {
          await storage.createEmailConnection({
            userId: user.id,
            provider: "outlook",
            isActive: 1,
            lastFetchedAt: null,
          });
        }
      }
      
      // Create email connection if this is from Gmail OAuth
      if (req.session.provider === "google" && req.session.gmailTokens) {
        const existingConnection = await storage.getEmailConnection(user.id, "gmail");
        
        if (!existingConnection) {
          await storage.createEmailConnection({
            userId: user.id,
            provider: "gmail",
            isActive: 1,
            lastFetchedAt: null,
          });
        }
      }
      
      res.redirect("/");
    } catch (error) {
      console.error("Auth callback error:", error);
      res.redirect("/login");
    }
  });

  app.get("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  });

  // Dashboard stats - OPTIMIZED for performance
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      // Direct query - much faster than storage methods
      const [statsResult] = await db
        .select({
          totalResumes: sql<number>`count(*)::int`,
          lastAnalysisDate: sql<string>`max(${analyses.createdAt})::text`
        })
        .from(resumes)
        .leftJoin(analyses, eq(analyses.userId, req.session.userId!))
        .where(eq(resumes.userId, req.session.userId!));
      
      const stats = {
        totalResumes: statsResult?.totalResumes || 0,
        lastAnalysisDate: statsResult?.lastAnalysisDate || null
      };
      
      // Mock recent activity for demo
      const recentActivity = [
        {
          id: "1",
          type: "fetch" as const,
          description: "Fetched 3 CVs from Gmail",
          date: new Date().toISOString(),
        },
      ];

      res.json({
        ...stats,
        recentActivity,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Email connection routes
  app.get("/api/email/connections", requireAuth, async (req, res) => {
    try {
      const connections = await db.select()
        .from(emailConnections)
        .where(eq(emailConnections.userId, req.session.userId!));
      res.json(connections);
    } catch (error) {
      console.error("Get connections error:", error);
      res.status(500).json({ error: "Failed to fetch email connections" });
    }
  });

  app.post("/api/email/connect/gmail", requireAuth, async (req, res) => {
    try {
      // Clear any existing session data to force fresh OAuth
      delete req.session.email;
      delete req.session.gmailTokens;
      delete req.session.provider;
      
      // Generate the auth URL for Gmail OAuth flow
      const authUrl = getGmailAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Connect Gmail error:", error);
      res.status(500).json({ error: "Failed to connect Gmail" });
    }
  });

  app.post("/api/email/connect/outlook", requireAuth, async (req, res) => {
    try {
      // Clear any existing session data to force fresh OAuth
      delete req.session.email;
      delete req.session.outlookAccessToken;
      delete req.session.provider;
      
      // Generate the auth URL for Outlook OAuth flow
      const authUrl = await getOutlookAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Connect Outlook error:", error);
      res.status(500).json({ error: "Failed to connect Outlook" });
    }
  });

  app.get("/api/email/fetch-history", requireAuth, async (req, res) => {
    try {
      // Get fetch history from email connections with actual resume counts
      const connections = await db.select()
        .from(emailConnections)
        .where(eq(emailConnections.userId, req.session.userId!));
      
      const history = await Promise.all(
        connections
          .filter(c => c.lastFetchedAt)
          .map(async (connection) => {
            // Count resumes from this provider
            const resumeCount = await db.select({ count: sql<number>`count(*)` })
              .from(resumes)
              .where(
                sql`${resumes.userId} = ${req.session.userId!} AND ${resumes.source} = ${connection.provider}`
              );
            
            return {
              id: connection.id,
              provider: connection.provider,
              resumesFound: resumeCount[0]?.count || 0,
              fetchedAt: connection.lastFetchedAt!.toISOString()
            };
          })
      );
      
      // Sort by fetchedAt descending
      history.sort((a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime());
      
      res.json(history);
    } catch (error) {
      console.error("Fetch history error:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post("/api/email/fetch/gmail", requireAuth, async (req, res) => {
    try {
      const attachments = await fetchCVsFromGmail();
      let processedCount = 0;

      for (const attachment of attachments) {
        try {
          const extractedText = await extractTextFromCV(
            attachment.data,
            attachment.mimeType
          );

          if (!extractedText || extractedText.length < 50) {
            continue; // Skip files that don't have meaningful text
          }

          const candidateInfo = await extractCandidateInfo(extractedText);

          // Store the resume
          await storage.createResume({
            userId: req.session.userId!,
            candidateName: candidateInfo.name,
            email: candidateInfo.email,
            phone: candidateInfo.phone,
            extractedText,
            originalFileName: attachment.filename,
            fileData: attachment.data.toString("base64"),
            fileType: attachment.filename.split(".").pop() || "pdf",
            source: "gmail",
            emailSubject: attachment.subject,
            emailDate: attachment.date,
          });

          processedCount++;
        } catch (error) {
          console.error("Error processing attachment:", attachment.filename, error);
          continue;
        }
      }

      // Update connection last fetched time using direct database operation
      const existingConnection = await db.select()
        .from(emailConnections)
        .where(
          sql`${emailConnections.userId} = ${req.session.userId!} AND ${emailConnections.provider} = 'gmail'`
        )
        .limit(1);
        
      if (existingConnection.length > 0) {
        await db.update(emailConnections)
          .set({ lastFetchedAt: new Date() })
          .where(eq(emailConnections.id, existingConnection[0].id));
      } else {
        // Create connection record if it doesn't exist
        await db.insert(emailConnections).values({
          userId: req.session.userId!,
          provider: "gmail",
          isActive: 1,
          lastFetchedAt: new Date(),
        });
      }

      res.json({ count: processedCount });
    } catch (error) {
      console.error("Fetch Gmail CVs error:", error);
      res.status(500).json({ error: "Failed to fetch CVs from Gmail" });
    }
  });

  app.post("/api/email/fetch/outlook", requireAuth, async (req, res) => {
    try {
      // Get Outlook access token from session
      const accessToken = req.session.outlookAccessToken;
      
      if (!accessToken) {
        return res.status(401).json({ error: "Outlook not connected. Please authenticate first." });
      }

      const processedCVs = await fetchCVsFromOutlook(accessToken);
      let processedCount = 0;

      for (const cv of processedCVs) {
        try {
          // Store the resume using direct database operation
          await db.insert(resumes).values({
            userId: req.session.userId!,
            candidateName: cv.candidateName,
            email: cv.email,
            phone: cv.phone,
            extractedText: cv.extractedText,
            originalFileName: cv.originalFileName,
            fileData: cv.fileData,
            fileType: cv.fileType,
            source: "outlook",
            emailSubject: cv.emailSubject,
            emailDate: cv.emailDate,
          });

          processedCount++;
        } catch (error) {
          console.error("Error storing resume:", cv.originalFileName, error);
          continue;
        }
      }

      // Update connection last fetched time using direct database operation
      const existingConnection = await db.select()
        .from(emailConnections)
        .where(
          sql`${emailConnections.userId} = ${req.session.userId!} AND ${emailConnections.provider} = 'outlook'`
        )
        .limit(1);
        
      if (existingConnection.length > 0) {
        await db.update(emailConnections)
          .set({ lastFetchedAt: new Date() })
          .where(eq(emailConnections.id, existingConnection[0].id));
      } else {
        // Create connection record if it doesn't exist
        await db.insert(emailConnections).values({
          userId: req.session.userId!,
          provider: "outlook",
          isActive: 1,
          lastFetchedAt: new Date(),
        });
      }

      res.json({ count: processedCount });
    } catch (error) {
      console.error("Fetch Outlook CVs error:", error);
      res.status(500).json({ error: "Failed to fetch CVs from Outlook" });
    }
  });

  // Resume routes
  app.get("/api/resumes/count", requireAuth, async (req, res) => {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(resumes)
        .where(eq(resumes.userId, req.session.userId!));
      
      const count = result[0]?.count || 0;
      res.json({ count });
    } catch (error) {
      console.error("Resume count error:", error);
      res.status(500).json({ error: "Failed to get resume count" });
    }
  });

  // Multer configuration for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 10, // Max 10 files
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
      }
    }
  });

  // Upload resumes endpoint
  app.post("/api/resumes/upload", requireAuth, upload.array('files', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const userId = req.session.userId!;
      const uploadResults = {
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Process each file
      for (const file of files) {
        try {
          // Extract text from CV
          const extractedText = await extractTextFromCV(file.buffer, file.mimetype);

          if (!extractedText || extractedText.trim().length === 0) {
            uploadResults.failed++;
            uploadResults.errors.push(`${file.originalname}: Failed to extract text`);
            continue;
          }

          // Store in database
          const [resume] = await db.insert(resumes).values({
            userId,
            originalFileName: file.originalname,
            fileType: file.mimetype,
            extractedText,
            source: 'upload',
          }).returning();

          // Store file in storage
          await storage.storeCV(userId, file.originalname, file.buffer);

          uploadResults.successful++;
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          uploadResults.failed++;
          uploadResults.errors.push(`${file.originalname}: ${error instanceof Error ? error.message : 'Processing failed'}`);
        }
      }

      res.json({
        message: `Upload complete: ${uploadResults.successful} successful, ${uploadResults.failed} failed`,
        ...uploadResults
      });
    } catch (error) {
      console.error("Resume upload error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to upload resumes"
      });
    }
  });

  app.post("/api/resumes/rank", requireAuth, async (req, res) => {
    try {
      const { jobPrompt } = req.body;

      if (!jobPrompt || typeof jobPrompt !== "string") {
        return res.status(400).json({ error: "Job prompt is required" });
      }

      // Get all resumes for this user
      const resumeResults = await db.select()
        .from(resumes)
        .where(eq(resumes.userId, req.session.userId!));

      if (resumeResults.length === 0) {
        return res.status(400).json({ error: "No resumes available to rank" });
      }

      // Create analysis record
      const [analysis] = await db.insert(analyses).values({
        userId: req.session.userId!,
        jobPrompt,
      }).returning();

      // Score each resume with AI (with concurrency control for better performance)
      const batchSize = 5; // Process 5 resumes at a time to avoid rate limits
      const scores = [];
      
      for (let i = 0; i < resumeResults.length; i += batchSize) {
        const batch = resumeResults.slice(i, i + batchSize);
        const batchScores = await Promise.all(
          batch.map(async (resume) => {
            const score = await scoreResume(resume.extractedText, jobPrompt);
            return {
              resumeId: resume.id,
              ...score,
            };
          })
        );
        scores.push(...batchScores);
        
        // Add small delay between batches to respect API rate limits
        if (i + batchSize < resumeResults.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);

      // Save analysis results with ranks (batch insert for performance)
      const analysisResultsData = scores.map((score, index) => ({
        analysisId: analysis.id,
        resumeId: score.resumeId,
        score: score.score,
        rank: index + 1,
        strengths: Array.isArray(score.strengths) ? score.strengths : [],
        weaknesses: Array.isArray(score.weaknesses) ? score.weaknesses : [],
        summary: score.summary,
      }));
      
      await db.insert(analysisResults).values(analysisResultsData);

      res.json({ totalResumes: scores.length, analysisId: analysis.id });
    } catch (error) {
      console.error("Rank resumes error:", error);
      res.status(500).json({ error: "Failed to rank resumes" });
    }
  });

  app.get("/api/resumes/latest-analysis", requireAuth, async (req, res) => {
    try {
      // Get the latest analysis for this user
      const latestAnalysis = await db.select()
        .from(analyses)
        .where(eq(analyses.userId, req.session.userId!))
        .orderBy(desc(analyses.createdAt))
        .limit(1);

      if (latestAnalysis.length === 0) {
        return res.json(null);
      }

      const analysis = latestAnalysis[0];

      // Get all analysis results with resume data for this analysis
      const analysisResultsData = await db.select({
        id: analysisResults.id,
        rank: analysisResults.rank,
        score: analysisResults.score,
        strengths: analysisResults.strengths,
        weaknesses: analysisResults.weaknesses,
        summary: analysisResults.summary,
        candidateName: resumes.candidateName,
        email: resumes.email,
        phone: resumes.phone,
        extractedText: resumes.extractedText,
        originalFileName: resumes.originalFileName,
        fileData: resumes.fileData,
        fileType: resumes.fileType,
      })
      .from(analysisResults)
      .innerJoin(resumes, eq(analysisResults.resumeId, resumes.id))
      .where(eq(analysisResults.analysisId, analysis.id))
      .orderBy(analysisResults.rank);

      // Format the response
      const formattedResults = analysisResultsData.map((result) => ({
        id: result.id,
        rank: result.rank,
        candidateName: result.candidateName,
        email: result.email,
        phone: result.phone,
        score: result.score,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        summary: result.summary,
        extractedText: result.extractedText,
        originalFileName: result.originalFileName,
        fileData: result.fileData,
        fileType: result.fileType,
      }));

      res.json({
        id: analysis.id,
        jobPrompt: analysis.jobPrompt,
        createdAt: analysis.createdAt.toISOString(),
        results: formattedResults,
      });
    } catch (error) {
      console.error("Latest analysis error:", error);
      res.status(500).json({ error: "Failed to fetch latest analysis" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
