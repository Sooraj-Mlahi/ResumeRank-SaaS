# ResumeRank - AI-Powered Resume Screening Application

## Overview
ResumeRank is an AI-powered application designed to streamline the hiring process by automating resume screening and ranking. It integrates with email providers (Gmail/Outlook) and supports direct uploads to fetch CVs. Leveraging AI, the application ranks candidates based on job requirements, aiming to significantly reduce the time and effort recruiters spend on initial candidate evaluation. The project's ambition is to provide a comprehensive, efficient, and intelligent tool for modern recruitment.

## User Preferences
I want iterative development. Ask before making major changes. I prefer detailed explanations. Do not make changes to the folder `Z`. Do not make changes to the file `Y`.

## System Architecture
The application features a modern full-stack architecture. The frontend is built with React 18, TypeScript, Vite, TailwindCSS, and Radix UI for a responsive and accessible user interface. The backend uses Node.js with Express and TypeScript. Data persistence is handled by PostgreSQL, managed with Drizzle ORM. AI capabilities for resume analysis and candidate information extraction are powered by the OpenAI API (GPT-3.5-turbo), with a keyword-based fallback scoring mechanism if an OpenAI API key is not provided.

Key architectural decisions include:
- **Unified Resume Processing Pipeline:** All resume ingestion methods (direct upload, Gmail, Outlook) follow a consistent pipeline for text extraction, AI-powered candidate information extraction (name, email, phone), and storage.
- **Robust Authentication:** Supports three methods: Email/Password (bcrypt hashed), Google OAuth, and Microsoft OAuth, ensuring secure user access.
- **Session Management:** Utilizes `express-session` with a PostgreSQL store for persistent and secure user sessions.
- **Modular Design:** The codebase is organized into client and server directories, with clear separation of concerns for UI components, API routes, database operations, and external service integrations.
- **Scalability:** Designed for Replit Autoscale deployment and utilizes Neon for PostgreSQL, ensuring scalability and ease of deployment.

Features include:
- **Email Integration:** Connects with Gmail and Outlook to fetch resumes.
- **Direct Upload:** Supports manual upload of PDF and DOCX resume files.
- **AI-Powered Ranking:** Scores and ranks candidates against job descriptions using OpenAI, with an efficient prompt optimization reducing token usage by 70%.
- **Candidate Information Extraction:** AI-powered extraction of key candidate details from resumes.
- **Dashboard & Reporting:** Provides an overview of candidates, scores, and application history.
- **User Management:** Includes profile and settings pages for account management and history clearing.

## External Dependencies
- **OpenAI API:** Used for AI-powered resume analysis, scoring, and candidate information extraction.
- **Gmail API:** Integrates with Google services for fetching CVs from Gmail accounts.
- **Microsoft Graph API:** Integrates with Microsoft services for fetching CVs from Outlook accounts.
- **PostgreSQL (Neon):** The primary database for storing application data, including user information, resumes, and analysis results.
- **Drizzle ORM:** Used for interacting with the PostgreSQL database.
- **`express-session`:** For server-side session management.
- **bcrypt:** For hashing user passwords.