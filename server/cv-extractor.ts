import * as pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await (pdfParse as any)(buffer);
    return data.text.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error("Failed to extract text from DOCX");
  }
}

export async function extractTextFromCV(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  const normalizedType = fileType.toLowerCase();

  if (normalizedType === "pdf" || normalizedType === "application/pdf") {
    return extractTextFromPDF(buffer);
  } else if (
    normalizedType === "docx" ||
    normalizedType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    normalizedType === "doc" ||
    normalizedType === "application/msword"
  ) {
    return extractTextFromDOCX(buffer);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}
