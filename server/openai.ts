// OpenAI integration using javascript_openai blueprint
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("⚠️  OPENAI_API_KEY not set - AI features will not work. Please add your OpenAI API key in the Secrets tab.");
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export interface ResumeScore {
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export async function scoreResume(
  resumeText: string,
  jobPrompt: string
): Promise<ResumeScore> {
  if (!openai) {
    // Fallback scoring without OpenAI API key - for testing
    console.warn("⚠️  Using fallback scoring (no OpenAI API key). For real AI-powered scoring, add OPENAI_API_KEY to secrets.");
    
    // Generate a pseudo-random score based on resume content length and keywords
    let score = 50; // base score
    const lowerResume = resumeText.toLowerCase();
    const keywords = ['experienced', 'skilled', 'proficient', 'expertise', 'professional', 'certification', 'award', 'achievement'];
    
    // Increase score for relevant keywords
    keywords.forEach(keyword => {
      if (lowerResume.includes(keyword)) score += 5;
    });
    
    // Longer resumes usually contain more info = higher score
    score += Math.min(20, resumeText.length / 500);
    
    // Ensure score is 0-100
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    return {
      score,
      strengths: ["Document content detected", "Professional format identified"],
      weaknesses: ["Unable to perform detailed AI analysis without OpenAI API key"],
      summary: `Fallback analysis - Resume has ${resumeText.length} characters of content`,
    };
  }
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Score resume vs job fit 0-100. JSON: {"score":N,"strengths":["s1","s2"],"weaknesses":["w1","w2"],"summary":"brief"}`,
        },
        {
          role: "user",
          content: `Job:${jobPrompt.slice(0, 300)}\nResume:${resumeText.slice(0, 1500)}\nScore:`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 250,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      score: Math.max(0, Math.min(100, Math.round(result.score || 0))),
      strengths: (Array.isArray(result.strengths) ? result.strengths : []).slice(0, 3),
      weaknesses: (Array.isArray(result.weaknesses) ? result.weaknesses : []).slice(0, 3),
      summary: result.summary || "No summary available",
    };
  } catch (error) {
    console.error("Failed to score resume:", error);
    throw new Error("Failed to analyze resume with AI");
  }
}

export async function extractCandidateInfo(resumeText: string): Promise<{
  name: string;
  email: string | null;
  phone: string | null;
}> {
  if (!openai) {
    console.warn("OpenAI not configured - using fallback candidate extraction");
    return extractCandidateInfoFallback(resumeText);
  }
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You must respond with valid JSON. Extract candidate info from resume.`,
        },
        {
          role: "user",
          content: `Extract name, email, phone from this resume and respond with JSON in this exact format: {"name":"full name or null","email":"email@example.com or null","phone":"phone number or null"}\n\nResume:\n${resumeText.slice(0, 1000)}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 150,
    });

    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);

    const name = result.name?.trim() || null;
    const email = result.email?.trim() || null;
    const phone = result.phone?.trim() || null;

    // If AI couldn't extract name, try fallback extraction
    if (!name) {
      console.warn("AI extraction returned null name, using fallback extraction");
      return extractCandidateInfoFallback(resumeText);
    }

    return {
      name: name || "Unknown Candidate",
      email: email,
      phone: phone,
    };
  } catch (error) {
    console.error("Failed to extract candidate info with AI:", error);
    // Fall back to pattern-based extraction
    return extractCandidateInfoFallback(resumeText);
  }
}

// Fallback extraction using regex patterns
function extractCandidateInfoFallback(resumeText: string): {
  name: string;
  email: string | null;
  phone: string | null;
} {
  let name = "Unknown Candidate";
  let email: string | null = null;
  let phone: string | null = null;

  // Extract email using regex
  const emailMatch = resumeText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) {
    email = emailMatch[0];
  }

  // Extract phone using regex (various formats)
  const phoneMatch = resumeText.match(/(\+?1?\s*[-.]?\(?(\d{3})\)?[-.]?\s?(\d{3})[-.]?(\d{4}))|(\+?[\d\s\-\(\)]{10,})/);
  if (phoneMatch) {
    phone = phoneMatch[0].trim();
  }

  // Extract name from first line (usually contains name)
  const lines = resumeText.split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Look for a line that looks like a name (no email, phone, or special chars)
    if (!firstLine.includes('@') && !firstLine.match(/\d{3}/) && firstLine.length < 100) {
      name = firstLine;
    }
  }

  // If still no name, try to find a line after "name" or "Name"
  if (name === "Unknown Candidate") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('name:') || line.includes('name -')) {
        if (lines[i + 1]) {
          name = lines[i + 1].trim();
          break;
        }
      }
    }
  }

  return { name, email, phone };
}
