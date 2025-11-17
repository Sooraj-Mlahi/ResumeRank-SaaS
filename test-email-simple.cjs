// Simple Email CV Fetching Test - No Database, No OpenAI Required
// This test demonstrates the email fetching workflow with basic text extraction only

const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

// Mock email attachment data
function createMockEmailData() {
  return [
    {
      filename: 'john_doe_resume.pdf',
      mimeType: 'application/pdf',
      mockText: 'John Doe\nSoftware Engineer\nEmail: john.doe@email.com\nPhone: +1-555-0123\n\nExperience:\n- 5 years JavaScript development\n- React, Node.js, Express\n- Full-stack web development',
      subject: 'Application for Software Engineer Position',
      date: new Date('2024-11-15')
    },
    {
      filename: 'jane_smith_cv.docx', 
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      mockText: 'Jane Smith\nSenior Python Developer\nEmail: jane.smith@email.com\nPhone: +1-555-0456\n\nSkills:\n- Python, Django, Flask\n- PostgreSQL, MongoDB\n- 7 years experience',
      subject: 'Senior Developer Application',
      date: new Date('2024-11-14')
    },
    {
      filename: 'invalid_file.txt',
      mimeType: 'text/plain',
      mockText: 'This should be rejected',
      subject: 'Text file (should be rejected)',
      date: new Date('2024-11-13')
    }
  ];
}

// Simulate text extraction
async function simulateTextExtraction(mockText, fileType) {
  const normalizedType = fileType.toLowerCase();
  
  if (normalizedType === "pdf" || normalizedType === "application/pdf") {
    console.log('     🔍 Simulating PDF extraction...');
    return mockText; // In real scenario, this would be extracted from PDF
  } else if (
    normalizedType === "docx" ||
    normalizedType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    normalizedType === "doc" ||
    normalizedType === "application/msword"
  ) {
    console.log('     🔍 Simulating DOCX extraction...');
    return mockText; // In real scenario, this would be extracted from DOCX
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// Basic info extraction without AI
function extractBasicInfo(text) {
  const lines = text.split('\n');
  
  // Simple pattern matching
  const nameMatch = lines[0] || 'Unknown Candidate';
  const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/) || [null];
  const phoneMatch = text.match(/[\+]?[\d\s\-\(\)]+/) || [null];
  
  return {
    name: nameMatch.trim(),
    email: emailMatch[0],
    phone: phoneMatch[0]
  };
}

async function runSimpleEmailTest() {
  console.log('🚀 Simple Email CV Fetching Test');
  console.log('=' .repeat(40));
  console.log('📧 Simulating Gmail API fetch...\n');
  
  const mockEmails = createMockEmailData();
  const processedCVs = [];
  
  for (let i = 0; i < mockEmails.length; i++) {
    const email = mockEmails[i];
    console.log(`📄 Processing email ${i + 1}: ${email.filename}`);
    console.log(`   📧 Subject: ${email.subject}`);
    console.log(`   📅 Date: ${email.date.toDateString()}`);
    
    try {
      // Test file type validation
      const extractedText = await simulateTextExtraction(email.mockText, email.mimeType);
      
      if (extractedText.length < 10) {
        console.log('   ❌ Skipped: Insufficient content\n');
        continue;
      }
      
      console.log(`   ✅ Text extracted: ${extractedText.length} characters`);
      
      // Extract basic candidate info
      const candidateInfo = extractBasicInfo(extractedText);
      console.log(`   👤 Candidate: ${candidateInfo.name}`);
      console.log(`   📧 Email: ${candidateInfo.email || 'Not found'}`);
      console.log(`   📞 Phone: ${candidateInfo.phone || 'Not found'}`);
      
      // Simulate storing the CV
      const cvData = {
        id: `cv_${Date.now()}_${i}`,
        ...candidateInfo,
        originalFileName: email.filename,
        extractedText,
        fileType: email.filename.split('.').pop(),
        emailSubject: email.subject,
        emailDate: email.date,
        processedAt: new Date()
      };
      
      processedCVs.push(cvData);
      console.log('   💾 CV processed and stored\n');
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  // Summary
  console.log('=' .repeat(40));
  console.log('📊 RESULTS SUMMARY');
  console.log('=' .repeat(40));
  console.log(`Emails processed: ${mockEmails.length}`);
  console.log(`CVs successfully extracted: ${processedCVs.length}`);
  console.log(`Failed/Rejected: ${mockEmails.length - processedCVs.length}\n`);
  
  if (processedCVs.length > 0) {
    console.log('📋 Successfully Processed CVs:');
    processedCVs.forEach((cv, index) => {
      console.log(`${index + 1}. ${cv.name} (${cv.originalFileName})`);
    });
  }
  
  console.log('\n🎉 Email CV fetching simulation completed!');
  console.log('\n💡 This demonstrates:');
  console.log('   ✅ Email attachment processing');
  console.log('   ✅ File type validation'); 
  console.log('   ✅ Text extraction simulation');
  console.log('   ✅ Basic candidate info parsing');
  console.log('   ✅ CV data structure creation');
  
  return processedCVs;
}

// Run the test
runSimpleEmailTest().catch(console.error);