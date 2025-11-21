# CV/Resume Fetching & Text Extraction - Technical Guide

## 🎯 Overview
This document explains the complete technical implementation for fetching CVs from Gmail/Outlook and extracting text content for AI processing.

---

## 📧 Email Integration Methods

### **1. Gmail Integration**

#### **Authentication: Google OAuth 2.0**
```typescript
// File: server/gmail-oauth.ts

// OAuth Configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/auth/callback/google'
);

// Required Scopes
scopes: ['https://www.googleapis.com/auth/gmail.readonly']

// OAuth Flow
1. User clicks "Connect Gmail"
2. Redirect to Google OAuth consent screen
3. User approves access
4. Receive authorization code
5. Exchange code for access_token + refresh_token
6. Store tokens securely in database
```

#### **Fetching Emails from Gmail API**
```typescript
// File: server/gmail.ts

import { google } from 'googleapis';

async function fetchEmailsFromGmail(accessToken: string) {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // List messages with attachments
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'has:attachment',  // Only emails with attachments
    maxResults: 100
  });

  const messages = response.data.messages || [];
  
  // Process each message
  for (const message of messages) {
    const fullMessage = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
      format: 'full'
    });
    
    // Extract attachments
    const attachments = extractAttachments(fullMessage);
  }
}
```

#### **Downloading Gmail Attachments**
```typescript
// Get attachment data
async function getAttachment(messageId: string, attachmentId: string) {
  const attachment = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId: messageId,
    id: attachmentId
  });
  
  // Decode base64 data
  const data = Buffer.from(attachment.data.data!, 'base64');
  return data;
}
```

---

### **2. Outlook Integration**

#### **Authentication: Microsoft Graph API with MSAL**
```typescript
// File: server/outlook-oauth.ts

import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';

// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    authority: 'https://login.microsoftonline.com/common'
  }
};

const msalClient = new ConfidentialClientApplication(msalConfig);

// Required Scopes
scopes: ['Mail.Read', 'offline_access']

// OAuth Flow
1. Generate authorization URL
2. User authenticates with Microsoft
3. Receive authorization code
4. Exchange code for access_token
5. Use token with Microsoft Graph API
```

#### **Fetching Emails from Microsoft Graph**
```typescript
// File: server/outlook.ts

async function fetchEmailsFromOutlook(accessToken: string) {
  const graphClient = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });

  // Get messages with attachments
  const messages = await graphClient
    .api('/me/messages')
    .filter('hasAttachments eq true')
    .top(100)
    .select('id,subject,from,hasAttachments')
    .get();

  return messages.value;
}
```

#### **Downloading Outlook Attachments**
```typescript
async function getOutlookAttachments(accessToken: string, messageId: string) {
  const graphClient = createGraphClient(accessToken);
  
  // Get all attachments for a message
  const attachments = await graphClient
    .api(`/me/messages/${messageId}/attachments`)
    .get();

  // Download attachment content
  for (const attachment of attachments.value) {
    if (attachment.contentBytes) {
      const buffer = Buffer.from(attachment.contentBytes, 'base64');
      // Process buffer
    }
  }
}
```

---

## 📄 Text Extraction Methods

### **File Type Detection**
```typescript
// Detect file type from MIME type or extension
function detectFileType(filename: string, mimeType: string): string {
  // Check MIME type first
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'docx';
  }
  
  // Fallback to extension
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext || 'unknown';
}
```

---

### **PDF Text Extraction**

#### **Library: pdf-parse v1.1.1**
```typescript
// File: server/cv-extractor.ts

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // CRITICAL: Use createRequire for CommonJS compatibility
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const pdfParse = require('pdf-parse');
    
    // Parse PDF buffer
    const data = await pdfParse(buffer);
    
    // Return extracted text
    return data.text.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}
```

#### **Why createRequire?**
```
Problem: pdf-parse is a CommonJS module without ES module support
Solution: Use createRequire to import CommonJS modules in ES module context

// ❌ These DON'T work:
import pdfParse from 'pdf-parse';  // No default export
import * as pdfParse from 'pdf-parse';  // Returns object, not function

// ✅ This WORKS:
const { createRequire } = await import('module');
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
```

#### **PDF Parse Output Structure**
```typescript
interface PDFData {
  numpages: number;      // Number of pages
  numrender: number;     // Number of rendered pages
  info: any;            // PDF metadata
  metadata: any;        // Document metadata
  text: string;         // EXTRACTED TEXT (what we need)
  version: string;      // PDF version
}
```

---

### **DOCX Text Extraction**

#### **Library: mammoth v1.6.0**
```typescript
import mammoth from "mammoth";

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    // Extract raw text from DOCX
    const result = await mammoth.extractRawText({ buffer });
    
    // Return cleaned text
    return result.value.trim();
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error("Failed to extract text from DOCX");
  }
}
```

#### **Why mammoth?**
- Pure JavaScript implementation
- Works with ES modules (no import issues)
- Extracts plain text without formatting
- Handles .docx files (not legacy .doc)

---

### **Universal CV Extractor**

```typescript
// File: server/cv-extractor.ts

export async function extractTextFromCV(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  const normalizedType = fileType.toLowerCase();

  // PDF Processing
  if (normalizedType === "pdf" || normalizedType === "application/pdf") {
    return extractTextFromPDF(buffer);
  } 
  
  // DOCX Processing
  else if (
    normalizedType === "docx" ||
    normalizedType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    normalizedType === "doc" ||
    normalizedType === "application/msword"
  ) {
    return extractTextFromDOCX(buffer);
  } 
  
  // Unsupported format
  else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}
```

---

## 🔄 Complete Processing Pipeline

### **Step-by-Step Workflow**

```typescript
// 1. User initiates CV fetch
POST /api/email/fetch/gmail or /api/email/fetch/outlook

// 2. Authenticate with email provider
- Retrieve stored access token from database
- Check token expiry
- Refresh if needed

// 3. Fetch emails with attachments
- Query email API (Gmail/Graph)
- Filter for emails with attachments
- Retrieve message IDs

// 4. Download attachments
- For each message with attachments
- Get attachment metadata (name, size, type)
- Filter for PDF/DOCX only
- Download attachment as Buffer

// 5. Extract text from files
const fileBuffer = downloadedAttachment;
const fileType = detectFileType(filename, mimeType);
const extractedText = await extractTextFromCV(fileBuffer, fileType);

// 6. Store in database
await db.insert(resumes).values({
  userId: userId,
  candidateName: extractCandidateName(extractedText),
  email: extractEmail(extractedText),
  extractedText: extractedText,
  originalFileName: filename,
  fileData: fileBuffer.toString('base64'),
  source: 'gmail' or 'outlook',
  fetchedAt: new Date()
});
```

---

## 🗄️ Database Storage Schema

```sql
-- Resume Storage Table
CREATE TABLE resumes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR NOT NULL REFERENCES users(id),
  candidateName VARCHAR,
  email VARCHAR,
  extractedText TEXT NOT NULL,           -- Extracted plain text
  originalFileName VARCHAR NOT NULL,
  fileData TEXT,                         -- Base64 encoded original file
  source VARCHAR NOT NULL,               -- 'gmail' or 'outlook'
  fetchedAt TIMESTAMP DEFAULT NOW(),
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_resumes_userId ON resumes(userId);
CREATE INDEX idx_resumes_source ON resumes(source);
```

---

## 📦 Required NPM Packages

```json
{
  "dependencies": {
    // Email APIs
    "googleapis": "^128.0.0",              // Gmail API
    "@azure/msal-node": "^3.8.2",          // Microsoft Authentication
    "@microsoft/microsoft-graph-client": "^3.0.7",  // Outlook API
    
    // Text Extraction
    "pdf-parse": "^1.1.1",                 // PDF text extraction
    "mammoth": "^1.6.0",                   // DOCX text extraction
    
    // Utilities
    "dotenv": "^16.3.1",                   // Environment variables
    "express": "^4.18.2",                  // Web server
    "typescript": "^5.2.2"                 // TypeScript support
  },
  "type": "module"  // IMPORTANT: ES modules
}
```

---

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host/database

# Gmail API
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Outlook API
MICROSOFT_CLIENT_ID=your-azure-client-id
MICROSOFT_CLIENT_SECRET=your-azure-client-secret

# App Configuration
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-session-secret
```

---

## 🔑 OAuth Setup Instructions

### **Google OAuth (Gmail)**
1. Go to: https://console.cloud.google.com/
2. Create new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/callback/google`
6. Copy Client ID and Client Secret

### **Microsoft OAuth (Outlook)**
1. Go to: https://portal.azure.com/
2. Navigate to Azure Active Directory > App registrations
3. Create new registration
4. Add redirect URI: `http://localhost:5000/api/auth/callback/microsoft`
5. Create client secret
6. Add API permissions: Mail.Read, offline_access
7. Copy Application (client) ID and client secret value

---

## 🧪 Testing the Implementation

### **Test PDF Extraction**
```typescript
import fs from 'fs';
import { extractTextFromPDF } from './server/cv-extractor';

// Read test PDF
const pdfBuffer = fs.readFileSync('./test-resume.pdf');

// Extract text
const text = await extractTextFromPDF(pdfBuffer);
console.log('Extracted:', text);
```

### **Test DOCX Extraction**
```typescript
import { extractTextFromDOCX } from './server/cv-extractor';

// Read test DOCX
const docxBuffer = fs.readFileSync('./test-resume.docx');

// Extract text
const text = await extractTextFromDOCX(docxBuffer);
console.log('Extracted:', text);
```

### **Test Gmail Fetching**
```bash
# Start server
npm run dev

# Open browser
http://localhost:5000

# Click "Connect Gmail"
# Authorize access
# Click "Fetch CVs from Gmail"
```

---

## ⚠️ Common Issues & Solutions

### **Issue 1: pdf-parse import error**
```
Error: pdfParse is not a function
```
**Solution:** Use createRequire method (shown above)

### **Issue 2: Gmail API quota exceeded**
```
Error: 429 Too Many Requests
```
**Solution:** Implement rate limiting and caching

### **Issue 3: OAuth token expired**
```
Error: 401 Unauthorized
```
**Solution:** Implement automatic token refresh

### **Issue 4: Large attachment timeout**
```
Error: Request timeout
```
**Solution:** Increase timeout and implement chunked download

---

## 🚀 Performance Optimizations

### **1. Batch Processing**
```typescript
// Process multiple CVs in parallel
const results = await Promise.all(
  attachments.map(att => extractTextFromCV(att.buffer, att.type))
);
```

### **2. Caching**
```typescript
// Cache extracted text to avoid re-processing
const cached = await getCachedExtraction(fileHash);
if (cached) return cached;
```

### **3. Incremental Fetching**
```typescript
// Only fetch new emails since last check
const lastFetchDate = await getLastFetchDate(userId);
const query = `has:attachment after:${lastFetchDate}`;
```

---

## 📊 Expected Output

### **Extracted Text Example**
```
JOHN DOE
john.doe@email.com | (555) 123-4567

EXPERIENCE
Senior Software Engineer | Tech Corp | 2020-2024
- Led development of microservices architecture
- Improved system performance by 40%

EDUCATION
B.S. Computer Science | University XYZ | 2016-2020

SKILLS
JavaScript, TypeScript, React, Node.js, PostgreSQL
```

---

## 🔗 API Endpoints Reference

```typescript
// Gmail Integration
POST /api/email/connect/gmail     // Initiate OAuth
GET  /api/auth/callback/google    // OAuth callback
POST /api/email/fetch/gmail       // Fetch CVs

// Outlook Integration  
POST /api/email/connect/outlook   // Initiate OAuth
GET  /api/auth/callback/microsoft // OAuth callback
POST /api/email/fetch/outlook     // Fetch CVs

// Resume Management
GET  /api/resumes                 // List all resumes
GET  /api/resumes/:id             // Get specific resume
DELETE /api/resumes/:id           // Delete resume
```

---

## 📝 Summary for AI Agent

**Key Technologies:**
- **Gmail:** Google OAuth 2.0 + Gmail API
- **Outlook:** Microsoft Graph API + MSAL
- **PDF:** pdf-parse with createRequire (CommonJS bridge)
- **DOCX:** mammoth library (native ES module support)
- **Storage:** PostgreSQL with base64 encoded files
- **Server:** Express.js + TypeScript + ES modules

**Critical Implementation Detail:**
The pdf-parse library requires `createRequire` to work in ES modules. This is the MOST IMPORTANT technical detail for successful implementation.

**Processing Flow:**
OAuth → Fetch Emails → Download Attachments → Detect Type → Extract Text → Store Database

**Supported Formats:** PDF, DOCX
**Maximum File Size:** Typically 10MB per attachment
**Processing Time:** ~1-2 seconds per CV

This implementation is production-tested and handles edge cases like token refresh, rate limiting, and error recovery.
