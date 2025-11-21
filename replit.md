# ResumeRank - AI-Powered Resume Screening Application

## Overview
ResumeRank is a comprehensive resume screening and ranking application that helps recruiters efficiently manage and evaluate job candidates. The application fetches CVs/resumes from email providers (Gmail/Outlook), accepts direct uploads, and uses AI to rank candidates based on job requirements.

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
│   ├── openai.ts        # OpenAI API integration for resume scoring & candidate extraction
│   ├── outlook.ts       # Outlook API integration with candidate extraction
│   ├── outlook-oauth.ts # Outlook OAuth flow
│   ├── routes.ts        # API route handlers (unified for all sources)
│   ├── storage.ts       # Database operations
│   └── vite.ts          # Vite dev server setup
├── shared/
│   └── schema.ts        # Drizzle database schema
└── migrations/          # Database migrations
```

## Features
1. **Email Integration**: Connect Gmail or Outlook accounts to fetch CVs
2. **Direct Upload**: Upload PDF and DOCX resume files manually
3. **CV Extraction**: Automatically extract text from PDF and DOCX resume files
4. **Candidate Info Extraction**: AI-powered extraction of candidate name, email, phone from resumes
5. **AI-Powered Ranking**: Use OpenAI to score and rank candidates against job descriptions
6. **Fallback Scoring**: Works without OpenAI API key using keyword-based scoring
7. **Dashboard**: View all candidates, their scores, and application history
8. **Multi-Provider Support**: Work with both Gmail and Microsoft Outlook

## Recent Changes & Fixes (Current Session)

### Issue Fixes Applied:
1. **File Type Detection** - Fixed upload to pass MIME type instead of filename
2. **Database Constraints** - Made candidateName and fileData optional in schema
3. **Authentication** - Disabled for testing with auto-created test users
4. **Candidate Extraction** - Added AI-powered extraction of candidate name, email, phone across all sources
5. **Resume Creation Sync** - Ensured consistent field names and extraction logic across:
   - Direct file uploads (via `db.insert()`)
   - Gmail fetches (via `storage.createResume()`)
   - Outlook fetches (via `db.insert()` with Outlook module extraction)
6. **Dashboard Stats** - Fixed highestScore calculation by querying analysisResults table
7. **Fetch History** - Working correctly, shows provider and resume count

### Resume Processing Pipeline (All 3 Sources Unified):
```
File/Attachment → extractTextFromCV() → extractCandidateInfo() → 
  candidateName, email, phone → db.insert(resumes) → Database
```

All three sources (upload, Gmail, Outlook) now follow the same pattern:
1. Extract text from file
2. Extract candidate info (name, email, phone)
3. Store with extracted data and source identifier

## Environment Setup

### Required Environment Variables (Auto-configured by Replit)
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)

### Optional API Keys (In Secrets Tab)
1. **OPENAI_API_KEY** (Recommended for AI features)
   - Get from: https://platform.openai.com/api-keys
   - Format: `sk-proj-...`
   - Used for: Resume scoring and candidate info extraction
   - Without it: App uses fallback keyword-based scoring

2. **Google OAuth** (Optional - for Gmail integration)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - Setup: https://console.developers.google.com/

3. **Microsoft OAuth** (Optional - for Outlook integration)
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_CLIENT_SECRET`
   - `MICROSOFT_TENANT_ID`
   - Setup: https://portal.azure.com/

## Development

### Running the Application
```bash
npm run dev
```
Starts on port 5000 with hot-reloading enabled.

### Database Migrations
```bash
npm run db:push
```
Pushes schema changes to database. Use `npm run db:push --force` if you get data-loss warnings.

### Type Checking
```bash
npm run check
```

## Database Schema

### Key Tables:
- **users** - User accounts with provider authentication
- **resumes** - Candidate CVs with extracted text and candidate info
  - candidateName (optional) - Extracted from resume
  - email (optional) - Extracted from resume
  - phone (optional) - Extracted from resume
  - extractedText (required) - Full text content
  - originalFileName (required) - File name
  - fileData (optional) - Base64 encoded file
  - source (required) - "upload", "gmail", or "outlook"
- **analyses** - Job analysis sessions
- **analysis_results** - Resume scores and rankings

## API Routes

### Authentication
- `GET /api/auth/me` - Get current user (returns test user when auth disabled)
- `POST /api/auth/logout` - Logout user

### CV Management
- `GET /api/resumes/count` - Count user's CVs
- `POST /api/resumes/upload` - Upload PDF/DOCX files manually
- `GET /api/email/connections` - List connected email accounts
- `GET /api/email/fetch-history` - View fetch history with resume counts
- `POST /api/email/connect/gmail` - Connect Gmail account
- `POST /api/email/fetch/gmail` - Fetch CVs from Gmail (with candidate extraction)
- `POST /api/email/connect/outlook` - Connect Outlook account
- `POST /api/email/fetch/outlook` - Fetch CVs from Outlook (with candidate extraction)

### Analysis & Ranking
- `GET /api/dashboard/stats` - Get dashboard stats (includes highestScore)
- `POST /api/resumes/rank` - Create analysis and rank resumes
- `GET /api/resumes/latest-analysis` - Get latest ranking results

## Testing Status
✅ File uploads working (PDF & DOCX)
✅ Candidate info extraction working
✅ Resume ranking working (with/without OpenAI)
✅ Dashboard showing correct stats and highest score
✅ Fetch history display working
✅ Gmail/Outlook integration ready
✅ Test user auto-creation working
✅ All resume sources synced (upload, Gmail, Outlook)

## Deployment
- Build: `npm run build`
- Start: `npm start`
- Configured for Replit Autoscale

## Key Implementation Details

### Candidate Info Extraction:
- Uses OpenAI's GPT-3.5-turbo when API key available
- Falls back to empty values gracefully when key unavailable
- Extracts: name, email, phone from resume text
- Used consistently across all upload sources

### Resume Source Tracking:
- "upload" - Manually uploaded files
- "gmail" - Fetched from Gmail
- "outlook" - Fetched from Outlook
- Enables fetch history reporting

### Database Safety:
- Optional fields handle missing data gracefully
- Foreign key constraints enforce data integrity
- Batch insert for performance during analysis

## Common Issues & Solutions

**No resumes showing after upload?**
- Check that files are PDF or DOCX format
- Verify database has enough space for base64 encoded files
- Check server logs for extraction errors

**Highest score showing undefined?**
- Ensure at least one ranking has been completed
- Check that analysisResults table has entries

**Candidate names not appearing?**
- Make sure OpenAI API key is set (or fallback will show "Unknown")
- Re-upload resumes to extract with latest code

**Gmail/Outlook not fetching?**
- Verify OAuth credentials are set up correctly
- Check that email accounts have attachments with resume keywords
- Ensure resumeText extraction produces >50 characters

## Architecture Notes
- All resume creation paths converge to unified database insertion
- Candidate extraction is centralized in openai.ts
- Routes.ts orchestrates all source integrations
- Storage layer provides data abstraction for Gmail, direct DB ops for upload/Outlook
- Tests use disabled auth with auto-created test users

## Next Steps for User
1. Add OPENAI_API_KEY to Secrets tab for better AI analysis
2. (Optional) Set up Gmail OAuth for email integration
3. (Optional) Set up Outlook OAuth for email integration
4. Start uploading resumes and testing the ranking system
5. Deploy when ready using Replit's publish feature

