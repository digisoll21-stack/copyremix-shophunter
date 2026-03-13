import { Type, ThinkingLevel } from "@google/genai";
import { EcomStore, SearchFilters, Intent } from "../types.ts";
import { AgentResponse, BaseAgent } from "./types.ts";
import { safeJsonParse } from "../utils/json.ts";
import { callGeminiWithRetry, getGeminiClient } from "../utils/ai.ts";
import { searchGoogle } from "../services/serper.ts";

export class BrandScoutAgent implements BaseAgent {
  name = "Brand Scout";
  role = "Expert E-commerce Researcher";
  goal = "Find high-potential, authentic e-commerce brands in a specific niche.";

  async process(input: { query: string; filters?: SearchFilters; mission?: Intent }): Promise<AgentResponse<EcomStore[]>> {
    const ai = getGeminiClient();
    const { query, filters, mission } = input;
    const model = "gemini-3-flash-preview";

    // 1. Use Serper to get high-speed search results first
    const searchResults = await searchGoogle(query, 15);
    const searchContext = searchResults.length > 0 
      ? `REAL-TIME SEARCH RESULTS (via Serper.dev):\n${searchResults.map(r => `- ${r.title}: ${r.link}\n  Snippet: ${r.snippet}`).join('\n')}`
      : "No real-time search results found via Serper API.";

    let filterContext = "";
    if (filters) {
      if (filters.revenue) filterContext += `- Estimated Revenue: ${filters.revenue}\n`;
      if (filters.region) filterContext += `- Target Region/Country: ${filters.region}\n`;
      if (filters.adStatus && filters.adStatus !== 'all') {
        filterContext += `- Ad Status: ${filters.adStatus === 'running' ? 'Currently running ads' : 'Not currently running ads'}\n`;
      }
      if (filters.techGap) filterContext += `- Technology/App Focus: ${filters.techGap}\n`;
    }

    let missionContext = "";
    if (mission) {
      missionContext = `
      STRATEGIC MISSION CONTEXT:
      Mission Title: ${mission.title}
      Mission Goal: ${mission.description}
      Strategic Pitch Angle: ${mission.pitchAngles[0]}
      
      For each brand found, you MUST provide a "strategicFit" explanation. 
      This should be a 1-2 sentence reasoning of WHY this brand is a perfect target for this specific mission and how the user's offer (from the pitch angle) solves their specific pain point.
      `;
    }

    const systemInstruction = `You are the "Brand Scout" Agent. Your sole purpose is to find high-quality, authentic e-commerce brands based on the following search intent: "${query}".
    
    ${searchContext}
    
    STRICT CONSTRAINTS:
    1. NO DROPSHIPPING: Exclude stores that look like generic dropshipping sites (e.g., poor design, random product mix, long shipping times).
    2. AUTHENTICITY: Prioritize brands with a clear story, unique products, and strong visual identity.
    3. ACTIVE ONLY: Only include stores that are currently operational and have a valid website.
    4. DATA PRECISION: Use the provided search results as your primary source. If you need more info, you can use your search tool.
    5. OUTCOME FOCUS: Look for brands that are clearly investing in their growth but have visible "low hanging fruit" opportunities (e.g., missing social links, basic SEO, or unoptimized ad presence).
    6. CONCISENESS: Keep descriptions and strategic fit reasoning extremely concise (max 1-2 short sentences each).
    7. PLATFORM DIVERSITY: Look for brands on Shopify, WooCommerce, BigCommerce, Magento, or high-end Custom stacks.
    
    ${missionContext}
    
    ${filterContext ? `APPLY THESE FILTERS:\n${filterContext}` : ""}
    
    For each store, find:
    - Name, URL, Platform (Shopify, WooCommerce, etc.), Description, Niche
    - Estimated Monthly Revenue
    - Ad Status (Running ads or not)
    - Social Media Links
    - Strategic Fit (Reasoning based on the mission)
    - Confidence Score (0-100) based on how verifiable the brand is.`;

    const response = await callGeminiWithRetry(ai, {
      model,
      contents: [{ role: "user", parts: [{ text: `Based on the provided search results and your own research, find 4-6 high-quality E-commerce brands matching this intent: ${query}.` }] }],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        maxOutputTokens: 8000,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              url: { type: Type.STRING },
              platform: { type: Type.STRING, description: "Shopify, WooCommerce, BigCommerce, Magento, or Custom" },
              description: { type: Type.STRING },
              niche: { type: Type.STRING },
              estimatedRevenue: { type: Type.STRING },
              isRunningAds: { type: Type.BOOLEAN },
              strategicFit: { type: Type.STRING },
              socialLinks: {
                type: Type.OBJECT,
                properties: {
                  instagram: { type: Type.STRING },
                  facebook: { type: Type.STRING },
                  twitter: { type: Type.STRING },
                }
              },
              confidenceScore: { type: Type.NUMBER }
            },
            required: ["name", "url", "platform", "description", "niche", "isRunningAds"]
          }
        }
      }
    });

    const results = safeJsonParse(response.text, [] as EcomStore[]);
    
    return {
      data: results,
      confidence: results.reduce((acc, curr) => acc + (curr.confidenceScore || 0), 0) / (results.length || 1),
      sources: [
        ...searchResults.map(r => r.link),
        ...(response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web?.uri).filter(Boolean) as string[] || [])
      ],
      agentName: this.name,
      timestamp: new Date().toISOString()
    };
  }
}
