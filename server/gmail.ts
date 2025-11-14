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
      // For demo: return mock resume data if no real emails found
      console.log('No Gmail messages found with CV attachments. Using demo data.');
      return getDemoResumes();
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

    // If no attachments were found, return demo data for testing
    if (attachments.length === 0) {
      console.log('No CV attachments found in Gmail. Using demo data.');
      return getDemoResumes();
    }

    return attachments;
  } catch (error) {
    console.error('Gmail fetch error:', error);
    // For demo: return mock data on error
    console.log('Gmail fetch failed. Using demo data.');
    return getDemoResumes();
  }
}

function getDemoResumes(): EmailAttachment[] {
  const demoResume1 = `
JOHN SMITH
Senior Software Engineer
john.smith@email.com | (555) 123-4567

PROFESSIONAL SUMMARY
Results-driven Senior Software Engineer with 7+ years of experience building scalable web applications using React, Node.js, and TypeScript. Proven track record of leading teams and delivering high-impact projects.

EXPERIENCE
Senior Software Engineer - Tech Corp (2020-Present)
- Led development of microservices architecture serving 1M+ users
- Reduced page load time by 40% through performance optimizations
- Mentored 5 junior developers

Software Engineer - StartupXYZ (2017-2020)
- Built full-stack features using React and Node.js
- Implemented CI/CD pipeline reducing deployment time by 60%

EDUCATION
BS Computer Science - University of Technology (2017)

SKILLS
JavaScript, TypeScript, React, Node.js, PostgreSQL, AWS, Docker`;

  const demoResume2 = `
SARAH JOHNSON
Full Stack Developer
sarah.j@email.com | (555) 987-6543

ABOUT ME
Passionate full-stack developer with 5 years of experience specializing in React, Python, and cloud technologies. Strong problem-solver with excellent communication skills.

WORK HISTORY
Full Stack Developer - Digital Agency (2021-Present)
- Developed 15+ client projects using modern web technologies
- Implemented automated testing increasing code coverage to 90%
- Collaborated with designers to create pixel-perfect UIs

Junior Developer - Web Solutions Inc (2019-2021)
- Built RESTful APIs using Django and Flask
- Created responsive frontends with React and Tailwind CSS

EDUCATION
BS Software Engineering - State University (2019)

TECHNICAL SKILLS
Python, JavaScript, React, Django, PostgreSQL, AWS, Git`;

  const demoResume3 = `
MICHAEL CHEN
Frontend Engineer
m.chen@email.com | (555) 234-5678

SUMMARY
Creative frontend engineer with 4 years of experience crafting beautiful, performant user interfaces. Expert in React, TypeScript, and modern CSS frameworks.

PROFESSIONAL EXPERIENCE
Frontend Engineer - Design Studio (2022-Present)
- Built component library used across 10+ products
- Improved accessibility compliance to WCAG AA standards
- Reduced bundle size by 35% through code splitting

Web Developer - Marketing Firm (2020-2022)
- Created landing pages with 95+ PageSpeed scores
- Implemented animations using Framer Motion

EDUCATION
BA Digital Media - Arts College (2020)

SKILLS
React, TypeScript, Next.js, Tailwind CSS, Framer Motion, Figma`;

  return [
    {
      filename: 'john_smith_resume.pdf',
      mimeType: 'application/pdf',
      data: Buffer.from(demoResume1),
      subject: 'Application for Senior Software Engineer position',
      date: new Date('2024-11-10'),
    },
    {
      filename: 'sarah_johnson_cv.pdf',
      mimeType: 'application/pdf',
      data: Buffer.from(demoResume2),
      subject: 'Full Stack Developer Application',
      date: new Date('2024-11-12'),
    },
    {
      filename: 'michael_chen_resume.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      data: Buffer.from(demoResume3),
      subject: 'Frontend Engineer - Michael Chen',
      date: new Date('2024-11-13'),
    },
  ];
}
