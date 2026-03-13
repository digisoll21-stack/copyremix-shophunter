import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";

export function getGeminiClient(): GoogleGenAI {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is missing or empty. Please set it in the Settings menu.");
  }
  
  // Clean the API key (remove quotes if present)
  apiKey = apiKey.trim().replace(/^["']|["']$/g, "");
  
  if (apiKey.includes("YOUR_API_KEY") || apiKey === "undefined" || apiKey === "null") {
    throw new Error(`GEMINI_API_KEY is set to an invalid value ("${apiKey}"). Please set a real API key in the Settings menu.`);
  }

  return new GoogleGenAI({ apiKey });
}

export async function callGeminiWithRetry(
  ai: GoogleGenAI,
  params: GenerateContentParameters,
  retries = 3
): Promise<GenerateContentResponse> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      return response;
    } catch (e) {
      lastError = e;
      console.warn(`Gemini call failed (attempt ${i + 1}/${retries}):`, e);
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw lastError;
}
