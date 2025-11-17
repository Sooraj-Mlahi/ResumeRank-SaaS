# Microsoft Outlook Integration Setup Guide

## Overview
This guide explains how to configure Microsoft Outlook integration for CV fetching from email attachments using Microsoft Graph API.

## Prerequisites
- Azure Account with access to Azure Portal
- Administrative access to create Azure App Registrations
- Your ResumeRank SaaS application running

## Step 1: Create Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `ResumeRank SaaS`
   - **Supported account types**: Choose based on your needs
     - `Accounts in any organizational directory` (Multi-tenant) - Recommended for SaaS
     - `Accounts in this organizational directory only` (Single tenant)
   - **Redirect URI**: 
     - Platform: `Web`
     - URI: `http://localhost:5000/api/auth/outlook/callback` (for development)
     - URI: `https://yourdomain.com/api/auth/outlook/callback` (for production)

## Step 2: Configure App Permissions

1. In your newly created app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph** > **Delegated permissions**
4. Add the following permissions:
   - `Mail.Read` - Read user mail
   - `User.Read` - Sign in and read user profile

5. Click **Grant admin consent** (if you have admin rights)

## Step 3: Create Client Secret

1. Go to **Certificates & secrets** in your app registration
2. Click **New client secret**
3. Add a description and set expiration (recommend 24 months)
4. **IMPORTANT**: Copy the secret value immediately (it won't be shown again)

## Step 4: Environment Configuration

Copy the following values to your `.env` file:

```env
# Microsoft Outlook API Configuration
MICROSOFT_CLIENT_ID=your-app-client-id-from-azure
MICROSOFT_CLIENT_SECRET=your-client-secret-from-step-3
MICROSOFT_TENANT_ID=common-or-your-tenant-id
```

### Finding Your Values:
- **MICROSOFT_CLIENT_ID**: Found in Azure App Registration > Overview > Application (client) ID
- **MICROSOFT_CLIENT_SECRET**: The secret value you copied in Step 3
- **MICROSOFT_TENANT_ID**: 
  - Use `common` for multi-tenant applications
  - Or find your tenant ID in Azure Active Directory > Overview > Tenant ID

## Step 5: Test Integration

1. Start your application: `npm run dev`
2. Navigate to the "Fetch CVs from Email" page
3. Click **Connect Outlook Account**
4. You should be redirected to Microsoft login
5. Grant permissions when prompted
6. You'll be redirected back to your application

## Step 6: Production Deployment

When deploying to production:

1. Update the **Redirect URI** in your Azure App Registration to your production domain
2. Update your production `.env` file with the same environment variables
3. Ensure your production domain is HTTPS

## Troubleshooting

### Common Issues:

1. **"AADSTS50011: The reply URL specified in the request does not match"**
   - Solution: Ensure the redirect URI in Azure matches exactly with your callback URL

2. **"Microsoft OAuth not configured"**
   - Solution: Check that all environment variables are set correctly in your `.env` file

3. **"AADSTS700016: Application not found in the directory"**
   - Solution: Verify your MICROSOFT_CLIENT_ID is correct

4. **Permission denied errors**
   - Solution: Ensure admin consent is granted for the required permissions

### Testing Email Access:

The integration will:
- Search for emails with PDF, DOC, or DOCX attachments
- Extract resume/CV files automatically
- Process them through the AI scoring system
- Store results in your database

## Security Notes

- Never commit your `.env` file to version control
- Regularly rotate your client secrets
- Use the principle of least privilege for API permissions
- Monitor your Azure app registration for unusual activity

## Support

If you encounter issues:
1. Check the server console for detailed error messages
2. Verify your Azure app registration configuration
3. Ensure all environment variables are properly set
4. Test with a simple Outlook account first

---

For more information about Microsoft Graph API, visit: https://docs.microsoft.com/en-us/graph/