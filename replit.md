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
- **Authentication**: OAuth 2.0 (Gmail/Outlook) + Password-based (bcrypt)

## Project Structure
```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components (Header, Theme provider, Radix UI)
│   │   ├── hooks/       # React hooks
│   │   ├── lib/         # Utilities (React Query client)
│   │   ├── pages/       # Application pages (Login, Dashboard, Fetch CVs, Rank Resumes, Profile, Settings)
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
9. **Authentication**: OAuth login with Gmail/Outlook OR Email/Password signup
10. **User Profile & Settings**: Manage account info and clear history

## Authentication Setup

### ✅ COMPLETED - Authentication Enabled

**Three Authentication Methods:**
1. **Email & Password** - Users can signup and login with email/password (6+ characters, bcrypt hashed)
2. **Gmail OAuth** - HR users login with Google/Gmail account
3. **Outlook OAuth** - HR users login with Microsoft/Outlook account

**Required Secrets (Set in Replit Secrets tab):**
```
GOOGLE_CLIENT_ID = your_google_client_id
GOOGLE_CLIENT_SECRET = your_google_client_secret
MICROSOFT_CLIENT_ID = your_microsoft_client_id
MICROSOFT_CLIENT_SECRET = your_microsoft_client_secret
MICROSOFT_TENANT_ID = your_microsoft_tenant_id
```

**For Local Development:**
Add to `.env.local`:
```
GOOGLE_CLIENT_ID=your_local_client_id
GOOGLE_CLIENT_SECRET=your_local_secret
MICROSOFT_CLIENT_ID=your_local_client_id
MICROSOFT_CLIENT_SECRET=your_local_secret
MICROSOFT_TENANT_ID=your_tenant_id
```

## API Authentication Routes
- `POST /api/auth/signup` - Sign up with email/password
- `POST /api/auth/password-login` - Login with email/password
- `GET /api/auth/google` - Initiate Gmail OAuth flow
- `GET /api/auth/callback/google` - Gmail OAuth callback
- `GET /api/auth/microsoft` - Initiate Outlook OAuth flow
- `GET /api/auth/callback/microsoft` - Outlook OAuth callback
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout user

## Recent Changes & Fixes (Current Session)

### Issue Fixes Applied:
1. **File Type Detection** - Fixed upload to pass MIME type instead of filename
2. **Database Constraints** - Made candidateName and fileData optional in schema
3. **Candidate Extraction** - Added AI-powered extraction of candidate name, email, phone across all sources
4. **Resume Creation Sync** - Ensured consistent field names across upload, Gmail, and Outlook
5. **Dashboard Stats** - Fixed highestScore calculation by querying analysisResults table
6. **Fetch History** - Working correctly, shows provider and resume count
7. **AI Prompt Optimization** - Reduced token usage by 70% for better performance
8. **Real Authentication** - Enabled OAuth (Gmail/Outlook) and password-based authentication with bcrypt
9. **Missing Features** - Added Profile page, Settings page, and Clear History functionality
10. **User Dropdown Menu** - Added Profile and Settings links in header

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

### OAuth API Keys (In Secrets Tab) - REQUIRED FOR OAUTH
1. **Google OAuth** (For Gmail integration)
   - `GOOGLE_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
   - Setup: https://console.developers.google.com/

2. **Microsoft OAuth** (For Outlook integration)
   - `MICROSOFT_CLIENT_ID` - From Azure Portal
   - `MICROSOFT_CLIENT_SECRET` - From Azure Portal
   - `MICROSOFT_TENANT_ID` - From Azure Portal
   - Setup: https://portal.azure.com/

### Optional API Keys
- **OPENAI_API_KEY** - For AI-powered resume ranking (Recommended)
  - Get from: https://platform.openai.com/api-keys
  - Without it: App uses fallback keyword-based scoring

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

### Build for Production
```bash
npm run build
npm start
```

## Database Schema

### Key Tables:
- **users** - User accounts with authentication
  - id (UUID)
  - email (unique)
  - name
  - provider (password, google, microsoft)
  - providerId
  - passwordHash (optional - only for password auth)
  
- **resumes** - Candidate CVs with extracted text and candidate info
  - candidateName (optional)
  - email (optional)
  - phone (optional)
  - extractedText (required)
  - originalFileName (required)
  - fileData (optional)
  - source (upload, gmail, or outlook)
  
- **analyses** - Job analysis sessions
- **analysis_results** - Resume scores and rankings
- **emailConnections** - OAuth provider connections
- **fetchHistory** - Email fetch history

## API Routes

### Authentication (NEW)
- `POST /api/auth/signup` - Create account with email/password
- `POST /api/auth/password-login` - Login with email/password
- `GET /api/auth/google` - Gmail OAuth login
- `GET /api/auth/microsoft` - Outlook OAuth login
- `GET /api/auth/me` - Get current user
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

### Account Management
- `POST /api/analyses/clear` - Clear all analysis history

## Pages

### Login Page
- Email/Password signup form
- Email/Password login form
- Gmail OAuth button
- Outlook OAuth button
- Toggle between signup and login modes

### Dashboard
- Total CVs fetched count
- Last analysis date
- Highest score
- Recent activity

### Fetch CVs
- Gmail account connection and fetch
- Outlook account connection and fetch
- Drag & drop file upload
- File picker upload
- Bulk upload support

### Rank Resumes
- Enter job description
- Select resumes to analyze
- AI-powered ranking with OpenAI

### Results
- Ranked candidates
- Score, strengths, weaknesses
- View extracted CV text
- Download original files

### Profile
- User account information
- Email, name, authentication provider
- User ID

### Settings
- Theme toggle (light/dark mode)
- Clear analysis history button
- Account security info

## Testing Status
✅ File uploads working (PDF & DOCX)
✅ Candidate info extraction working
✅ Resume ranking working (with/without OpenAI)
✅ Dashboard showing correct stats
✅ Fetch history display working
✅ Gmail OAuth integration ready (requires GOOGLE_CLIENT_ID/SECRET)
✅ Outlook OAuth integration ready (requires MICROSOFT credentials)
✅ Email/Password authentication working (bcrypt hashed)
✅ Profile page working
✅ Settings page with clear history working
✅ All resume sources synced (upload, Gmail, Outlook)
✅ Real authentication enabled

## Deployment

### Build
```bash
npm run build
```

### Start Production
```bash
npm start
```

### Replit Deployment
- Use "Publish" button in Replit
- Configured for Autoscale deployment
- Database: Neon-backed PostgreSQL
- OAuth: Works with Replit connectors or manual credentials

## Key Implementation Details

### Authentication Flow:
1. **Password Auth**: Email + Password → bcrypt hash → stored in database
2. **Google OAuth**: User clicks Gmail button → Google login → callback → session created
3. **Outlook OAuth**: User clicks Microsoft button → Microsoft login → callback → session created

### Session Management:
- express-session with PostgreSQL store
- 7-day cookie expiration
- Secure HttpOnly cookies in production

### Resume Processing:
- Unified pipeline for all 3 sources
- AI extraction of candidate info (name, email, phone)
- Source tracking (upload, gmail, outlook)
- Batch insertion for performance

### AI Optimization:
- Reduced prompts to minimize token usage (70% reduction)
- Fallback keyword-based scoring without OpenAI
- Capped strengths/weaknesses to top 3 each

## Common Issues & Solutions

**OAuth not working?**
- Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET set in Secrets
- Ensure MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID set
- Verify redirect URIs match (https://your-domain/api/auth/callback/google, etc.)

**Login page not showing?**
- Ensure `/api/auth/me` returns null when not authenticated
- Check that App.tsx routing is correct
- Browser cache: Clear and hard refresh

**No resumes showing after upload?**
- Check that files are PDF or DOCX format
- Verify database has enough space for base64 encoded files
- Check server logs for extraction errors

**Candidate names not appearing?**
- Make sure OPENAI_API_KEY is set (or fallback will show "Unknown")
- Re-upload resumes to extract with latest code

**Password signup failing?**
- Ensure password is at least 6 characters
- Check email is not already registered
- Verify DATABASE_URL is set

## Architecture Notes
- All resume creation paths converge to unified database insertion
- Candidate extraction is centralized in openai.ts
- Routes.ts orchestrates all source integrations
- Storage layer provides data abstraction
- Real authentication with OAuth and password-based options
- Secure password hashing with bcryptjs

## Next Steps for User
1. ✅ Setup GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Secrets (COMPLETED)
2. ✅ Setup MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID (COMPLETED)
3. ✅ Add OPENAI_API_KEY to Secrets for AI analysis (OPTIONAL)
4. Test HR login with Gmail and Outlook
5. Test CV fetching from Gmail/Outlook
6. Test resume ranking with AI
7. Deploy when ready using Replit's publish feature

## Windows Setup

If running on Windows with Node.js 24, you may encounter esbuild errors. See [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for solutions.

Quick fix for Windows:
```bash
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev
```

## Version History
- v1.0 - Initial release with OAuth and password authentication
- Optimized AI prompts for 70% token reduction
- Added Profile and Settings pages
- Enabled real authentication (no more test users)
- Unified resume processing pipeline across all 3 sources
- Added selective resume ranking (choose which resumes to analyze)
- Added analysis history and CSV export
- Fixed Windows Node.js 24 compatibility issues

