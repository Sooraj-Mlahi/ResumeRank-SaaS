// Microsoft Outlook OAuth Integration using Microsoft Graph API
import { ConfidentialClientApplication, AuthenticationResult } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

// Microsoft Graph API scopes for email access
const SCOPES = ['https://graph.microsoft.com/Mail.Read'];

// MSAL configuration
const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authority: 'https://login.microsoftonline.com/common',
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel: any, message: any) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: 3, // Error level
    }
  }
};

// Create MSAL instance
function createMsalClient() {
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    throw new Error('Microsoft OAuth not configured. Missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET');
  }
  
  return new ConfidentialClientApplication(msalConfig);
}

// Generate authorization URL
export async function getOutlookAuthUrl(): Promise<string> {
  const msalClient = createMsalClient();
  
  // Use environment-specific redirect URI
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.PRODUCTION_URL || 'https://yourdomain.com'
    : 'http://localhost:5000';
  
  const redirectUri = `${baseUrl}/api/auth/outlook/callback`;
  console.log('📧 Outlook OAuth redirect URI:', redirectUri);
  
  const authCodeUrlParameters = {
    scopes: SCOPES,
    redirectUri: redirectUri,
    prompt: 'select_account', // Force account selection screen
    state: Math.random().toString(36).substring(7), // Random state for security
  };

  return msalClient.getAuthCodeUrl(authCodeUrlParameters);
}

export async function getOutlookAccessToken(code: string): Promise<string> {
  const msalClient = createMsalClient();
  
  // Use environment-specific redirect URI
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.PRODUCTION_URL || 'https://yourdomain.com'
    : 'http://localhost:5000';
  
  const redirectUri = `${baseUrl}/api/auth/outlook/callback`;
  
  try {
    const tokenRequest = {
      code: code,
      scopes: SCOPES,
      redirectUri: redirectUri,
    };

    const response: AuthenticationResult = await msalClient.acquireTokenByCode(tokenRequest);
    
    if (!response.accessToken) {
      throw new Error('No access token received from Microsoft');
    }
    
    return response.accessToken;
  } catch (error) {
    console.error('Error getting Outlook access token:', error);
    throw error;
  }
}

// Create authenticated Microsoft Graph client
export function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
}

// Test connection by getting user profile
export async function testOutlookConnection(accessToken: string): Promise<any> {
  try {
    const graphClient = createGraphClient(accessToken);
    const user = await graphClient.api('/me').get();
    return {
      id: user.id,
      email: user.mail || user.userPrincipalName,
      name: user.displayName
    };
  } catch (error) {
    console.error('Error testing Outlook connection:', error);
    throw error;
  }
}

// Get user's email messages
export async function getOutlookMessages(accessToken: string, maxResults: number = 50): Promise<any[]> {
  try {
    const graphClient = createGraphClient(accessToken);
    
    const messages = await graphClient
      .api('/me/messages')
      .filter('hasAttachments eq true')
      .select('id,subject,from,receivedDateTime,hasAttachments,attachments')
      .top(maxResults)
      .orderby('receivedDateTime desc')
      .get();
    
    return messages.value || [];
  } catch (error) {
    console.error('Error getting Outlook messages:', error);
    throw error;
  }
}

// Get message attachments
export async function getOutlookAttachments(accessToken: string, messageId: string): Promise<any[]> {
  try {
    const graphClient = createGraphClient(accessToken);
    
    const attachments = await graphClient
      .api(`/me/messages/${messageId}/attachments`)
      .get();
    
    return attachments.value || [];
  } catch (error) {
    console.error('Error getting Outlook attachments:', error);
    throw error;
  }
}