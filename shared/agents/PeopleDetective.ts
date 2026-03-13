import { Type, ThinkingLevel } from "@google/genai";
import { EcomStore } from "../types.ts";
import { AgentResponse, BaseAgent } from "./types.ts";
import { safeJsonParse } from "../utils/json.ts";
import { callGeminiWithRetry, getGeminiClient } from "../utils/ai.ts";

export class PeopleDetectiveAgent implements BaseAgent {
  name = "People Detective";
  role = "Executive Headhunter";
  goal = "Find the real decision-makers (Founders, CEOs, CMOs) and their direct contact info.";

  async process(lead: EcomStore): Promise<AgentResponse<EcomStore>> {
    const ai = getGeminiClient();
    const model = "gemini-3-flash-preview";

    const systemInstruction = `You are the "People Detective" Agent. Your sole mission is to find the HUMAN behind the brand: ${lead.name} (${lead.url}).
    
    SEARCH STRATEGY:
    1. USE SEARCH TOOL EXTENSIVELY: Do not give up after one search. Try different combinations of keywords.
    2. SEARCH LINKEDIN: Use Google Search to find "LinkedIn [Brand Name] Founder" or "LinkedIn [Brand Name] CEO".
    3. SEARCH ABOUT US: Look for names in the brand story on their website.
    4. SEARCH PRESS RELEASES: Find who is quoted in news articles or interviews about ${lead.name}.
    5. SEARCH WHOIS/CONTACT: Look for administrative contact names.
    6. EMAIL DISCOVERY: Look for patterns like [firstname]@[brandurl].com or check contact pages for specific names.
    7. OUTCOME FOCUS: Your goal is to find a specific person to address in the outreach. A name is 10x more valuable than a generic "Support" email.
    
    REQUIRED DATA (Be as specific as possible):
    - Full Name (e.g., "John Doe")
    - Job Title (e.g., "Founder & CEO")
    - LinkedIn Profile URL (Must be a valid linkedin.com/in/ URL)
    - Direct Email Address (Look for personal or direct work emails)
    - Social Media (Twitter/X, Instagram)
    
    If you find multiple people, pick the most senior decision-maker (Founder > CEO > CMO > Marketing Manager).
    DO NOT return generic info like "Support Team". If you can't find a person, leave the fields empty but try your absolute best.`;

    const response = await callGeminiWithRetry(ai, {
      model,
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `Find the decision maker (Founder, CEO, or CMO) for the brand "${lead.name}" at ${lead.url}. 
          Search for their LinkedIn profile, direct email, and other contact details. 
          Use search queries like "LinkedIn ${lead.name} founder", "LinkedIn ${lead.name} CEO", and "${lead.name} about us". 
          Be as specific as possible. If you find a name, try to find their direct work or personal email.` 
        }] 
      }],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            founderInfo: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                title: { type: Type.STRING },
                linkedin: { type: Type.STRING },
                twitter: { type: Type.STRING },
                instagram: { type: Type.STRING },
                facebook: { type: Type.STRING },
                personalEmail: { type: Type.STRING }
              }
            },
            founderPresence: {
              type: Type.OBJECT,
              properties: {
                linkedinFollowers: { type: Type.NUMBER },
                isThoughtLeader: { type: Type.BOOLEAN },
                activityLevel: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const data = safeJsonParse(response.text, { founderInfo: {} as any, founderPresence: {} as any });
    
    return {
      data: {
        ...lead,
        founderInfo: data.founderInfo,
        founderPresence: data.founderPresence
      },
      confidence: data.founderInfo?.name ? 90 : 0,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web?.uri).filter(Boolean) as string[] || [],
      agentName: this.name,
      timestamp: new Date().toISOString()
    };
  }
}
