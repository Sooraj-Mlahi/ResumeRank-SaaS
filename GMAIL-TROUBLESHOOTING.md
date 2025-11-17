# Gmail Connection Troubleshooting Guide

## Issue: "Failed to connect Gmail account" with 401 Unauthorized

### Root Cause Analysis:
The Gmail connection failure is happening because users need to **LOG IN to the app first** before they can connect Gmail services.

### Correct User Flow:

#### Step 1: Login to the App
1. Visit `http://localhost:5000`
2. You'll be redirected to `/login` 
3. Click **"Continue with Google"** 
4. Complete Google OAuth login
5. You'll be logged into the ResumeRank app

#### Step 2: Connect Gmail Service (After Login)
1. Navigate to "Fetch CVs from Email" page
2. Click **"Connect Gmail Account"** 
3. This connects Gmail service for email reading
4. Complete OAuth flow for Gmail API access

### Two Different OAuth Flows:

#### 1. App Login (`/api/auth/google`)
- **Purpose**: Log into the ResumeRank app using Google account
- **Creates**: User account and app session
- **Button**: "Continue with Google" on login page

#### 2. Gmail Service (`/api/email/connect/gmail`) 
- **Purpose**: Connect Gmail API for reading emails
- **Requires**: Already logged into the app
- **Button**: "Connect Gmail Account" on fetch page

### Google Cloud Console Setup Required:

Your Google OAuth app needs these redirect URIs configured:

```
http://localhost:5000/api/auth/gmail/callback
http://localhost:5000/api/auth/google/callback (if different)
```

### Environment Variables Check:

Verify these are set in your `.env` file:
```env
GOOGLE_CLIENT_ID=39729089016-se6hhubtvjc3ruq4vcdr3gdiacejfco0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Debugging Steps:

#### Check Server Logs:
When testing, watch the terminal for logs like:
```
✅ Gmail tokens received
✅ Gmail user info: { email: "user@gmail.com" }
✅ Gmail session set
✅ User authenticated successfully
```

#### Check Authentication Status:
1. Open browser dev tools
2. Go to Application/Storage > Cookies
3. Look for session cookies from localhost:5000

#### Test Authentication Flow:
1. Clear browser cookies for localhost:5000
2. Visit app (should redirect to login)
3. Complete Google login
4. Check if redirected to dashboard
5. Try Gmail connection

### Common Issues:

#### Issue: "Unauthorized" Error
- **Cause**: Not logged into app
- **Solution**: Complete Step 1 (App Login) first

#### Issue: OAuth Redirect Error  
- **Cause**: Redirect URI mismatch
- **Solution**: Check Google Cloud Console redirect URIs

#### Issue: "Invalid Client" Error
- **Cause**: Wrong GOOGLE_CLIENT_ID
- **Solution**: Verify credentials in .env file

#### Issue: Session Not Persisting
- **Cause**: Session middleware issues
- **Solution**: Check SESSION_SECRET in .env

### Quick Test Procedure:

1. **Clear Everything**: Clear browser cookies and restart server
2. **Login First**: Go to app → login page → "Continue with Google" 
3. **Verify Login**: Should see dashboard after Google OAuth
4. **Connect Gmail**: Go to fetch page → "Connect Gmail Account"
5. **Test Flow**: Should work without 401 errors

### Account Selection:
Once logged in, the Gmail connection flow will show account selection with:
- `prompt: 'select_account consent'` 
- `approval_prompt: 'force'`
- Account picker even for logged-in users

The enhanced OAuth parameters ensure account selection is always shown during the Gmail service connection step.