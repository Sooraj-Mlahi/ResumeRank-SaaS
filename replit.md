# ResumeRank - AI-Powered Resume Screening Application

## Overview
ResumeRank is a comprehensive resume screening and ranking application that helps recruiters efficiently manage and evaluate job candidates. The application fetches CVs/resumes from email providers (Gmail/Outlook), extracts candidate information, and uses AI to rank candidates based on job requirements.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Radix UI components
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Neon-backed via Replit)
- **ORM**: Drizzle ORM
- **AI**: OpenAI API (GPT-3.5-turbo for resume analysis)
- **Email Integration**: Gmail API and Microsoft Graph API (Outlook)
- **Session Management**: express-session with PostgreSQL store

## Project Structure
```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components (Header, Theme provider, Radix UI)
│   │   ├── hooks/       # React hooks
│   │   ├── lib/         # Utilities (React Query client)
│   │   ├── pages/       # Application pages (Dashboard, Login, Fetch CVs, Rank Resumes)
│   │   ├── App.tsx      # Main app component with routing
│   │   └── main.tsx     # React entry point
│   └── index.html       # HTML template
├── server/              # Express backend
│   ├── cv-extractor.ts  # Extract text from PDF/DOCX files
│   ├── db.ts            # Database connection
│   ├── gmail.ts         # Gmail API integration
│   ├── gmail-oauth.ts   # Gmail OAuth flow
│   ├── index.ts         # Server entry point
│   ├── openai.ts        # OpenAI API integration for resume scoring
│   ├── outlook.ts       # Outlook API integration
│   ├── outlook-oauth.ts # Outlook OAuth flow
│   ├── routes.ts        # API route handlers
│   ├── storage.ts       # Database operations
│   └── vite.ts          # Vite dev server setup
├── shared/
│   └── schema.ts        # Drizzle database schema
└── migrations/          # Database migrations
```

## Features
1. **Email Integration**: Connect Gmail or Outlook accounts to fetch CVs
2. **CV Extraction**: Automatically extract text from PDF and DOCX resume files
3. **AI-Powered Ranking**: Use OpenAI to score and rank candidates against job descriptions
4. **Dashboard**: View all candidates, their scores, and application history
5. **Multi-Provider Support**: Work with both Gmail and Microsoft Outlook

## Environment Setup

### Required Environment Variables (Already Configured)
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `SESSION_SECRET` - Session encryption key (auto-configured by Replit)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)

### Optional API Keys (Required for Full Functionality)
Add these in the Replit Secrets tab:

1. **OPENAI_API_KEY** (Required for AI ranking features)
   - Get from: https://platform.openai.com/api-keys
   - Format: `sk-proj-...`
   - Used for: Resume scoring and candidate info extraction

2. **Google OAuth** (Optional - for Gmail integration)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - Setup: https://console.developers.google.com/
   - See: SETUP-GUIDE.md for detailed instructions

3. **Microsoft OAuth** (Optional - for Outlook integration)
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_CLIENT_SECRET`
   - `MICROSOFT_TENANT_ID`
   - Setup: https://portal.azure.com/
   - See: OUTLOOK-SETUP.md for detailed instructions

## Development

### Running the Application
```bash
npm run dev
```
The application will start on port 5000 with hot-reloading enabled.

### Database Migrations
```bash
npm run db:push
```
Pushes schema changes to the database. Use `npm run db:push --force` if you get data-loss warnings.

### Type Checking
```bash
npm run check
```

## Database Schema

### Tables
- **users**: User accounts (email provider authentication)
- **email_connections**: Email provider connection details
- **fetch_history**: History of CV fetch operations
- **resumes**: Candidate CVs/resumes with extracted text
- **analyses**: Job analysis sessions
- **analysis_results**: Resume scores and rankings for each analysis

## API Routes

### Authentication
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/callback/google` - Google OAuth callback
- `GET /api/auth/microsoft` - Initiate Microsoft OAuth
- `GET /api/auth/callback/microsoft` - Microsoft OAuth callback
- `POST /api/auth/logout` - Logout user

### CV Management
- `GET /api/cvs` - List all CVs
- `POST /api/cvs/fetch` - Fetch CVs from email
- `POST /api/cvs/upload` - Upload CV file manually
- `DELETE /api/cvs/:id` - Delete a CV

### Analysis
- `GET /api/analyses` - List all analyses
- `POST /api/analyses` - Create new analysis
- `POST /api/analyses/:id/analyze` - Run analysis on resumes
- `GET /api/analyses/:id/results` - Get analysis results

## Current State
✅ Database configured and migrated
✅ Server running on port 5000
✅ Frontend serving correctly
✅ Vite hot-reload enabled
✅ Session management configured
✅ Ready for email provider OAuth setup
⚠️ Needs OPENAI_API_KEY for AI features to work

## Next Steps for User
1. **Add OpenAI API Key**: Add `OPENAI_API_KEY` to Replit Secrets for AI-powered resume ranking
2. **Optional - Setup Email Integration**:
   - For Gmail: Configure Google OAuth credentials (see SETUP-GUIDE.md)
   - For Outlook: Configure Microsoft Azure credentials (see OUTLOOK-SETUP.md)
3. **Test the Application**: Upload or fetch CVs and create job analyses

## Deployment
The application is configured for Replit Autoscale deployment:
- Build command: `npm run build`
- Start command: `npm start`
- The build process compiles both the Vite frontend and backend server

## Notes
- The application uses Vite with `allowedHosts: true` to work correctly with Replit's proxy
- Sessions are stored in PostgreSQL for persistence
- The app gracefully degrades if OpenAI API key is not configured (shows warning but still starts)
- Email integrations are optional - you can manually upload CVs without email access

## Troubleshooting
- If Vite shows connection errors, ensure the server is running on port 5000
- For database issues, check that DATABASE_URL is properly set
- For OpenAI errors, verify your API key is valid and has credits
- For email integration issues, see GMAIL-TROUBLESHOOTING.md and OUTLOOK-SETUP.md

## Recent Changes
- **2024-11-21**: Initial Replit setup
  - Fixed package.json scripts for Linux compatibility (removed Windows `set` command)
  - Configured PostgreSQL database
  - Set up environment variables
  - Fixed route conflicts between Express and Vite middleware
  - Made OpenAI API key optional for initial startup
  - Configured deployment settings for production
