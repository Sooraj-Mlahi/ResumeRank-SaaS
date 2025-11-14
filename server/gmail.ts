// Gmail integration using google-mail blueprint
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  data: Buffer;
  subject: string;
  date: Date;
}

export async function fetchCVsFromGmail(): Promise<EmailAttachment[]> {
  try {
    const gmail = await getUncachableGmailClient();
    const attachments: EmailAttachment[] = [];

    // Search for emails with CV/resume attachments
    const searchQuery = 'has:attachment (filename:pdf OR filename:doc OR filename:docx) (subject:resume OR subject:cv OR subject:application OR body:resume OR body:cv)';
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: searchQuery,
      maxResults: 50,
    });

    if (!response.data.messages) {
      return attachments;
    }

    // Fetch each message and extract attachments
    for (const message of response.data.messages) {
      try {
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
        });

        const headers = fullMessage.data.payload?.headers || [];
        const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
        const dateHeader = headers.find((h) => h.name === 'Date')?.value;
        const date = dateHeader ? new Date(dateHeader) : new Date();

        // Extract attachments from parts
        const parts = fullMessage.data.payload?.parts || [];
        for (const part of parts) {
          if (part.filename && part.body?.attachmentId) {
            const filename = part.filename.toLowerCase();
            if (filename.endsWith('.pdf') || filename.endsWith('.doc') || filename.endsWith('.docx')) {
              const attachment = await gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: message.id!,
                id: part.body.attachmentId,
              });

              if (attachment.data.data) {
                const buffer = Buffer.from(attachment.data.data, 'base64');
                attachments.push({
                  filename: part.filename,
                  mimeType: part.mimeType || 'application/octet-stream',
                  data: buffer,
                  subject,
                  date,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching message:', error);
        continue;
      }
    }

    return attachments;
  } catch (error) {
    console.error('Gmail fetch error:', error);
    throw new Error('Failed to fetch CVs from Gmail');
  }
}
