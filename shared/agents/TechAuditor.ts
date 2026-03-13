import { Type, ThinkingLevel } from "@google/genai";
import { EcomStore } from "../types.ts";
import { AgentResponse, BaseAgent } from "./types.ts";
import { safeJsonParse } from "../utils/json.ts";
import { callGeminiWithRetry, getGeminiClient } from "../utils/ai.ts";
import { getTechStack } from "../services/wappalyzer.ts";
import { getSEOMetrics, getTrafficMetrics } from "../services/dataforseo.ts";
import { searchGoogle } from "../services/serper.ts";

export class TechAuditorAgent implements BaseAgent {
  name = "Tech Auditor";
  role = "Technical SEO & Ads Strategist";
  goal = "Identify technical failures, SEO gaps, and advertising opportunities that an agency can exploit.";

  async process(lead: EcomStore): Promise<AgentResponse<EcomStore>> {
    const ai = getGeminiClient();
    const model = "gemini-3-flash-preview";

    // 1. Use Serper to find ad libraries and technical footprints
    const searchResults = await searchGoogle(`"${lead.name}" Facebook Ad Library OR "TikTok Creative Center" OR "Google Ads Transparency"`, 10);
    const searchContext = searchResults.length > 0
      ? `REAL-TIME SEARCH RESULTS (via Serper.dev):\n${searchResults.map(r => `- ${r.title}: ${r.link}\n  Snippet: ${r.snippet}`).join('\n')}`
      : "No real-time search results found via Serper API.";

    // 2. Fetch real tech stack from Wappalyzer (Margin-friendly alternative to BuiltWith)
    const techStack = await getTechStack(lead.url);
    const techContext = techStack.length > 0 
      ? `VERIFIED TECH STACK (from Wappalyzer): ${techStack.map(t => t.name).join(', ')}`
      : "No verified tech stack found via API.";

    // Fetch real SEO and Traffic metrics from DataForSEO
    const [seoData, trafficData] = await Promise.all([
      getSEOMetrics(lead.url),
      getTrafficMetrics(lead.url)
    ]);

    const seoContext = seoData 
      ? `VERIFIED SEO METRICS (from DataForSEO):
         - Organic Keywords: ${seoData.organic_keywords}
         - Estimated Organic Traffic: ${seoData.organic_traffic}/mo
         - Top Keywords: ${seoData.top_keywords.map(k => `${k.keyword} (Pos: ${k.pos})`).join(', ')}
         - Backlinks: ${seoData.backlinks_count || 'N/A'}`
      : "No verified SEO metrics found via API.";

    const trafficContext = trafficData
      ? `VERIFIED TRAFFIC METRICS (from DataForSEO Traffic API):
         - Total Monthly Visits: ${trafficData.total_visits}
         - Paid Traffic: ${trafficData.paid_traffic_percent.toFixed(1)}%
         - Organic Traffic: ${trafficData.organic_traffic_percent.toFixed(1)}%
         - Bounce Rate: ${(trafficData.bounce_rate * 100).toFixed(1)}%
         - Avg Visit Duration: ${Math.floor(trafficData.avg_visit_duration / 60)}m ${Math.floor(trafficData.avg_visit_duration % 60)}s
         - Top Traffic Sources: ${trafficData.top_sources.map(s => `${s.source} (${s.percent.toFixed(1)}%)`).join(', ')}`
      : "No verified traffic metrics found via API.";

    const systemInstruction = `You are the "Tech Auditor" Agent. Your job is to find the "Gaps" in the store's digital presence: ${lead.name} (${lead.url}).
    
    ${searchContext}
    ${techContext}
    ${seoContext}
    ${trafficContext}
    
    AUDIT FOCUS:
    1. USE SEARCH TOOL EXTENSIVELY: Search for ad libraries, tech stacks, and SEO tools to find real data.
    2. SEO GAPS: Use the provided DataForSEO metrics as your primary source. Look for missing meta tags, poor mobile optimization, slow load times, or lack of a blog/content strategy. Identify keywords they rank for on page 2 (pos 11-20) as "low hanging fruit".
    3. AD INSIGHTS & SPEND: Use the provided traffic metrics to estimate ad spend. 
       - Formula: (Total Visits * Paid Traffic %) * $1.00 (estimated CPC).
       - Compare Paid vs Organic traffic. If Paid is low but they have pixels (from tech stack), identify a "Scaling Gap".
       - Look for "Facebook Ad Library [Brand Name]" or "TikTok Creative Center [Brand Name]".
    4. CONVERSION GAPS: Use the Bounce Rate and Avg Visit Duration. If Bounce Rate is > 60%, identify a "Landing Page/CRO Gap".
    5. TECH STACK: Use the provided Wappalyzer data as your primary source. Identify their Shopify apps. Are they missing crucial ones like Klaviyo (Email), Loox/Okendo (Reviews), or Postscript (SMS)?
    6. ORGANIC OPPORTUNITY: Identify keywords they should be ranking for but aren't, using the top keywords context.
    7. OUTCOME FOCUS: Your audit should provide "ammunition" for the outreach. Identify specific, fixable problems that an agency can solve to increase the brand's revenue.
    
    OUTPUT REQUIREMENTS:
    - marketingHook: A 1-sentence "killer" pitch an agency could use to open a conversation.
    - scalingStatus: Must be "Scaling", "Testing", or "Stable".
    - estimatedSpend: Provide a range (e.g., "$5k-$10k/mo") based on the traffic metrics and ad volume.`;

    const response = await callGeminiWithRetry(ai, {
      model,
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `Perform a deep tech and marketing audit for the brand "${lead.name}" (${lead.url}). 
          Use the provided search results, tech stack, and SEO metrics as your primary sources.
          Find if they are running ads on Meta, Google, or TikTok. 
          Identify their creative style, scaling status, and estimated monthly ad spend. 
          Search for "Facebook Ad Library ${lead.name}", "TikTok Creative Center ${lead.name}", and "${lead.name} shopify apps".` 
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
            adInsights: {
              type: Type.OBJECT,
              properties: {
                estimatedSpend: { type: Type.STRING },
                creativeStyle: { type: Type.STRING },
                retargetingEnabled: { type: Type.BOOLEAN },
                adCopyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
                primaryAdPlatform: { type: Type.STRING },
                marketingHook: { type: Type.STRING },
                estimatedAOV: { type: Type.STRING },
                scalingStatus: { type: Type.STRING }
              }
            },
            seoInsights: {
              type: Type.OBJECT,
              properties: {
                topKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                seoGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                organicOpportunity: { type: Type.STRING },
                seoStrategy: { type: Type.STRING }
              }
            },
            apps: { type: Type.ARRAY, items: { type: Type.STRING } },
            appCount: { type: Type.NUMBER },
            trafficMetrics: {
              type: Type.OBJECT,
              properties: {
                monthlyVisits: { type: Type.NUMBER },
                bounceRate: { type: Type.NUMBER },
                avgDuration: { type: Type.NUMBER },
                paidTrafficPercent: { type: Type.NUMBER },
                organicTrafficPercent: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    });

    const data = safeJsonParse(response.text, {} as any);
    
    return {
      data: {
        ...lead,
        ...data
      },
      confidence: 85,
      sources: [
        ...searchResults.map(r => r.link),
        ...(response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web?.uri).filter(Boolean) as string[] || [])
      ],
      agentName: this.name,
      timestamp: new Date().toISOString()
    };
  }
}
