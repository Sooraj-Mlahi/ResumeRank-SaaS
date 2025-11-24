// Microsoft Outlook Email Fetching using Microsoft Graph API
import { getOutlookMessages, getOutlookAttachments, createGraphClient } from './outlook-oauth';
import { extractTextFromCV } from './cv-extractor';
import { extractCandidateInfo } from './openai';

interface OutlookMessage {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  receivedDateTime: string;
  hasAttachments: boolean;
}

interface OutlookAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string;
  '@odata.type': string;
}

interface ProcessedCV {
  originalFileName: string;
  fileType: string;
  fileData: string;
  extractedText: string;
  candidateName: string;
  email: string;
  phone: string;
  emailSubject: string;
  emailDate: Date;
}

// Supported CV file types
const SUPPORTED_CV_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export async function fetchCVsFromOutlook(accessToken: string, startDate?: string, endDate?: string): Promise<ProcessedCV[]> {
  console.log('Starting Outlook CV fetch...');
  
  try {
    const processedCVs: ProcessedCV[] = [];
    
    // Get messages with attachments
    const messages = await getOutlookMessages(accessToken, 100);
    console.log(`Found ${messages.length} messages with attachments`);
    
    let totalAttachments = 0;
    let processedAttachments = 0;
    
    for (const message of messages) {
      try {
        // Filter by date range if provided
        if (startDate || endDate) {
          const messageDate = new Date(message.receivedDateTime);
          
          if (startDate) {
            const start = new Date(startDate);
            if (messageDate < start) {
              continue;
            }
          }
          
          if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1); // Include entire end date
            if (messageDate >= end) {
              continue;
            }
          }
        }
        // Get attachments for this message
        const attachments = await getOutlookAttachments(accessToken, message.id);
        totalAttachments += attachments.length;
        
        for (const attachment of attachments) {
          // Check if it's a supported CV file type
          if (!SUPPORTED_CV_TYPES.includes(attachment.contentType)) {
            continue;
          }
          
          // Check file size (skip very large files > 10MB)
          if (attachment.size > 10 * 1024 * 1024) {
            console.log(`Skipping large file: ${attachment.name} (${attachment.size} bytes)`);
            continue;
          }
          
          try {
            console.log(`Processing attachment: ${attachment.name}`);
            
            // Get attachment content
            const attachmentContent = await getAttachmentContent(accessToken, message.id, attachment.id);
            
            if (!attachmentContent) {
              console.log(`No content for attachment: ${attachment.name}`);
              continue;
            }
            
            // Extract text from the CV
            const extractedText = await extractTextFromCV(
              Buffer.from(attachmentContent, 'base64'),
              getFileTypeFromContentType(attachment.contentType)
            );
            
            if (!extractedText || extractedText.trim().length < 100) {
              console.log(`Insufficient text extracted from: ${attachment.name}`);
              continue;
            }
            
            // Extract candidate information using AI
            const candidateInfo = await extractCandidateInfo(extractedText);
            
            processedCVs.push({
              originalFileName: attachment.name,
              fileType: getFileTypeFromContentType(attachment.contentType),
              fileData: attachmentContent,
              extractedText,
              candidateName: candidateInfo.name || 'Unknown',
              email: candidateInfo.email || '',
              phone: candidateInfo.phone || '',
              emailSubject: message.subject || '',
              emailDate: new Date(message.receivedDateTime),
            });
            
            processedAttachments++;
            console.log(`Successfully processed: ${attachment.name}`);
            
          } catch (error) {
            console.error(`Error processing attachment ${attachment.name}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
      }
    }
    
    console.log(`Outlook CV fetch complete. Processed ${processedAttachments}/${totalAttachments} attachments, found ${processedCVs.length} CVs`);
    return processedCVs;
    
  } catch (error) {
    console.error('Error fetching CVs from Outlook:', error);
    throw error;
  }
}

// Get attachment content as base64
async function getAttachmentContent(accessToken: string, messageId: string, attachmentId: string): Promise<string | null> {
  try {
    const graphClient = createGraphClient(accessToken);
    
    const attachment = await graphClient
      .api(`/me/messages/${messageId}/attachments/${attachmentId}`)
      .get();
    
    return attachment.contentBytes || null;
  } catch (error) {
    console.error(`Error getting attachment content:`, error);
    return null;
  }
}

// Convert content type to file extension
function getFileTypeFromContentType(contentType: string): string {
  switch (contentType) {
    case 'application/pdf':
      return 'pdf';
    case 'application/msword':
      return 'doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx';
    default:
      return 'unknown';
  }
}

// Get user's mailbox info for connection testing
export async function getOutlookUserInfo(accessToken: string): Promise<any> {
  try {
    const graphClient = createGraphClient(accessToken);
    
    const user = await graphClient.api('/me').get();
    const mailboxSettings = await graphClient.api('/me/mailboxSettings').get();
    
    return {
      id: user.id,
      email: user.mail || user.userPrincipalName,
      name: user.displayName,
      timeZone: mailboxSettings.timeZone,
    };
  } catch (error) {
    console.error('Error getting Outlook user info:', error);
    throw error;
  }
}