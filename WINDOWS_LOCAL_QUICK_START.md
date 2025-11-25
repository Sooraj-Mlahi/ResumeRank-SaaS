# ResumeRank - Windows Local Development Quick Start

## ⚡ Ultra-Quick Setup (5 minutes)

### Prerequisites
- ✅ Node.js 20+ (download from https://nodejs.org)
- ✅ PostgreSQL 16+ (download from https://www.postgresql.org/download/windows/)
- ✅ Git (optional, for version control)

### Step 1: PostgreSQL Setup
1. Install PostgreSQL on Windows
2. Remember the password you set (default: `postgres`)
3. Verify it's running: Open PostgreSQL pgAdmin or check Services

### Step 2: Clone/Download Project
```bash
# If using git
git clone <repository-url>
cd ResumeRank-SaaS

# Or extract the downloaded ZIP file
```

### Step 3: Run Startup Script
```bash
# Double-click this file OR run in Command Prompt:
start-windows.bat
```

This script will:
- ✅ Set Node.js memory limit (fixes esbuild errors on Windows)
- ✅ Install dependencies (npm install)
- ✅ Sync database schema (npm run db:push)
- ✅ Start dev server on http://localhost:5000

**That's it!** The app should open in your browser automatically.

---

## 🔐 Login Credentials

**Admin Account:**
```
Email: soorajmalhi18tl48@gmail.com
Password: Sign up first OR use OAuth (Google/Microsoft)
```

**Test Accounts** (already in database):
- john.smith@company.com
- sarah.johnson@company.com
- michael.brown@company.com
- emily.davis@company.com

---

## 📋 Testing Checklist

After startup, test these features:

### Authentication
- [ ] Signup with email/password
- [ ] Login with email/password
- [ ] Logout
- [ ] Admin access (login as soorajmalhi18tl48@gmail.com)

### Admin Panel
- [ ] View Admin Dashboard
- [ ] Manage Users (view all users)
- [ ] View User Activity (click "View Activity" on any user)
- [ ] Browse Resumes

### Resume Management
- [ ] Upload PDF/DOCX files
- [ ] View uploaded resumes
- [ ] Rank resumes with AI (requires OPENAI_API_KEY)

### Email Integration (Optional)
- [ ] Connect Gmail (requires OAuth setup)
- [ ] Connect Outlook (requires OAuth setup)
- [ ] Fetch emails with date filtering

---

## 🆘 Troubleshooting

### Issue: "esbuild not found" or memory error
**Solution:** Run this in PowerShell:
```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

### Issue: PostgreSQL connection error
**Solution:** Check your database:
1. Open PostgreSQL pgAdmin at http://localhost:5050
2. Verify server is running
3. Update `.env.local` if username/password differs from `postgres:postgres`

### Issue: Port 5000 already in use
**Solution:** Kill the process using port 5000:
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: "Database column does not exist" error
**Solution:** Sync database schema:
```bash
npm run db:push --force
```

### Issue: Blank app screen
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check browser console (F12) for errors
4. Check terminal for backend errors

---

## 🚀 Advanced Configuration

### Add OpenAI API Key (for AI Resume Ranking)
1. Get API key from https://platform.openai.com/api-keys
2. Edit `.env.local`:
```env
OPENAI_API_KEY=sk-your-api-key-here
```
3. Restart dev server (Ctrl+C, then re-run `start-windows.bat`)

### Setup Gmail OAuth (Optional)
1. Go to https://console.developers.google.com/
2. Create project > Enable Gmail API > Create OAuth credentials
3. Copy credentials to `.env.local`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
```
4. Restart server

### Setup Outlook OAuth (Optional)
1. Go to https://portal.azure.com/ > App registrations
2. Create new registration > Add credentials
3. Copy to `.env.local`:
```env
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-secret
MICROSOFT_TENANT_ID=your-tenant-id
```
4. Restart server

---

## 📁 Project Structure

```
ResumeRank/
├── client/              # React frontend
│   ├── src/pages/       # Admin dashboard, users, resumes
│   └── src/components/  # UI components
├── server/              # Express backend
│   ├── routes.ts        # API endpoints with activity logging
│   ├── storage.ts       # Database operations
│   └── openai.ts        # AI integration
├── shared/
│   └── schema.ts        # Database schema
├── .env.local           # Your local configuration (DO NOT COMMIT)
├── package.json         # Dependencies
└── start-windows.bat    # Startup script
```

---

## 🛑 To Stop Development

1. Press `Ctrl+C` in the terminal
2. Or close the terminal window
3. The web server will stop automatically

---

## 💾 Database Management

### Reset Database
```bash
# Delete all data and recreate schema:
npm run db:push --force
```

### View Database
1. Open PostgreSQL pgAdmin: http://localhost:5050
2. Server: localhost, User: postgres, Password: postgres
3. Browse to database "resumerank"

### Check User Accounts
```sql
-- In pgAdmin SQL Query tool:
SELECT email, name, is_admin FROM users ORDER BY created_at DESC;
```

---

## 📞 Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review error messages in terminal (server) and F12 console (browser)
3. Ensure PostgreSQL is running on port 5432
4. Verify `.env.local` has correct database credentials
5. Try restarting: Stop server (Ctrl+C) and re-run `start-windows.bat`

---

## ✨ Ready to Go!

Your ResumeRank app is now running locally on Windows. Start with the **Testing Checklist** above to verify everything works!

Happy recruiting! 🎉
