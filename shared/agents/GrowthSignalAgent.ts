import { Type, ThinkingLevel } from "@google/genai";
import { EcomStore } from "../types.ts";
import { AgentResponse, BaseAgent } from "./types.ts";
import { safeJsonParse } from "../utils/json.ts";
import { callGeminiWithRetry, getGeminiClient } from "../utils/ai.ts";

export class GrowthSignalAgent implements BaseAgent {
  name = "Growth Signal Agent";
  role = "Market Intelligence Analyst";
  goal = "Identify 'Why Now' signals for outreach, such as hiring, funding, or new product launches.";

  async process(lead: EcomStore): Promise<AgentResponse<Partial<EcomStore>>> {
    const ai = getGeminiClient();
    const model = "gemini-3-flash-preview";

    const systemInstruction = `You are the "Growth Signal" Agent. Your job is to find the "Why Now" reasons for an agency to reach out to: ${lead.name} (${lead.url}).
    
    SIGNALS TO FIND:
    1. HIRING: Are they hiring for marketing, ads, or e-commerce roles? (Check LinkedIn, Indeed, or their Careers page).
    2. RECENT NEWS: Any press releases, funding rounds, or awards?
    3. PRODUCT LAUNCHES: Have they recently launched a new collection or product line?
    4. COMPETITORS: Identify 2-3 direct competitors and what they are doing better.
    5. CRO GAPS: Identify obvious conversion killers on their site (e.g., no reviews on product pages, slow mobile load).
    
    STRICT RULE: Only provide data you can verify through search results. If you find a likely signal, include it.`;

    const response = await callGeminiWithRetry(ai, {
      model,
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `Find growth signals and competitor data for "${lead.name}" (${lead.url}). 
          Search for "${lead.name} hiring marketing", "${lead.name} funding", "${lead.name} new product launch", and "${lead.name} competitors". 
          Also, perform a quick CRO audit of their website.` 
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
            growthSignals: {
              type: Type.OBJECT,
              properties: {
                isHiring: { type: Type.BOOLEAN },
                recentNews: { type: Type.STRING },
                newProductLaunch: { type: Type.BOOLEAN },
                fundingStatus: { type: Type.STRING }
              }
            },
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
            croInsights: {
              type: Type.OBJECT,
              properties: {
                trustSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
                checkoutFriction: { type: Type.ARRAY, items: { type: Type.STRING } },
                mobileOptimization: { type: Type.STRING },
                pageSpeedScore: { type: Type.STRING },
                conversionKillers: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedFixes: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });

    const data = safeJsonParse(response.text, {} as any);
    
    return {
      data,
      confidence: 80,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web?.uri).filter(Boolean) as string[] || [],
      agentName: this.name,
      timestamp: new Date().toISOString()
    };
  }
}
