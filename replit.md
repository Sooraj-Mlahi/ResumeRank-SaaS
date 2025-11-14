# ResumeRank - AI-Powered Resume Screening SaaS

## Overview

ResumeRank is a SaaS application that automates resume screening by fetching CVs from email inboxes (Gmail/Outlook) and ranking them using AI-powered analysis. The platform enables recruiters to input job requirements and receive scored, ranked candidates with detailed AI-generated insights on strengths and weaknesses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React with TypeScript using Vite as the build tool
- Client-side routing via Wouter (lightweight alternative to React Router)
- Component library based on shadcn/ui (Radix UI primitives with Tailwind CSS)

**State Management:**
- TanStack Query (React Query) for server state management and data fetching
- Session-based authentication state via API endpoint polling
- Local state managed with React hooks

**Styling Approach:**
- Tailwind CSS with custom design system following Material Design 3 principles
- Theme provider supporting light/dark modes with CSS variables
- Typography: Inter for UI text, JetBrains Mono for monospaced content
- Custom utility classes for elevation effects (hover-elevate, active-elevate-2)

**Design System:**
- shadcn/ui components configured in "new-york" style
- Comprehensive component library including forms, tables, dialogs, cards, and data displays
- Responsive layouts with mobile-first approach using Tailwind breakpoints

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- Session-based authentication using express-session
- RESTful API design pattern

**Authentication Strategy:**
- Simple session-based auth (no external providers like NextAuth)
- In-memory session store for development (should migrate to persistent store for production)
- Session cookies with 7-day expiration
- Auth middleware protecting API routes

**API Structure:**
- `/api/auth/*` - Authentication endpoints (login, logout, session management)
- `/api/email/*` - Email connection and CV fetching operations
- `/api/resumes/*` - Resume operations (count, ranking, analysis)
- `/api/dashboard/*` - Dashboard statistics aggregation

**File Processing Pipeline:**
1. Email integration retrieves attachments from Gmail/Outlook
2. CV extraction service processes PDF and DOCX files using pdf-parse and mammoth
3. Extracted text stored in database
4. OpenAI API analyzes resume against job requirements
5. Results ranked and stored with detailed scoring

### Data Storage

**Database:**
- PostgreSQL via Neon serverless database
- Drizzle ORM for type-safe database operations
- WebSocket connection pooling (@neondatabase/serverless)

**Schema Design:**
- `users` - User accounts with OAuth provider information
- `resumes` - Extracted CV data with candidate information and file storage (base64)
- `analyses` - Resume ranking sessions tied to job descriptions
- `analysisResults` - Individual resume scores with AI-generated feedback
- `emailConnections` - Email provider connection status and metadata

**Relationships:**
- Users own multiple resumes and analyses (cascade delete)
- Analyses contain multiple analysis results
- Analysis results reference both analyses and resumes

### External Dependencies

**AI & Machine Learning:**
- OpenAI API (GPT-5 model) for resume scoring and analysis
- Structured JSON output for consistent scoring format
- Prompt engineering for HR-focused resume evaluation
- Extracts: numerical scores (0-100), strengths, weaknesses, summaries, and candidate info

**Email Integration:**
- Gmail API via Google APIs Node.js client
- Connector-based authentication using Replit's connection system
- Automatic token refresh handling
- Email attachment fetching and parsing

**Document Processing:**
- pdf-parse - Extract text from PDF resumes
- mammoth - Extract text from DOCX/DOC files
- Base64 encoding for file storage in database

**Third-Party Services:**
- Neon Database - Serverless PostgreSQL hosting
- OpenAI - AI-powered resume analysis
- Google Mail API - Gmail inbox access
- Replit Connectors - Simplified OAuth and API credential management

**Development Tools:**
- Replit-specific plugins for development banner and error overlay
- Source map support for debugging (@jridgewell/trace-mapping)

### Data Flow

1. **Authentication:** User logs in → Session created → User data fetched from database
2. **CV Fetching:** Email API connection → Fetch attachments → Extract text → Store in database
3. **Resume Ranking:** User submits job prompt → Fetch resumes → Score via OpenAI → Store results → Display ranked list
4. **Results Display:** Fetch analysis → Join with resume data → Display scores, insights, and download options

### Security Considerations

- Session-based authentication with HTTP-only cookies
- CSRF protection via session secrets
- Database credentials managed via environment variables
- API keys (OpenAI, Gmail) secured in environment
- File uploads stored as base64 in database (consider external storage for production scaling)

### Deployment Architecture

- Build process: Vite builds client → esbuild bundles server
- Production serves static files from Express
- Database migrations via Drizzle Kit
- Environment-specific configurations for development vs production