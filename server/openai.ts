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
    throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment secrets.");
  }
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert HR recruiter. Score resumes 0-100 vs job requirements. Return JSON: {"score": number, "strengths": ["str1"], "weaknesses": ["weak1"], "summary": "brief"}`,
        },
        {
          role: "user",
          content: `Job: ${jobPrompt.slice(0, 500)}\n\nResume: ${resumeText.slice(0, 2000)}\n\nScore this resume.`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      score: Math.max(0, Math.min(100, Math.round(result.score || 0))),
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
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
    return {
      name: "Unknown Candidate",
      email: null,
      phone: null,
    };
  }
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Extract the candidate's name, email, and phone number from the resume text. Respond with JSON: { "name": string, "email": string | null, "phone": string | null }`,
        },
        {
          role: "user",
          content: resumeText,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      name: result.name || "Unknown Candidate",
      email: result.email || null,
      phone: result.phone || null,
    };
  } catch (error) {
    console.error("Failed to extract candidate info:", error);
    return {
      name: "Unknown Candidate",
      email: null,
      phone: null,
    };
  }
}
