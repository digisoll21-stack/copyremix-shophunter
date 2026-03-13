import { Type, ThinkingLevel } from "@google/genai";
import { EcomStore, BusinessProfile } from "../types.ts";
import { AgentResponse, BaseAgent } from "./types.ts";
import { safeJsonParse } from "../utils/json.ts";
import { callGeminiWithRetry, getGeminiClient } from "../utils/ai.ts";

export class DealCloserAgent implements BaseAgent {
  name = "Deal Closer";
  role = "High-Stakes Sales Strategist";
  goal = "Synthesize all intent signals into a high-conversion closing strategy.";

  async process(input: { lead: EcomStore; profile: BusinessProfile }): Promise<AgentResponse<any>> {
    const ai = getGeminiClient();
    const { lead, profile } = input;
    const model = "gemini-3-flash-preview";

    const systemInstruction = `You are the "Deal Closer" Agent. Your job is to create a "Closing Strategy" for ${profile.name} to win ${lead.name} as a client.
    
    CONTEXT:
    - Lead: ${lead.name} (${lead.url})
    - Intent Signals: ${lead.intentSignals?.join(', ') || 'General growth opportunity'}
    - SEO Gaps: ${lead.seoInsights?.seoGaps?.join(', ') || 'None identified'}
    - CRO Friction: ${lead.croInsights?.conversionKillers?.join(', ') || 'None identified'}
    - Ad Status: ${lead.isRunningAds ? 'Currently running ads' : 'Not running ads'}
    - Our Offer: ${profile.offer}
    
    TASKS:
    1. THE "WHY NOW": Identify the most urgent reason why ${lead.name} needs ${profile.name}'s services RIGHT NOW.
    2. THE "NO-BRAINER" PITCH: Craft a 1-2 sentence pitch that makes it irrational for them to say no.
    3. THE "OBJECTION HANDLER": Predict the most likely objection they will have and provide a concise response.
    4. THE "CLOSING HOOK": A specific question or offer to end the outreach with (e.g., "I've already drafted a 3-step plan for your [specific gap], want to see it?").
    
    OUTPUT FORMAT:
    Return a JSON object with:
    - urgencyFactor: A string explaining the "Why Now".
    - noBrainerPitch: A 1-2 sentence high-impact pitch.
    - objectionHandler: { objection: string, response: string }
    - closingHook: A high-friction-reducing closing question.`;

    const response = await callGeminiWithRetry(ai, {
      model,
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `Create a closing strategy for ${lead.name}. 
          Leverage these intent signals: ${lead.intentSignals?.join(', ')}. 
          Our offer is: ${profile.offer}.` 
        }] 
      }],
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            urgencyFactor: { type: Type.STRING },
            noBrainerPitch: { type: Type.STRING },
            objectionHandler: {
              type: Type.OBJECT,
              properties: {
                objection: { type: Type.STRING },
                response: { type: Type.STRING }
              }
            },
            closingHook: { type: Type.STRING }
          }
        }
      }
    });

    const results = safeJsonParse(response.text, {});
    
    return {
      data: results,
      confidence: 90,
      sources: [],
      agentName: this.name,
      timestamp: new Date().toISOString()
    };
  }
}
