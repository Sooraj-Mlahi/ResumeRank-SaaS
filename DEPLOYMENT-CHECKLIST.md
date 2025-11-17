# Deployment Checklist

## ✅ Pre-Deployment Setup

### OAuth Provider Configuration
- [ ] **Google Cloud Console**: Add production redirect URI `https://yourdomain.com/api/auth/gmail/callback`
- [ ] **Azure Portal**: Add production redirect URI `https://yourdomain.com/api/auth/outlook/callback`
- [ ] **Test OAuth**: Verify credentials work with staging URL first

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PRODUCTION_URL=https://yourdomain.com`
- [ ] `DATABASE_URL=your-production-database`
- [ ] `GOOGLE_CLIENT_ID=your-google-client-id`
- [ ] `GOOGLE_CLIENT_SECRET=your-google-client-secret`
- [ ] `MICROSOFT_CLIENT_ID=your-microsoft-client-id`
- [ ] `MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret`
- [ ] `OPENAI_API_KEY=your-openai-key`
- [ ] `SESSION_SECRET=secure-random-string`

## 🚀 Platform-Specific Deployment

### Option 1: Vercel (Recommended)
```bash
npm i -g vercel
vercel
# Set all environment variables in Vercel dashboard
```

### Option 2: Railway
```bash
npm install -g @railway/cli
railway login
railway link
railway up
# Set environment variables via Railway dashboard
```

### Option 3: Render
1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically

### Option 4: Custom Server (VPS/AWS/etc.)
```bash
# Build application
npm run build

# Set environment variables
export NODE_ENV=production
export PRODUCTION_URL=https://yourdomain.com

# Start with PM2 or similar
pm2 start npm --name "resumerank" -- start
```

## 🧪 Post-Deployment Testing

### User Flow Testing
- [ ] Visit production URL
- [ ] Redirected to login page
- [ ] "Continue with Google" works
- [ ] Account selection screen appears
- [ ] User can grant permissions
- [ ] Redirected back to app successfully
- [ ] Dashboard loads with user data
- [ ] "Connect Gmail Account" works for email service
- [ ] "Connect Outlook Account" works for email service
- [ ] CV fetching works end-to-end

### OAuth Flow Verification
- [ ] Google OAuth shows account selection
- [ ] Microsoft OAuth shows account selection
- [ ] Users can switch between accounts
- [ ] Permissions are properly granted
- [ ] Tokens are securely stored

## 🛡️ Security Checklist

- [ ] HTTPS enabled on production domain
- [ ] OAuth redirect URIs use HTTPS
- [ ] Environment variables secured
- [ ] No credentials in source code
- [ ] Session secrets are strong random strings
- [ ] Database uses secure connections

## 📊 User Experience Validation

### Multi-User Testing
- [ ] Test with personal Gmail accounts
- [ ] Test with G Suite business accounts
- [ ] Test with personal Outlook.com accounts
- [ ] Test with Office 365 business accounts
- [ ] Test account switching functionality

### Error Handling
- [ ] OAuth errors redirect properly
- [ ] Invalid credentials show clear messages
- [ ] Network failures are handled gracefully
- [ ] Session expiration works correctly

## 🔧 Monitoring Setup

### Recommended Monitoring
- [ ] Server uptime monitoring
- [ ] OAuth success/failure rates
- [ ] Database connection health
- [ ] Email API rate limits
- [ ] Error logging and alerts

### Performance Monitoring
- [ ] API response times
- [ ] Database query performance
- [ ] OAuth flow completion rates
- [ ] User session duration

## 🎯 Go-Live Checklist

- [ ] All tests pass
- [ ] OAuth flows work for real users
- [ ] Domain is properly configured
- [ ] SSL certificate is valid
- [ ] Database is production-ready
- [ ] Monitoring is active
- [ ] Documentation is updated
- [ ] User support process is ready

## 📞 User Support Preparation

### Common Issues Users Might Face
1. **OAuth Redirect Errors**: Usually redirect URI mismatch
2. **Permission Denied**: Users declining OAuth permissions
3. **Account Selection**: Users wanting to switch accounts
4. **Email Access**: Understanding what data is accessed

### Support Documentation for Users
- Clear explanation of OAuth permissions
- How to switch Google/Outlook accounts
- What email data is accessed and why
- Privacy policy and data handling
- Contact information for support

---

Once deployed, your users will access the app at your production URL and enjoy a professional OAuth experience with proper account selection! 🚀