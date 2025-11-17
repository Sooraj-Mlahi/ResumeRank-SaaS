// Gmail OAuth Integration for Local Development
// This module handles Gmail API authentication using your OAuth credentials

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// OAuth2 configuration
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = 'gmail-token.json';
const CREDENTIALS_PATH = 'google-credentials.json';

// Create OAuth2 client
function createOAuth2Client() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Gmail OAuth not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  }

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5000/api/auth/gmail/callback' // Redirect URI
  );
}

// Generate authorization URL
export function getGmailAuthUrl() {
  const oAuth2Client = createOAuth2Client();
  
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force refresh token
  });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const oAuth2Client = createOAuth2Client();
  
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    
    if (!tokens) {
      throw new Error('No tokens received from OAuth exchange');
    }
    
    // Save tokens for future use
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('✅ Gmail tokens saved to', TOKEN_PATH);
    
    return tokens;
  } catch (error) {
    console.error('❌ Error exchanging code for tokens:', error);
    throw error;
  }
}

// Get authenticated Gmail client
export async function getAuthenticatedGmailClient() {
  const oAuth2Client = createOAuth2Client();
  
  // Check if we have saved tokens
  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(tokens);
    
    // Check if tokens need refresh
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      console.log('🔄 Refreshing Gmail tokens...');
      try {
        const { credentials } = await oAuth2Client.refreshAccessToken();
        oAuth2Client.setCredentials(credentials);
        
        // Save refreshed tokens
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
        console.log('✅ Gmail tokens refreshed');
      } catch (error) {
        console.error('❌ Error refreshing tokens:', error);
        throw new Error('Gmail authentication expired. Please re-authenticate.');
      }
    }
    
    return google.gmail({ version: 'v1', auth: oAuth2Client });
  } else {
    throw new Error('Gmail not authenticated. Please complete OAuth flow first.');
  }
}

// Check if Gmail is authenticated
export function isGmailAuthenticated() {
  return fs.existsSync(TOKEN_PATH);
}

// Clear stored tokens
export function clearGmailTokens() {
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
    console.log('🗑️ Gmail tokens cleared');
  }
}

// Test Gmail connection
export async function testGmailConnection() {
  try {
    const gmail = await getAuthenticatedGmailClient();
    
    // Test by getting user profile
    const response = await gmail.users.getProfile({ userId: 'me' });
    console.log('✅ Gmail connection successful');
    console.log(`📧 Connected to: ${response.data.emailAddress}`);
    
    return {
      success: true,
      email: response.data.emailAddress,
      messagesTotal: response.data.messagesTotal,
      threadsTotal: response.data.threadsTotal
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Gmail connection failed:', errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}