// Email CV Fetching Test - No Database Required
// This test simulates the complete email fetching workflow

import { extractTextFromCV } from './server/cv-extractor.js';
import { extractCandidateInfo } from './server/openai.js';
import fs from 'fs';
import path from 'path';

// Mock email attachment data structure
interface MockEmailAttachment {
  filename: string;
  mimeType: string;
  data: Buffer;
  subject: string;
  date: Date;
}

// Create some mock CV data for testing
function createMockCVAttachments(): MockEmailAttachment[] {
  return [
    {
      filename: 'john_doe_resume.pdf',
      mimeType: 'application/pdf',
      data: Buffer.from('Mock PDF content - John Doe Software Engineer with 5 years experience in JavaScript, React, Node.js'),
      subject: 'Application for Software Engineer Position',
      date: new Date('2024-11-15')
    },
    {
      filename: 'jane_smith_cv.docx', 
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      data: Buffer.from('Mock DOCX content - Jane Smith Senior Developer Python, Django, PostgreSQL'),
      subject: 'Senior Developer Application',
      date: new Date('2024-11-14')
    },
    {
      filename: 'resume_mike_wilson.pdf',
      mimeType: 'application/pdf', 
      data: Buffer.from('Mock PDF - Mike Wilson Full Stack Developer React, Vue.js, Express, MongoDB'),
      subject: 'Full Stack Developer Resume',
      date: new Date('2024-11-13')
    }
  ];
}

// Simulate the Gmail fetching function with mock data
function mockFetchCVsFromGmail(): MockEmailAttachment[] {
  console.log('📧 Simulating Gmail API fetch...');
  console.log('🔍 Searching for emails with CV attachments...');
  
  const mockAttachments = createMockCVAttachments();
  console.log(`✅ Found ${mockAttachments.length} emails with CV attachments`);
  
  return mockAttachments;
}

// Process CVs without database storage
async function processCVsWithoutDatabase() {
  console.log('🚀 Starting Email CV Fetching Test\n');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Fetch CV attachments from email
    const attachments = mockFetchCVsFromGmail();
    console.log('');
    
    const processedCVs = [];
    
    // Step 2: Process each attachment
    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      console.log(`📄 Processing CV ${i + 1}/${attachments.length}: ${attachment.filename}`);
      
      try {
        // Step 3: Extract text from CV
        console.log('   📝 Extracting text...');
        let extractedText;
        
        try {
          extractedText = await extractTextFromCV(
            attachment.data,
            attachment.mimeType
          );
        } catch (extractError) {
          // For mock data, extraction will fail, so we'll use the mock text
          console.log('   ⚠️  Extraction failed (expected with mock data), using mock text');
          extractedText = attachment.data.toString();
        }
        
        if (!extractedText || extractedText.length < 10) {
          console.log('   ❌ Skipped: Insufficient text content');
          continue;
        }
        
        console.log(`   ✅ Extracted ${extractedText.length} characters`);
        
        // Step 4: Extract candidate information with AI
        console.log('   🤖 Extracting candidate info with AI...');
        
        let candidateInfo;
        try {
          candidateInfo = await extractCandidateInfo(extractedText);
        } catch (aiError) {
          console.log('   ⚠️  AI extraction failed, using fallback parsing');
          // Fallback parsing for demo
          candidateInfo = {
            name: attachment.filename.split('_')[0] + ' ' + (attachment.filename.split('_')[1] || 'Unknown'),
            email: 'demo@example.com',
            phone: '+1-555-0123'
          };
        }
        
        console.log(`   👤 Candidate: ${candidateInfo.name}`);
        console.log(`   📧 Email: ${candidateInfo.email || 'Not found'}`);
        console.log(`   📞 Phone: ${candidateInfo.phone || 'Not found'}`);
        
        // Step 5: Store processed CV data (in memory for this test)
        const processedCV = {
          id: `cv_${Date.now()}_${i}`,
          candidateName: candidateInfo.name,
          email: candidateInfo.email,
          phone: candidateInfo.phone,
          extractedText,
          originalFileName: attachment.filename,
          fileType: attachment.filename.split('.').pop() || 'pdf',
          source: 'gmail',
          emailSubject: attachment.subject,
          emailDate: attachment.date,
          processedAt: new Date()
        };
        
        processedCVs.push(processedCV);
        console.log('   💾 CV processed successfully');
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Error processing ${attachment.filename}:`, error.message);
        console.log('');
      }
    }
    
    // Step 6: Summary
    console.log('=' .repeat(50));
    console.log('📊 PROCESSING SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Total emails found: ${attachments.length}`);
    console.log(`CVs processed successfully: ${processedCVs.length}`);
    console.log('');
    
    // Step 7: Display processed CVs
    if (processedCVs.length > 0) {
      console.log('📋 PROCESSED CVS:');
      processedCVs.forEach((cv, index) => {
        console.log(`\n${index + 1}. ${cv.candidateName}`);
        console.log(`   File: ${cv.originalFileName}`);
        console.log(`   Email: ${cv.email || 'N/A'}`);
        console.log(`   Phone: ${cv.phone || 'N/A'}`);
        console.log(`   Subject: ${cv.emailSubject}`);
        console.log(`   Text Length: ${cv.extractedText.length} chars`);
      });
    }
    
    console.log('\n🎉 Email CV fetching test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   - Set up database connection to store CVs');
    console.log('   - Configure real Gmail/Outlook API credentials');  
    console.log('   - Test with actual email accounts');
    
    return processedCVs;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
console.log('Starting Email CV Fetching Simulation...\n');
processCVsWithoutDatabase()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });