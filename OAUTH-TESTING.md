# OAuth Account Selection Testing Guide

## Testing Account Selection in Development

### Current OAuth Flow Status: ✅ ENHANCED

Both Gmail and Outlook OAuth flows now include:
- `prompt: 'select_account'` - Forces account selection screen
- `prompt: 'consent'` - Forces permission review  
- `state: random` - Security parameter that changes each time
- `approval_prompt: 'force'` - Forces re-approval (Gmail)
- Session clearing - Removes cached auth data before new OAuth

### How to Test Account Selection:

#### Method 1: Using Incognito/Private Browsing
1. Open browser in incognito/private mode
2. Go to `http://localhost:5000`
3. Click "Connect Gmail Account" or "Connect Outlook Account"
4. You should see account selection screen

#### Method 2: Clear Browser OAuth Cache
1. Go to your browser settings
2. Clear cookies and site data for:
   - `accounts.google.com` (for Gmail)
   - `login.microsoftonline.com` (for Outlook)
3. Test the OAuth flows

#### Method 3: Use Different Browser
- Test in Chrome, Firefox, Edge to see fresh OAuth flows
- Each browser maintains separate OAuth sessions

#### Method 4: Force Account Selection (Advanced)
If you're still seeing automatic login, add these URL parameters manually:
- Gmail: Add `&login_hint=` (empty) to force account selection
- Outlook: The MSAL library handles this automatically

### What You Should See:

#### Gmail OAuth Flow:
1. Click "Connect Gmail Account"
2. Redirects to Google account selection page
3. Shows "Choose an account" screen even if you're logged in
4. Option to "Use another account" 
5. After selection, shows permission consent screen

#### Outlook OAuth Flow:
1. Click "Connect Outlook Account"  
2. Redirects to Microsoft account selection page
3. Shows account picker with existing accounts
4. Option to "Use a different account"
5. After selection, shows permission consent screen

### For Production:
- OAuth apps in production will always show account selection
- Development/test apps may cache accounts for developer convenience
- The parameters we've added maximize account selection prompts

### Troubleshooting:
If you still see automatic login:
1. Use incognito mode
2. Clear browser OAuth cookies
3. Check that environment variables are set correctly
4. Verify redirect URIs match in OAuth app configurations

### OAuth Parameters Added:
```javascript
// Gmail
{
  prompt: 'select_account consent',
  approval_prompt: 'force',
  state: 'random-string',
  include_granted_scopes: true
}

// Outlook  
{
  prompt: 'select_account',
  state: 'random-string'
}
```

These parameters ensure maximum account selection prompting while maintaining security best practices.