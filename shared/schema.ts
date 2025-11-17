import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - stores authenticated users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  provider: text("provider").notNull(), // 'google' or 'microsoft'
  providerId: text("provider_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  providerIdx: index("users_provider_idx").on(table.provider),
}));

// Resumes table - stores extracted CV data
export const resumes = pgTable("resumes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  candidateName: text("candidate_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  extractedText: text("extracted_text").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileData: text("file_data").notNull(), // base64 encoded file
  fileType: text("file_type").notNull(), // 'pdf', 'doc', 'docx'
  source: text("source").notNull(), // 'gmail' or 'outlook'
  emailSubject: text("email_subject"),
  emailDate: timestamp("email_date"),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("resumes_user_id_idx").on(table.userId),
  fetchedAtIdx: index("resumes_fetched_at_idx").on(table.fetchedAt),
  sourceIdx: index("resumes_source_idx").on(table.source),
}));

// Analyses table - stores resume ranking results
export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobPrompt: text("job_prompt").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("analyses_user_id_idx").on(table.userId),
  createdAtIdx: index("analyses_created_at_idx").on(table.createdAt),
}));

// Analysis Results table - stores individual resume scores for an analysis
export const analysisResults = pgTable("analysis_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").notNull().references(() => analyses.id, { onDelete: 'cascade' }),
  resumeId: varchar("resume_id").notNull().references(() => resumes.id, { onDelete: 'cascade' }),
  score: integer("score").notNull(), // 0-100
  rank: integer("rank").notNull(),
  strengths: jsonb("strengths").notNull().$type<string[]>(),
  weaknesses: jsonb("weaknesses").notNull().$type<string[]>(),
  summary: text("summary"),
}, (table) => ({
  analysisIdIdx: index("analysis_results_analysis_id_idx").on(table.analysisId),
  resumeIdIdx: index("analysis_results_resume_id_idx").on(table.resumeId),
  scoreIdx: index("analysis_results_score_idx").on(table.score),
  rankIdx: index("analysis_results_rank_idx").on(table.rank),
}));

// Email Connections table - stores user email provider credentials
export const emailConnections = pgTable("email_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text("provider").notNull(), // 'gmail' or 'outlook'
  isActive: integer("is_active").notNull().default(1), // 1 = true, 0 = false
  lastFetchedAt: timestamp("last_fetched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("email_connections_user_id_idx").on(table.userId),
  providerIdx: index("email_connections_provider_idx").on(table.provider),
  lastFetchedIdx: index("email_connections_last_fetched_idx").on(table.lastFetchedAt),
}));

// Fetch History table - tracks email fetch operations
export const fetchHistory = pgTable("fetch_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text("provider").notNull(), // 'gmail' or 'outlook'
  operation: text("operation").notNull(), // 'fetch_emails', 'process_cvs'
  emailCount: integer("email_count").notNull().default(0),
  attachmentCount: integer("attachment_count").notNull().default(0),
  status: text("status").notNull(), // 'success', 'error', 'partial'
  errorMessage: text("error_message"),
  details: jsonb("details"), // Additional operation details
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Activities table - tracks user actions
export const userActivities = pgTable("user_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text("action").notNull(), // 'login', 'fetch_emails', 'rank_resumes', etc.
  details: jsonb("details"), // Action-specific details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Settings table - stores user preferences
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  theme: text("theme").default("light"), // 'light', 'dark'
  emailNotifications: integer("email_notifications").default(1), // 1 = enabled, 0 = disabled
  autoFetchEmails: integer("auto_fetch_emails").default(0), // 1 = enabled, 0 = disabled
  defaultJobPrompt: text("default_job_prompt"),
  preferences: jsonb("preferences").default(sql`'{}'`), // JSON preferences
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  resumes: many(resumes),
  analyses: many(analyses),
  emailConnections: many(emailConnections),
  fetchHistory: many(fetchHistory),
  userActivities: many(userActivities),
  userSettings: one(userSettings),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
  analysisResults: many(analysisResults),
}));

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  user: one(users, {
    fields: [analyses.userId],
    references: [users.id],
  }),
  results: many(analysisResults),
}));

export const analysisResultsRelations = relations(analysisResults, ({ one }) => ({
  analysis: one(analyses, {
    fields: [analysisResults.analysisId],
    references: [analyses.id],
  }),
  resume: one(resumes, {
    fields: [analysisResults.resumeId],
    references: [resumes.id],
  }),
}));

export const emailConnectionsRelations = relations(emailConnections, ({ one }) => ({
  user: one(users, {
    fields: [emailConnections.userId],
    references: [users.id],
  }),
}));

export const fetchHistoryRelations = relations(fetchHistory, ({ one }) => ({
  user: one(users, {
    fields: [fetchHistory.userId],
    references: [users.id],
  }),
}));

export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  fetchedAt: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResults).omit({
  id: true,
});

export const insertEmailConnectionSchema = createInsertSchema(emailConnections).omit({
  id: true,
  createdAt: true,
});

export const insertFetchHistorySchema = createInsertSchema(fetchHistory).omit({
  id: true,
  createdAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({
  id: true,
  createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;

export type EmailConnection = typeof emailConnections.$inferSelect;
export type InsertEmailConnection = z.infer<typeof insertEmailConnectionSchema>;

export type FetchHistory = typeof fetchHistory.$inferSelect;
export type InsertFetchHistory = z.infer<typeof insertFetchHistorySchema>;

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// Extended types for UI
export type ResumeWithAnalysis = Resume & {
  latestScore?: number;
  latestRank?: number;
};

export type AnalysisWithResults = Analysis & {
  results: (AnalysisResult & { resume: Resume })[];
};
