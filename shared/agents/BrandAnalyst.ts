import { Type, ThinkingLevel } from "@google/genai";
import { EcomStore } from "../types.ts";
import { AgentResponse, BaseAgent } from "./types.ts";
import { safeJsonParse } from "../utils/json.ts";
import { callGeminiWithRetry, getGeminiClient } from "../utils/ai.ts";

export class BrandAnalystAgent implements BaseAgent {
  name = "Brand Analyst";
  role = "Competitive Intelligence Expert";
  goal = "Identify and analyze direct competitors to find market gaps and advantages.";

  async process(input: { lead: EcomStore }): Promise<AgentResponse<any>> {
    const ai = getGeminiClient();
    const { lead } = input;
    const model = "gemini-3-flash-preview";

    const systemInstruction = `You are the "Brand Analyst" Agent. Your job is to perform a deep competitive analysis for ${lead.name} (${lead.url}).
    
    TASKS:
    1. IDENTIFY COMPETITORS: Find 3-4 direct competitors in the ${lead.niche} niche.
    2. ANALYZE GAPS: Compare ${lead.name} against these competitors. Look for:
       - Pricing differences
       - Marketing channel gaps (e.g., competitors are on TikTok, ${lead.name} isn't)
       - Product range differences
       - Brand positioning (Luxury vs. Value)
    3. FIND THE "UNFAIR ADVANTAGE": Identify one specific area where ${lead.name} is actually better than competitors, and one area where they are losing.
    
    OUTPUT FORMAT:
    Return a JSON object with:
    - competitors: Array of { name, url, advantage (what they do better than our lead) }
    - marketGaps: Array of strings identifying what ${lead.name} is missing.
    - positioning: A short description of where ${lead.name} sits in the market.
    - recommendation: A high-level strategic recommendation for the agency to pitch.`;

    const response = await callGeminiWithRetry(ai, {
      model,
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `Perform a competitive analysis for ${lead.name} in the ${lead.niche} niche. 
          Use their URL ${lead.url} as the primary reference.` 
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
            competitors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  url: { type: Type.STRING },
                  advantage: { type: Type.STRING }
                }
              }
            },
            marketGaps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            positioning: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            socialEngagement: {
              type: Type.OBJECT,
              properties: {
                instagramFollowers: { type: Type.NUMBER },
                facebookFollowers: { type: Type.NUMBER },
                twitterFollowers: { type: Type.NUMBER },
                engagementLevel: { type: Type.STRING },
                lastPostDate: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const results = safeJsonParse(response.text, {});
    
    return {
      data: {
        ...lead,
        ...results
      },
      confidence: 85,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web?.uri).filter(Boolean) as string[] || [],
      agentName: this.name,
      timestamp: new Date().toISOString()
    };
  }
}
