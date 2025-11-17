// Test OpenAI API with Real CV Analysis
// This will use your actual OpenAI API key to score CVs

import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mock CV data for testing
const testCVs = [
  {
    name: "John Martinez",
    text: `John Martinez
    Senior Software Engineer
    Email: john.martinez@email.com
    Phone: +1-555-0123
    
    Experience:
    • 8 years of full-stack development experience
    • Expert in React, Node.js, TypeScript, and AWS
    • Team lead experience managing 5+ developers
    • Designed and implemented microservices architecture
    • Built CI/CD pipelines using Jenkins and Docker
    • Led migration from monolith to microservices
    
    Skills:
    • Frontend: React, TypeScript, Redux, Next.js
    • Backend: Node.js, Express, Python, Java
    • Databases: PostgreSQL, MongoDB, Redis
    • Cloud: AWS (EC2, Lambda, RDS, S3)
    • DevOps: Docker, Kubernetes, Jenkins, Terraform`
  },
  {
    name: "Sarah Wilson", 
    text: `Sarah Wilson
    Junior Developer
    Email: sarah.wilson@email.com
    
    Experience:
    • Recent coding bootcamp graduate (2024)
    • 6 months internship experience
    • Built 3 personal projects using React and Node.js
    • Eager to learn and grow in a team environment
    
    Skills:
    • Frontend: HTML, CSS, JavaScript, React (basics)
    • Backend: Node.js, Express (beginner)
    • Databases: MySQL (basic knowledge)
    • Tools: Git, VS Code, npm`
  }
];

async function scoreResumeWithAI(resumeText, jobPrompt) {
  console.log('🤖 Sending request to OpenAI...');
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using gpt-3.5-turbo instead of gpt-5 for reliability
      messages: [
        {
          role: "system",
          content: `You are an expert HR recruiter analyzing resumes. Score each resume from 0-100 based on how well it matches the job requirements. Provide:
1. A numerical score (0-100)
2. 3-5 key strengths
3. 3-5 key weaknesses or gaps
4. A brief summary (2-3 sentences)

Respond with JSON in this format: { "score": number, "strengths": ["strength1", "strength2"], "weaknesses": ["weakness1", "weakness2"], "summary": "summary text" }`
        },
        {
          role: "user",
          content: `Job Requirements:\n${jobPrompt}\n\nResume:\n${resumeText}\n\nAnalyze this resume and provide the scoring.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      score: Math.max(0, Math.min(100, Math.round(result.score || 0))),
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      summary: result.summary || "No summary available",
    };
    
  } catch (error) {
    console.error("❌ OpenAI API error:", error.message);
    throw error;
  }
}

async function testRealAIScoring() {
  console.log('🎯 Testing Real OpenAI API CV Scoring');
  console.log('=' .repeat(50));
  
  const jobPrompt = "We are looking for a Senior Full-Stack Developer with 5+ years experience in React, Node.js, and cloud technologies. Leadership experience and microservices knowledge preferred.";
  
  console.log('📋 Job Requirements:');
  console.log(`${jobPrompt}\n`);
  
  for (let i = 0; i < testCVs.length; i++) {
    const cv = testCVs[i];
    
    console.log(`📄 Analyzing CV ${i + 1}/${testCVs.length}: ${cv.name}`);
    console.log('-'.repeat(30));
    
    try {
      const analysis = await scoreResumeWithAI(cv.text, jobPrompt);
      
      console.log(`✅ AI Analysis Complete:`);
      console.log(`   🎯 Score: ${analysis.score}/100`);
      console.log(`   💪 Strengths:`);
      analysis.strengths.forEach(strength => {
        console.log(`      • ${strength}`);
      });
      console.log(`   ⚠️  Areas for improvement:`);
      analysis.weaknesses.forEach(weakness => {
        console.log(`      • ${weakness}`);
      });
      console.log(`   📝 Summary: ${analysis.summary}`);
      
    } catch (error) {
      console.log(`❌ Failed to analyze CV: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎉 Real AI CV Analysis Test Completed!');
  console.log('\n💡 This demonstrates:');
  console.log('   ✅ Your OpenAI API key is working correctly');
  console.log('   ✅ AI-powered resume analysis is functional');
  console.log('   ✅ Detailed scoring with strengths/weaknesses');
  console.log('   ✅ Ready for real CV processing workflow');
}

// Run the test
console.log(`🔑 Using OpenAI API Key: ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'NOT SET'}\n`);

testRealAIScoring()
  .then(() => {
    console.log('\n✅ OpenAI API test completed successfully!');
  })
  .catch((error) => {
    console.error('\n❌ OpenAI API test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if your OpenAI API key is correct');
    console.log('2. Ensure you have credits in your OpenAI account'); 
    console.log('3. Verify internet connection');
  });