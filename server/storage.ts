import { 
  users, 
  resumes, 
  analyses, 
  analysisResults, 
  emailConnections,
  fetchHistory,
  userActivities,
  userSettings,
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
  type FetchHistory,
  type InsertFetchHistory,
  type UserActivity,
  type InsertUserActivity,
  type UserSettings,
  type InsertUserSettings,
  type AnalysisWithResults,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

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
  
  // Fetch history operations
  createFetchHistory(fetchHistory: InsertFetchHistory): Promise<FetchHistory>;
  getUserFetchHistory(userId: string, limit?: number): Promise<FetchHistory[]>;
  getLatestFetchHistory(userId: string, provider: string): Promise<FetchHistory | undefined>;
  
  // User activity operations
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  getUserActivities(userId: string, limit?: number): Promise<UserActivity[]>;
  
  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, updates: Partial<InsertUserSettings>): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    totalResumes: number;
    lastAnalysisDate: string | null;
    highestScore: number | null;
    totalAnalyses: number;
    lastFetchDate: string | null;
    connectedProviders: string[];
  }>;

  // Admin operations
  getAllUsers(): Promise<(User & { resumeCount: number; analysisCount: number })[]>;
  banUser(userId: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  getGlobalStats(): Promise<{
    totalUsers: number;
    totalResumes: number;
    totalAnalyses: number;
    avgScore: number | null;
  }>;
  searchResumes(query: string, limit?: number): Promise<(Resume & { user: User })[]>;
  getAnalyticsData(): Promise<{
    usersThisWeek: number;
    resumesThisWeek: number;
    analysesThisWeek: number;
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
    // Use SQL COUNT for efficiency instead of fetching all records
    const [result] = await db
      .select({ count: sql`count(*)` })
      .from(resumes)
      .where(eq(resumes.userId, userId));
    
    return Number(result.count);
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
    // Use JOIN to get analysis results with resumes in a single query
    const results = await db
      .select({
        id: analysisResults.id,
        analysisId: analysisResults.analysisId,
        resumeId: analysisResults.resumeId,
        score: analysisResults.score,
        rank: analysisResults.rank,
        strengths: analysisResults.strengths,
        weaknesses: analysisResults.weaknesses,
        summary: analysisResults.summary,
        resume: {
          id: resumes.id,
          userId: resumes.userId,
          candidateName: resumes.candidateName,
          email: resumes.email,
          phone: resumes.phone,
          extractedText: resumes.extractedText,
          originalFileName: resumes.originalFileName,
          fileData: resumes.fileData,
          fileType: resumes.fileType,
          source: resumes.source,
          fetchedAt: resumes.fetchedAt,
        }
      })
      .from(analysisResults)
      .innerJoin(resumes, eq(analysisResults.resumeId, resumes.id))
      .where(eq(analysisResults.analysisId, analysisId))
      .orderBy(analysisResults.rank);

    return results.map(result => ({
      ...result,
      resume: result.resume as Resume
    }));
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
    totalAnalyses: number;
    lastFetchDate: string | null;
    connectedProviders: string[];
  }> {
    // Use Promise.all to run multiple optimized queries in parallel
    const [
      resumeStats,
      analysisStats,
      latestFetch,
      connections
    ] = await Promise.all([
      // Resume count with single query
      db.select({ count: resumes.id })
        .from(resumes)
        .where(eq(resumes.userId, userId)),
      
      // Latest analysis and count in single query
      db.select({
        id: analyses.id,
        createdAt: analyses.createdAt
      })
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt)),
      
      // Latest fetch history
      db.select()
        .from(fetchHistory)
        .where(eq(fetchHistory.userId, userId))
        .orderBy(desc(fetchHistory.createdAt))
        .limit(1),
      
      // Connected providers
      db.select({ provider: emailConnections.provider })
        .from(emailConnections)
        .where(and(
          eq(emailConnections.userId, userId), 
          eq(emailConnections.isActive, 1)
        ))
    ]);

    let highestScore: number | null = null;
    const latestAnalysis = analysisStats[0];

    if (latestAnalysis) {
      // Get highest score for latest analysis
      const [scoreResult] = await db
        .select({ score: analysisResults.score })
        .from(analysisResults)
        .where(eq(analysisResults.analysisId, latestAnalysis.id))
        .orderBy(desc(analysisResults.score))
        .limit(1);
      
      highestScore = scoreResult?.score || null;
    }

    return {
      totalResumes: resumeStats.length,
      lastAnalysisDate: latestAnalysis ? latestAnalysis.createdAt.toISOString() : null,
      highestScore,
      totalAnalyses: analysisStats.length,
      lastFetchDate: latestFetch[0] ? latestFetch[0].createdAt.toISOString() : null,
      connectedProviders: connections.map(c => c.provider),
    };
  }

  // Fetch History methods
  async createFetchHistory(insertFetchHistory: InsertFetchHistory): Promise<FetchHistory> {
    const [fetchHistoryRecord] = await db
      .insert(fetchHistory)
      .values(insertFetchHistory)
      .returning();
    return fetchHistoryRecord;
  }

  async getUserFetchHistory(userId: string, limit: number = 50): Promise<FetchHistory[]> {
    return await db
      .select()
      .from(fetchHistory)
      .where(eq(fetchHistory.userId, userId))
      .orderBy(desc(fetchHistory.createdAt))
      .limit(limit);
  }

  async getLatestFetchHistory(userId: string, provider: string): Promise<FetchHistory | undefined> {
    const [latest] = await db
      .select()
      .from(fetchHistory)
      .where(and(
        eq(fetchHistory.userId, userId),
        eq(fetchHistory.provider, provider)
      ))
      .orderBy(desc(fetchHistory.createdAt))
      .limit(1);
    return latest || undefined;
  }

  // User Activity methods
  async createUserActivity(insertActivity: InsertUserActivity): Promise<UserActivity> {
    const [activity] = await db
      .insert(userActivities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getUserActivities(userId: string, limit: number = 100): Promise<UserActivity[]> {
    return await db
      .select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.createdAt))
      .limit(limit);
  }

  // User Settings methods
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async updateUserSettings(userId: string, updates: Partial<InsertUserSettings>): Promise<void> {
    await db
      .update(userSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  }

  // Admin methods
  async getAllUsers(): Promise<(User & { resumeCount: number; analysisCount: number })[]> {
    const result = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      provider: users.provider,
      providerId: users.providerId,
      passwordHash: users.passwordHash,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      resumeCount: sql`COUNT(DISTINCT ${resumes.id})`,
      analysisCount: sql`COUNT(DISTINCT ${analyses.id})`,
    })
    .from(users)
    .leftJoin(resumes, eq(users.id, resumes.userId))
    .leftJoin(analyses, eq(users.id, analyses.userId))
    .groupBy(users.id);
    
    return result.map(r => ({
      ...r,
      resumeCount: Number(r.resumeCount),
      analysisCount: Number(r.analysisCount),
    }));
  }

  async banUser(userId: string): Promise<void> {
    await db.update(users).set({ isAdmin: 0 }).where(eq(users.id, userId));
  }

  async unbanUser(userId: string): Promise<void> {
    await db.update(users).set({ isAdmin: 0 }).where(eq(users.id, userId));
  }

  async getGlobalStats(): Promise<{ totalUsers: number; totalResumes: number; totalAnalyses: number; avgScore: number | null }> {
    const [userCount] = await db.select({ count: sql`COUNT(*)` }).from(users);
    const [resumeCount] = await db.select({ count: sql`COUNT(*)` }).from(resumes);
    const [analysisCount] = await db.select({ count: sql`COUNT(*)` }).from(analyses);
    const [avgScoreResult] = await db.select({ avg: sql`AVG(score)` }).from(analysisResults);
    
    return {
      totalUsers: Number(userCount.count),
      totalResumes: Number(resumeCount.count),
      totalAnalyses: Number(analysisCount.count),
      avgScore: avgScoreResult.avg ? Number(avgScoreResult.avg) : null,
    };
  }

  async searchResumes(query: string, limit: number = 50): Promise<(Resume & { user: User })[]> {
    return await db.select({
      id: resumes.id,
      userId: resumes.userId,
      candidateName: resumes.candidateName,
      email: resumes.email,
      phone: resumes.phone,
      extractedText: resumes.extractedText,
      originalFileName: resumes.originalFileName,
      fileData: resumes.fileData,
      fileType: resumes.fileType,
      source: resumes.source,
      emailSubject: resumes.emailSubject,
      emailDate: resumes.emailDate,
      fetchedAt: resumes.fetchedAt,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        provider: users.provider,
        providerId: users.providerId,
        passwordHash: users.passwordHash,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      }
    })
    .from(resumes)
    .innerJoin(users, eq(resumes.userId, users.id))
    .where(sql`${resumes.candidateName} ILIKE ${'%' + query + '%'} OR ${resumes.email} ILIKE ${'%' + query + '%'}`)
    .limit(limit);
  }

  async getAnalyticsData(): Promise<{ usersThisWeek: number; resumesThisWeek: number; analysesThisWeek: number }> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [userResult] = await db.select({ count: sql`COUNT(*)` }).from(users).where(sql`${users.createdAt} > ${weekAgo}`);
    const [resumeResult] = await db.select({ count: sql`COUNT(*)` }).from(resumes).where(sql`${resumes.fetchedAt} > ${weekAgo}`);
    const [analysisResult] = await db.select({ count: sql`COUNT(*)` }).from(analyses).where(sql`${analyses.createdAt} > ${weekAgo}`);
    
    return {
      usersThisWeek: Number(userResult.count),
      resumesThisWeek: Number(resumeResult.count),
      analysesThisWeek: Number(analysisResult.count),
    };
  }
}

export const storage = new DatabaseStorage();
