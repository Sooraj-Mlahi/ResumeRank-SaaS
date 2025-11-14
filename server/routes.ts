import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { fetchCVsFromGmail } from "./gmail";
import { extractTextFromCV } from "./cv-extractor";
import { scoreResume, extractCandidateInfo } from "./openai";
import { insertResumeSchema, insertAnalysisSchema } from "@shared/schema";

// Simple in-memory session store for demo
declare module "express-session" {
  interface SessionData {
    userId?: string;
    email?: string;
    name?: string;
    provider?: string;
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

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.json(null);
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.json(null);
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    });
  });

  app.get("/api/auth/google", (req, res) => {
    // Mock Google OAuth - in production, this would redirect to Google
    // For demo, we'll create a test user
    req.session.email = "demo@gmail.com";
    req.session.name = "Demo User";
    req.session.provider = "google";
    res.redirect("/api/auth/callback");
  });

  app.get("/api/auth/microsoft", (req, res) => {
    // Mock Microsoft OAuth - in production, this would redirect to Microsoft
    req.session.email = "demo@outlook.com";
    req.session.name = "Demo User";
    req.session.provider = "microsoft";
    res.redirect("/api/auth/callback");
  });

  app.get("/api/auth/callback", async (req, res) => {
    if (!req.session.email || !req.session.provider) {
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

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.session.userId!);
      
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
      const connections = await storage.getEmailConnections(req.session.userId!);
      res.json(connections);
    } catch (error) {
      console.error("Get connections error:", error);
      res.status(500).json({ error: "Failed to fetch email connections" });
    }
  });

  app.post("/api/email/connect/gmail", requireAuth, async (req, res) => {
    try {
      const existingConnection = await storage.getEmailConnection(
        req.session.userId!,
        "gmail"
      );

      if (!existingConnection) {
        await storage.createEmailConnection({
          userId: req.session.userId!,
          provider: "gmail",
          isActive: 1,
          lastFetchedAt: null,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Connect Gmail error:", error);
      res.status(500).json({ error: "Failed to connect Gmail" });
    }
  });

  app.get("/api/email/fetch-history", requireAuth, async (req, res) => {
    try {
      // For demo, return empty array - in production, track fetch history
      res.json([]);
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

      // Update connection last fetched time
      const connection = await storage.getEmailConnection(req.session.userId!, "gmail");
      if (connection) {
        await storage.updateEmailConnection(connection.id, new Date());
      }

      res.json({ count: processedCount });
    } catch (error) {
      console.error("Fetch Gmail CVs error:", error);
      res.status(500).json({ error: "Failed to fetch CVs from Gmail" });
    }
  });

  // Resume routes
  app.get("/api/resumes/count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getResumeCount(req.session.userId!);
      res.json({ count });
    } catch (error) {
      console.error("Resume count error:", error);
      res.status(500).json({ error: "Failed to get resume count" });
    }
  });

  app.post("/api/resumes/rank", requireAuth, async (req, res) => {
    try {
      const { jobPrompt } = req.body;

      if (!jobPrompt || typeof jobPrompt !== "string") {
        return res.status(400).json({ error: "Job prompt is required" });
      }

      // Get all resumes for this user
      const resumes = await storage.getResumesByUserId(req.session.userId!);

      if (resumes.length === 0) {
        return res.status(400).json({ error: "No resumes available to rank" });
      }

      // Create analysis record
      const analysis = await storage.createAnalysis({
        userId: req.session.userId!,
        jobPrompt,
      });

      // Score each resume with AI
      const scores = await Promise.all(
        resumes.map(async (resume) => {
          const score = await scoreResume(resume.extractedText, jobPrompt);
          return {
            resumeId: resume.id,
            ...score,
          };
        })
      );

      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);

      // Save analysis results with ranks
      for (let i = 0; i < scores.length; i++) {
        await storage.createAnalysisResult({
          analysisId: analysis.id,
          resumeId: scores[i].resumeId,
          score: scores[i].score,
          rank: i + 1,
          strengths: scores[i].strengths,
          weaknesses: scores[i].weaknesses,
          summary: scores[i].summary,
        });
      }

      res.json({ totalResumes: scores.length, analysisId: analysis.id });
    } catch (error) {
      console.error("Rank resumes error:", error);
      res.status(500).json({ error: "Failed to rank resumes" });
    }
  });

  app.get("/api/resumes/latest-analysis", requireAuth, async (req, res) => {
    try {
      const analysis = await storage.getLatestAnalysis(req.session.userId!);

      if (!analysis) {
        return res.json(null);
      }

      // Format the response
      const formattedResults = analysis.results.map((result) => ({
        id: result.id,
        rank: result.rank,
        candidateName: result.resume.candidateName,
        email: result.resume.email,
        phone: result.resume.phone,
        score: result.score,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        summary: result.summary,
        extractedText: result.resume.extractedText,
        originalFileName: result.resume.originalFileName,
        fileData: result.resume.fileData,
        fileType: result.resume.fileType,
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
