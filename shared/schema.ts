import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
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
});

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
});

// Analyses table - stores resume ranking results
export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobPrompt: text("job_prompt").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
});

// Email Connections table - stores user email provider credentials
export const emailConnections = pgTable("email_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text("provider").notNull(), // 'gmail' or 'outlook'
  isActive: integer("is_active").notNull().default(1), // 1 = true, 0 = false
  lastFetchedAt: timestamp("last_fetched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  analyses: many(analyses),
  emailConnections: many(emailConnections),
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

// Extended types for UI
export type ResumeWithAnalysis = Resume & {
  latestScore?: number;
  latestRank?: number;
};

export type AnalysisWithResults = Analysis & {
  results: (AnalysisResult & { resume: Resume })[];
};
