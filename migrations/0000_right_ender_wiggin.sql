CREATE TABLE "analyses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"job_prompt" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" varchar NOT NULL,
	"resume_id" varchar NOT NULL,
	"score" integer NOT NULL,
	"rank" integer NOT NULL,
	"strengths" jsonb NOT NULL,
	"weaknesses" jsonb NOT NULL,
	"summary" text
);
--> statement-breakpoint
CREATE TABLE "email_connections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" text NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"last_fetched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"candidate_name" text NOT NULL,
	"email" text,
	"phone" text,
	"extracted_text" text NOT NULL,
	"original_file_name" text NOT NULL,
	"file_data" text NOT NULL,
	"file_type" text NOT NULL,
	"source" text NOT NULL,
	"email_subject" text,
	"email_date" timestamp,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"provider" text NOT NULL,
	"provider_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_analysis_id_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_connections" ADD CONSTRAINT "email_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;