import { Type, ThinkingLevel } from "@google/genai";
import { BusinessProfile, Intent } from "../types.ts";
import { AgentResponse, BaseAgent } from "./types.ts";
import { safeJsonParse } from "../utils/json.ts";
import { callGeminiWithRetry, getGeminiClient } from "../utils/ai.ts";

export class StrategySpecialistAgent implements BaseAgent {
  name = "Strategy Specialist";
  role = "B2B Growth Strategist & Market Analyst";
  goal = "Analyze a business and identify 10 high-value, intent-based market segments for lead generation.";

  async process(input: { profile: BusinessProfile }): Promise<AgentResponse<Intent[]>> {
    const ai = getGeminiClient();
    const { profile } = input;
    const model = "gemini-3-flash-preview";

    const systemInstruction = `You are the "Strategy Specialist" Agent. Your goal is to help a business find its ideal customers by identifying 8-10 highly specific "Intents" or market segments.
    
    BUSINESS INFO:
    - Name: ${profile.name}
    - Website: ${profile.website}
    - Offer: ${profile.offer}
    - Services/Products: ${profile.services}
    
    YOUR TASK:
    1. Analyze the business's value proposition.
    2. Identify 8-10 distinct "Intent Hubs". An intent hub is a specific group of potential customers who are likely to need this business's offer RIGHT NOW.
    3. For each Intent Hub, provide:
       - Title: A catchy, professional name for the segment.
       - Description: Why this segment is a good fit.
       - Keywords: 3-5 specific keywords related to this intent.
       - SearchQuery: A specific search query that would find these types of stores (e.g., "site:myshopify.com 'sustainable packaging'").
       - Pitch Angles: 2-3 specific "hooks" or conversation starters tailored to this segment's pain points.
       - PotentialValue: A score of 'Low', 'Medium', 'High', or 'Very High'.
    
    STRICT CONSTRAINTS:
    - Be specific. Don't just say "Small Businesses". Say "Boutique E-commerce brands in the UK struggling with high cart abandonment".
    - Be strategic. Think about buying signals (e.g., hiring, expansion, tech gaps).
    - Be authentic. The pitch angles should sound like a human expert, not a generic sales bot.
    - BE CONCISE: Keep descriptions and pitch angles short and punchy.
    - OUTCOME FOCUS: Focus on segments where the business's offer provides the highest ROI or solves the most urgent problem.
    - PLATFORM AGNOSTIC: Include segments that might be on Shopify, WooCommerce, or other platforms. Search queries should reflect this (e.g., use "site:myshopify.com" or "powered by woocommerce").`;

    const response = await callGeminiWithRetry(ai, {
      model,
      contents: [{ role: "user", parts: [{ text: `Generate 8-10 high-value intents for ${profile.name}.` }] }],
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        maxOutputTokens: 8000,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              searchQuery: { type: Type.STRING },
              keywords: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              pitchAngles: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              potentialValue: { 
                type: Type.STRING,
                enum: ['Low', 'Medium', 'High', 'Very High']
              }
            },
            required: ["title", "description", "searchQuery", "keywords", "pitchAngles", "potentialValue"]
          }
        }
      }
    });

    const rawIntents = safeJsonParse(response.text, [] as any[]);
    const intents: Intent[] = rawIntents.map((intent, index) => ({
      ...intent,
      id: `intent-${Date.now()}-${index}`,
      businessProfileId: profile.id,
      createdAt: new Date().toISOString()
    }));
    
    return {
      data: intents,
      confidence: 100,
      sources: [],
      agentName: this.name,
      timestamp: new Date().toISOString()
    };
  }
}
