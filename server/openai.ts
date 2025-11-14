// OpenAI integration using javascript_openai blueprint
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY must be set");
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert HR recruiter analyzing resumes. Score each resume from 0-100 based on how well it matches the job requirements. Provide:
1. A numerical score (0-100)
2. 3-5 key strengths
3. 3-5 key weaknesses or gaps
4. A brief summary (2-3 sentences)

Respond with JSON in this format: { "score": number, "strengths": string[], "weaknesses": string[], "summary": string }`,
        },
        {
          role: "user",
          content: `Job Requirements:\n${jobPrompt}\n\nResume:\n${resumeText}\n\nAnalyze this resume and provide the scoring.`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
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
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
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
