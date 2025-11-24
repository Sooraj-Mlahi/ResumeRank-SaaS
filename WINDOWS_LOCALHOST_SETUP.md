# Windows Localhost Setup Guide - ResumeRank

## Prerequisites
- Node.js 20+ installed
- PostgreSQL 16+ running locally
- Git bash or Windows Terminal

## Quick Start

### 1. Set Environment Variables (PowerShell)
```powershell
# Set maximum memory for Node.js
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Set development environment
$env:NODE_ENV="development"

# Database connection (adjust if needed)
$env:DATABASE_URL="postgresql://user:password@localhost:5432/resumerank"
$env:SESSION_SECRET="your-secret-key-here-change-in-production"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```bash
# Create database schema
npm run db:push

# If you get data-loss warnings:
npm run db:push --force
```

### 4. Login Credentials

**Admin Account:**
- Email: `soorajmalhi18tl48@gmail.com`
- Password: (Use password signup or OAuth)

**Test Accounts:**
- john.smith@company.com
- sarah.johnson@company.com
- michael.brown@company.com
- emily.davis@company.com

### 5. Start Development Server
```powershell
# Make sure environment variables are set (step 1)
npm run dev
```

Server runs on: **http://localhost:5000**

## Features Ready to Test

### Authentication
✅ Email/Password Signup & Login
✅ Gmail OAuth (requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
✅ Outlook OAuth (requires MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID)

### Admin Panel
✅ Admin Dashboard - Global stats and analytics
✅ Manage Users - View all users, search, see activity
✅ Browse Resumes - Search all resumes across system

### Resume Management
✅ Upload PDF/DOCX files
✅ Fetch from Gmail (with date filtering)
✅ Fetch from Outlook (with date filtering)
✅ AI-powered ranking with OpenAI

## Windows-Specific Issues & Solutions

### Issue: "esbuild" errors with Node 24
**Solution:**
```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
```

### Issue: Port 5000 already in use
**Solution:**
```powershell
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: Database connection errors
**Solution:**
```powershell
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify DATABASE_URL format
echo $env:DATABASE_URL
```

### Issue: Long file paths on Windows
**Solution:**
Enable long paths in Windows:
```powershell
# Run as Administrator
reg add HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1
```

## Testing Checklist

- [ ] Signup with email/password
- [ ] Login with email/password
- [ ] View admin panel (if admin user)
- [ ] Upload resume
- [ ] Fetch from Gmail (if OAuth configured)
- [ ] Fetch from Outlook (if OAuth configured)
- [ ] Rank resumes with AI
- [ ] View admin dashboard
- [ ] Search users in manage users
- [ ] View user activity

## Database Verification

```bash
# Connect to PostgreSQL and verify tables
psql -U postgres -d resumerank -c "\dt"

# Check users table
psql -U postgres -d resumerank -c "SELECT email, name, provider, is_admin FROM users ORDER BY created_at DESC;"

# Check admin user
psql -U postgres -d resumerank -c "SELECT email, is_admin FROM users WHERE email = 'soorajmalhi18tl48@gmail.com';"
```

## Optional: Add OAuth Credentials

1. **Google OAuth:**
   - Get credentials from: https://console.cloud.google.com/
   - Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

2. **Microsoft OAuth:**
   - Get credentials from: https://portal.azure.com/
   - Set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID

## Production Deployment

When ready to deploy:
```bash
npm run build
npm start
```

Deploy to Replit or your hosting platform.

## Troubleshooting

**App shows blank screen:**
- Check browser console for errors
- Verify DATABASE_URL is correct
- Run `npm run db:push`

**Admin panel not showing:**
- Confirm you're logged in as admin user
- Check user's `is_admin` = 1 in database
- Refresh browser page

**Resume upload not working:**
- Check file size (max ~10MB for base64)
- Ensure file is PDF or DOCX
- Check server logs for extraction errors

## Support

For issues, check:
1. Server logs in terminal
2. Browser console (F12)
3. Database state with `psql`
