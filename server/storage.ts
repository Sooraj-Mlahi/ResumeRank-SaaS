import { 
  users, 
  resumes, 
  analyses, 
  analysisResults, 
  emailConnections,
  type User, 
  type InsertUser,
  type Resume,
  type InsertResume,
  type Analysis,
  type InsertAnalysis,
  type AnalysisResult,
  type InsertAnalysisResult,
  type EmailConnection,
  type InsertEmailConnection,
  type AnalysisWithResults,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProviderId(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Resume operations
  getResume(id: string): Promise<Resume | undefined>;
  getResumesByUserId(userId: string): Promise<Resume[]>;
  getResumeCount(userId: string): Promise<number>;
  createResume(resume: InsertResume): Promise<Resume>;
  
  // Analysis operations
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getLatestAnalysis(userId: string): Promise<AnalysisWithResults | undefined>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  
  // Analysis result operations
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
  getAnalysisResults(analysisId: string): Promise<(AnalysisResult & { resume: Resume })[]>;
  
  // Email connection operations
  getEmailConnection(userId: string, provider: string): Promise<EmailConnection | undefined>;
  getEmailConnections(userId: string): Promise<EmailConnection[]>;
  createEmailConnection(connection: InsertEmailConnection): Promise<EmailConnection>;
  updateEmailConnection(id: string, lastFetchedAt: Date): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    totalResumes: number;
    lastAnalysisDate: string | null;
    highestScore: number | null;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        eq(users.provider, provider),
        eq(users.providerId, providerId)
      )
    );
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getResume(id: string): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    return resume || undefined;
  }

  async getResumesByUserId(userId: string): Promise<Resume[]> {
    return await db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.fetchedAt));
  }

  async getResumeCount(userId: string): Promise<number> {
    const result = await db.select().from(resumes).where(eq(resumes.userId, userId));
    return result.length;
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const [resume] = await db
      .insert(resumes)
      .values(insertResume)
      .returning();
    return resume;
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis || undefined;
  }

  async getLatestAnalysis(userId: string): Promise<AnalysisWithResults | undefined> {
    const [analysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt))
      .limit(1);

    if (!analysis) return undefined;

    const results = await this.getAnalysisResults(analysis.id);
    
    return {
      ...analysis,
      results,
    };
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db
      .insert(analyses)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async createAnalysisResult(insertResult: InsertAnalysisResult): Promise<AnalysisResult> {
    const [result] = await db
      .insert(analysisResults)
      .values(insertResult)
      .returning();
    return result;
  }

  async getAnalysisResults(analysisId: string): Promise<(AnalysisResult & { resume: Resume })[]> {
    const results = await db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.analysisId, analysisId))
      .orderBy(analysisResults.rank);

    const resultsWithResumes = await Promise.all(
      results.map(async (result) => {
        const resume = await this.getResume(result.resumeId);
        return {
          ...result,
          resume: resume!,
        };
      })
    );

    return resultsWithResumes;
  }

  async getEmailConnection(userId: string, provider: string): Promise<EmailConnection | undefined> {
    const [connection] = await db
      .select()
      .from(emailConnections)
      .where(
        and(
          eq(emailConnections.userId, userId),
          eq(emailConnections.provider, provider)
        )
      );
    return connection || undefined;
  }

  async getEmailConnections(userId: string): Promise<EmailConnection[]> {
    return await db
      .select()
      .from(emailConnections)
      .where(eq(emailConnections.userId, userId));
  }

  async createEmailConnection(insertConnection: InsertEmailConnection): Promise<EmailConnection> {
    const [connection] = await db
      .insert(emailConnections)
      .values(insertConnection)
      .returning();
    return connection;
  }

  async updateEmailConnection(id: string, lastFetchedAt: Date): Promise<void> {
    await db
      .update(emailConnections)
      .set({ lastFetchedAt })
      .where(eq(emailConnections.id, id));
  }

  async getDashboardStats(userId: string): Promise<{
    totalResumes: number;
    lastAnalysisDate: string | null;
    highestScore: number | null;
  }> {
    const resumeCount = await this.getResumeCount(userId);
    
    const [latestAnalysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt))
      .limit(1);

    let highestScore: number | null = null;
    if (latestAnalysis) {
      const results = await db
        .select()
        .from(analysisResults)
        .where(eq(analysisResults.analysisId, latestAnalysis.id))
        .orderBy(desc(analysisResults.score))
        .limit(1);
      
      if (results.length > 0) {
        highestScore = results[0].score;
      }
    }

    return {
      totalResumes: resumeCount,
      lastAnalysisDate: latestAnalysis ? latestAnalysis.createdAt.toISOString() : null,
      highestScore,
    };
  }
}

export const storage = new DatabaseStorage();
