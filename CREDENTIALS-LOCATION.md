# 🔑 WHERE TO PUT YOUR API KEYS & CREDENTIALS

## 📍 EXACT LOCATIONS

### 1. 🗂️ Main Configuration File: `.env`
**File Location:** `d:\fiverr\SaaSBuilder\.env`

```env
# OpenAI API Key (REQUIRED for CV ranking/scoring)
OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here

# Database URL (REQUIRED for storing CVs)
DATABASE_URL=postgresql://username:password@host:port/database_name

# Gmail API Credentials (OPTIONAL - for Gmail CV fetching)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Microsoft Outlook API (OPTIONAL - for Outlook CV fetching)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_TENANT_ID=your-tenant-id

# Session Configuration (REQUIRED)
SESSION_SECRET=your-secure-random-session-secret

# App Settings
NODE_ENV=development
PORT=5000
```

---

## 🎯 PRIORITY ORDER (Start with these)

### ✅ 1. OpenAI API Key (HIGHEST PRIORITY)
**What it does:** Powers the CV scoring and candidate ranking system
**Where to get it:** https://platform.openai.com/api-keys
**Where to put it:** `.env` file
```env
OPENAI_API_KEY=sk-proj-your-key-here
```

### ✅ 2. Database URL (HIGH PRIORITY)
**What it does:** Stores CVs, user data, and analysis results
**Where to get it:** 
- NeonDB (free): https://neon.tech/
- Supabase (free): https://supabase.com/
- Local PostgreSQL
**Where to put it:** `.env` file
```env
DATABASE_URL=postgresql://username:password@host:port/dbname
```

### ✅ 3. Email API Credentials (MEDIUM PRIORITY)
**What it does:** Fetches CV attachments from Gmail/Outlook
**Choose ONE:**
- **Gmail:** Google Cloud Console → Enable Gmail API → OAuth 2.0 credentials
- **Outlook:** Azure Portal → App Registration → API permissions

---

## 🚀 TESTING WITHOUT FULL SETUP

You can test the CV extraction and ranking WITHOUT email APIs:

```bash
# Test CV processing workflow
node test-complete-pipeline.cjs

# Test email simulation
node test-gmail-simulation.cjs

# Check your environment setup
node check-env.mjs
```

---

## 📂 FILE STRUCTURE

```
d:\fiverr\SaaSBuilder\
├── .env                    ← 🔑 YOUR API KEYS GO HERE
├── .env.example           ← Template to copy from
├── SETUP-GUIDE.md         ← Detailed setup instructions
├── check-env.mjs          ← Check if your keys are configured
├── server/
│   ├── openai.ts          ← Uses OPENAI_API_KEY
│   ├── db.ts              ← Uses DATABASE_URL
│   └── gmail.ts           ← Uses GOOGLE_CLIENT_ID/SECRET
└── test-*.cjs             ← Test scripts (work without APIs)
```

---

## ⚡ QUICK START COMMANDS

```bash
# 1. Create your environment file
cp .env.example .env

# 2. Edit .env with your actual API keys
notepad .env

# 3. Check configuration
node check-env.mjs

# 4. Test CV extraction (works without database)
node test-complete-pipeline.cjs

# 5. When ready, start the app
npm run dev
```

---

## 🔍 VERIFICATION

Run this to check if your keys are properly configured:
```bash
node check-env.mjs
```

You should see:
- ✅ OpenAI API Key
- ✅ Database URL  
- ✅ At least one email provider (Gmail OR Outlook)

---

## 🎯 MINIMAL SETUP (For Testing)

**Absolute minimum to get started:**
1. OpenAI API key (for CV scoring)
2. Session secret (any random string)

**Add these to `.env`:**
```env
OPENAI_API_KEY=sk-your-openai-key
SESSION_SECRET=any-random-string-here
NODE_ENV=development
```

Then run: `node test-complete-pipeline.cjs` to see the full workflow!

---

**🎉 Once you have the OpenAI API key, the entire CV ranking system works perfectly!**