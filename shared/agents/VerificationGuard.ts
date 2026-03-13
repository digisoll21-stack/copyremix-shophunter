import { Type, ThinkingLevel } from "@google/genai";
import { EcomStore } from "../types.ts";
import { AgentResponse, BaseAgent } from "./types.ts";
import { safeJsonParse } from "../utils/json.ts";
import { callGeminiWithRetry, getGeminiClient } from "../utils/ai.ts";
import { getSEOMetrics, getTrafficMetrics } from "../services/dataforseo.ts";
import { getTechStack } from "../services/wappalyzer.ts";
import { searchGoogle } from "../services/serper.ts";

export class VerificationGuardAgent implements BaseAgent {
  name = "Verification Guard";
  role = "Data Integrity Officer";
  goal = "Verify and audit lead data to ensure 99% accuracy and calculate a true confidence score.";

  async process(lead: EcomStore): Promise<AgentResponse<EcomStore>> {
    const ai = getGeminiClient();
    const model = "gemini-3-flash-preview";

    // 1. Use Serper for a high-speed "first look" at the brand's presence
    const searchResults = await searchGoogle(`${lead.name} ${lead.url} contact revenue headquarters`, 10);
    const searchContext = searchResults.length > 0
      ? `REAL-TIME SEARCH RESULTS (via Serper.dev):\n${searchResults.map(r => `- ${r.title}: ${r.link}\n  Snippet: ${r.snippet}`).join('\n')}`
      : "No real-time search results found via Serper API.";

    // 2. Fetch real data from DataForSEO & Wappalyzer (Margin-friendly alternative to StoreLeads)
    const [seoData, trafficData, techStack] = await Promise.all([
      getSEOMetrics(lead.url),
      getTrafficMetrics(lead.url),
      getTechStack(lead.url)
    ]);

    const platform = techStack.find(t => 
      t.categories.some(c => c.slug === 'ecommerce')
    )?.name || 'Unknown';

    const businessContext = seoData 
      ? `VERIFIED BUSINESS DATA (from DataForSEO & Wappalyzer): 
         - Platform: ${platform}
         - Total Monthly Visits: ${trafficData?.total_visits || 'N/A'}
         - Paid Traffic: ${trafficData?.paid_traffic_percent.toFixed(1) || '0'}%
         - Organic Keywords: ${seoData.organic_keywords}
         - Backlinks: ${seoData.backlinks_count}`
      : `VERIFIED TECH DATA (from Wappalyzer):
         - Platform: ${platform}`;

    const systemInstruction = `You are the "Verification Guard" Agent. Your job is to AUDIT the following lead data for the store: ${lead.name} (${lead.url}).
    
    ${searchContext}
    ${businessContext}
    
    YOUR MISSION:
    1. USE SEARCH TOOL EXTENSIVELY: Cross-reference multiple sources to confirm data.
    2. CROSS-REFERENCE: Use the provided search results and your search tool to find multiple sources confirming the store's existence, revenue, and decision-makers.
    3. FLAG INCONSISTENCIES: If the provided data doesn't match what you find online or in the verified business data, correct it.
    4. CALCULATE CONFIDENCE: Provide a confidence score (0-100) based on the "Verifiability Index":
       - 100: Found on multiple reliable sources (LinkedIn, Crunchbase, Official Site, News) and matches verified metrics.
       - 75: Found on official site and social media.
       - 50: Found on one source only.
       - <25: Unverifiable or suspicious.
    5. OUTCOME FOCUS: Prioritize verifying contact details and revenue data, as these are critical for the user's outreach success.
    
    STRICT RULE: Only provide data you can verify through search results or the provided business context. If you find a likely contact email or revenue range, include it but set the confidence score accordingly. DO NOT hallucinate completely fake data.`;

    const response = await callGeminiWithRetry(ai, {
      model,
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `Verify all data for the e-commerce brand "${lead.name}" (${lead.url}). 
          Use the provided search results and verified business data as your primary sources.
          Confirm their estimated monthly revenue, contact email address, and operational status. 
          Search for "${lead.name} contact email", "${lead.name} revenue", and "${lead.name} headquarters". 
          Cross-reference with multiple sources like LinkedIn, Crunchbase, and their official website.` 
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
            name: { type: Type.STRING },
            url: { type: Type.STRING },
            description: { type: Type.STRING },
            niche: { type: Type.STRING },
            estimatedRevenue: { type: Type.STRING },
            isRunningAds: { type: Type.BOOLEAN },
            contactEmail: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
            verificationStatus: { type: Type.STRING },
            dataSources: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const verifiedData = safeJsonParse(response.text, {} as EcomStore);
    
    return {
      data: {
        ...verifiedData,
        verificationStatus: verifiedData.confidenceScore && verifiedData.confidenceScore > 80 ? 'Verified' : 'Partially Verified',
        lastVerifiedAt: new Date().toISOString()
      },
      confidence: verifiedData.confidenceScore || 0,
      sources: [
        ...searchResults.map(r => r.link),
        ...(verifiedData.dataSources || []),
        ...(response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web?.uri).filter(Boolean) as string[] || [])
      ],
      agentName: this.name,
      timestamp: new Date().toISOString()
    };
  }
}
