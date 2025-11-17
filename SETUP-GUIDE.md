# 🔑 API Keys & Credentials Setup Guide

## 📋 Quick Setup Checklist

### ✅ Step 1: Copy Environment File
```bash
# Copy the example file to create your local environment
cp .env.example .env
```

### ✅ Step 2: Get OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign up/Login to your OpenAI account
3. Click "Create new secret key"
4. Copy the key and add it to `.env`:
```env
OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
```

### ✅ Step 3: Setup Gmail API (for fetching CVs from Gmail)

#### 3A. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

#### 3B. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Client Secret to `.env`:
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here
```

### ✅ Step 4: Setup Microsoft Outlook API (for fetching CVs from Outlook)

#### 4A. Create Azure App Registration
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Set redirect URI: `http://localhost:5000/api/auth/microsoft/callback`

#### 4B. Configure API Permissions
1. In your app registration, go to "API permissions"
2. Add permissions for Microsoft Graph:
   - `Mail.Read`
   - `User.Read`
3. Grant admin consent if required

#### 4C. Create Client Secret
1. Go to "Certificates & secrets"
2. Create a new client secret
3. Copy values to `.env`:
```env
MICROSOFT_CLIENT_ID=your-application-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret-value
MICROSOFT_TENANT_ID=your-tenant-id
```

### ✅ Step 5: Setup Database (Choose One)

#### Option A: NeonDB (Recommended - Free Tier Available)
1. Go to [NeonDB](https://neon.tech/)
2. Create a free account and database
3. Copy the connection string to `.env`:
```env
DATABASE_URL=postgresql://username:password@host-region.neon.tech:5432/dbname?sslmode=require
```

#### Option B: Supabase (Alternative)
1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Copy the database URL from project settings

#### Option C: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database
3. Use connection string:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/your_db_name
```

### ✅ Step 6: Test Your Setup

#### 6A. Install Dependencies
```bash
npm install
```

#### 6B. Run Database Migration
```bash
npm run db:push
```

#### 6C. Start Development Server
```bash
npm run dev
```

#### 6D. Test Email CV Fetching (No Database Required)
```bash
# Run the test scripts we created earlier
node test-email-simple.cjs
node test-gmail-simulation.cjs
node test-complete-pipeline.cjs
```

## 🔐 Security Notes

⚠️ **IMPORTANT:** 
- Never commit `.env` file to git
- Use strong, unique passwords
- In production, use environment variables or secure secret management
- Regenerate all keys when moving to production

## 🚀 Quick Test Commands

```bash
# Test CV extraction without any APIs
node test-email-simple.cjs

# Test complete pipeline simulation
node test-complete-pipeline.cjs

# Check if all environment variables are loaded
node -e "console.log('DATABASE_URL:', !!process.env.DATABASE_URL); console.log('OPENAI_API_KEY:', !!process.env.OPENAI_API_KEY);"
```

## 📞 Troubleshooting

### Problem: "OPENAI_API_KEY must be set"
**Solution:** Make sure you have the OpenAI API key in your `.env` file and it starts with `sk-`

### Problem: "DATABASE_URL must be set"  
**Solution:** Set up a database (NeonDB recommended) and add the connection string to `.env`

### Problem: Gmail API not working
**Solution:** 
1. Check that Gmail API is enabled in Google Cloud Console
2. Verify OAuth credentials are correct
3. Make sure redirect URIs match exactly

### Problem: TypeScript compilation errors
**Solution:** Run `npm run check` to see specific errors, we've already fixed the main ones

## 🎯 Next Steps After Setup

1. **Test with real data:** Upload actual CV files
2. **Customize scoring:** Modify the AI scoring algorithm for your needs  
3. **Add more email providers:** Extend to Yahoo, etc.
4. **Deploy to production:** Use Vercel, Railway, or similar platform

---

**🎉 Once you have the API keys set up, the entire CV extraction and ranking system will work perfectly!**