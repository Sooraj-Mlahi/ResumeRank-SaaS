# Production Deployment Guide

## Overview
This guide explains how to deploy ResumeRank SaaS to production and configure OAuth for real users.

## 🚀 Production OAuth Configuration

### Environment Variables for Production

Add these to your production environment:

```env
NODE_ENV=production
PRODUCTION_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

## 📧 Google Cloud Console Setup for Production

### 1. Create/Update OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or use existing one
3. Enable **Gmail API** in APIs & Services
4. Go to **APIs & Services → Credentials**
5. Create OAuth 2.0 Client ID

### 2. Configure Authorized Redirect URIs
Add BOTH development and production URIs:
```
http://localhost:5000/api/auth/gmail/callback    (for development)
https://yourdomain.com/api/auth/gmail/callback   (for production)
```

### 3. Configure Authorized JavaScript Origins
```
http://localhost:5000    (for development) 
https://yourdomain.com   (for production)
```

## 🏢 Microsoft Azure Setup for Production

### 1. Create App Registration
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory → App registrations**
3. Create **New registration**

### 2. Configure Redirect URIs
In your app registration settings:
```
http://localhost:5000/api/auth/outlook/callback    (for development)
https://yourdomain.com/api/auth/outlook/callback   (for production)
```

### 3. API Permissions
Add these Microsoft Graph permissions:
- `Mail.Read` (delegated)
- `User.Read` (delegated)

## 🌐 Popular Deployment Platforms

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add MICROSOFT_CLIENT_ID
vercel env add MICROSOFT_CLIENT_SECRET
vercel env add PRODUCTION_URL
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY
vercel env add SESSION_SECRET
```

### Netlify Deployment
1. Connect your GitHub repo
2. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Environment variables in Netlify dashboard
4. Add redirect rules in `netlify.toml`:
```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up

# Set environment variables
railway variables set GOOGLE_CLIENT_ID=your-value
railway variables set PRODUCTION_URL=https://your-app.railway.app
```

### Docker Deployment
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔧 Production Environment Variables

Create a `.env` file on your production server:

```env
# Production Configuration
NODE_ENV=production
PORT=5000
PRODUCTION_URL=https://yourdomain.com

# Database (use production database)
DATABASE_URL=postgresql://user:password@host:port/database

# Google OAuth (same credentials, different redirect URIs)
GOOGLE_CLIENT_ID=39729089016-se6hhubtvjc3ruq4vcdr3gdiacejfco0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-production-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-production-microsoft-client-secret

# Security
SESSION_SECRET=production-session-secret-use-strong-random-string

# AI
OPENAI_API_KEY=sk-your-production-openai-key
```

## 👥 How Users Will Access in Production

### User Flow for Production:
1. **Visit your domain**: `https://yourdomain.com`
2. **Redirected to login**: Login page with OAuth options
3. **Choose provider**: "Continue with Google" or "Connect Outlook Account"
4. **OAuth flow**: Redirects to Google/Microsoft with account selection
5. **Grant permissions**: Users see account selection and consent screens
6. **Return to app**: Logged into ResumeRank with their account
7. **Access features**: Can fetch CVs, rank resumes, view results

### Account Selection Experience:
- **Google**: Users see "Choose an account" screen with option to use different account
- **Microsoft**: Users see Microsoft account selection with "Use a different account" option
- **Multi-tenant**: Works with personal Gmail, G Suite, Outlook.com, Office 365 accounts

## 🛡️ Security Considerations for Production

### OAuth Security:
- Use HTTPS only in production
- Secure session secrets (use random 64-character strings)
- Regular credential rotation
- Monitor OAuth usage in cloud consoles

### Environment Security:
- Never commit `.env` files
- Use platform-specific secret management
- Enable 2FA on cloud accounts
- Monitor for unusual OAuth activity

## 📊 Testing Production OAuth

### Pre-deployment Testing:
1. Test with staging URL first
2. Verify redirect URIs work
3. Test with multiple user accounts
4. Test account selection flows
5. Verify email access permissions

### Post-deployment Verification:
1. Test complete user flow
2. Verify OAuth redirects work correctly
3. Test email CV fetching
4. Monitor server logs for errors
5. Test with different email providers

## 🔄 OAuth Flow in Production

### Gmail Connection:
```
User clicks "Continue with Google" 
→ https://accounts.google.com/oauth/authorize?client_id=...&redirect_uri=https://yourdomain.com/api/auth/gmail/callback
→ User selects account and grants permissions
→ Google redirects to https://yourdomain.com/api/auth/gmail/callback?code=...
→ Server exchanges code for tokens
→ User logged into app
```

### Outlook Connection:
```
User clicks "Connect Outlook Account"
→ https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=...&redirect_uri=https://yourdomain.com/api/auth/outlook/callback
→ User selects account and grants permissions  
→ Microsoft redirects to https://yourdomain.com/api/auth/outlook/callback?code=...
→ Server exchanges code for tokens
→ User logged into app
```

## 🎯 Key Benefits for Production Users

- **Universal Access**: Works with any Gmail or Outlook account
- **Account Selection**: Users can choose between multiple accounts
- **Secure OAuth**: Industry-standard authentication flows
- **No Passwords**: Users never share email passwords
- **Scalable**: Supports unlimited users
- **Multi-tenant**: Personal and business accounts supported

Your production users will have a smooth, professional OAuth experience with proper account selection and security! 🚀