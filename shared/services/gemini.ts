import { Type } from "@google/genai";
import { EcomStore, SearchFilters, Intent, BusinessProfile, ProgressUpdate } from "../types.ts";
import { safeJsonParse } from "../utils/json.ts";
import { getSupabase } from "./supabase.ts";
import { 
  BrandScoutAgent, 
  VerificationGuardAgent, 
  PeopleDetectiveAgent, 
  TechAuditorAgent,
  GhostwriterAgent,
  GrowthSignalAgent,
  BrandAnalystAgent,
  DealCloserAgent
} from "../agents/index.ts";

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function findEcomBrands(
  query: string, 
  filters?: SearchFilters, 
  onProgress?: (update: ProgressUpdate) => void,
  mission?: Intent,
  forceFresh: boolean = false,
  onLeadFound?: (lead: EcomStore) => void
): Promise<EcomStore[]> {
  const scout = new BrandScoutAgent();
  
  try {
    // 1. Check for "Warm Leads" in our Master Pool (Supabase)
    if (!forceFresh) {
      if (onProgress) onProgress({ step: "Master Pool", percentage: 5, details: "Checking for Warm Leads..." });
      console.log(`[Master Pool] Checking for existing leads in niche: ${query}`);
      
      try {
        let warmLeads: any[] = [];
        const isBackend = typeof window === 'undefined';
        
        if (isBackend) {
          const supabase = getSupabase();
          if (supabase) {
            const { data } = await supabase
              .from('leads')
              .select('*')
              .ilike('data', `%${query}%`)
              .limit(10);
            warmLeads = (data || []).map(l => ({
              ...JSON.parse(l.data),
              status: l.status,
              notes: l.notes
            }));
          }
        } else {
          const response = await fetch(((import.meta as any).env?.VITE_API_URL || '') + `/api/leads?niche=${encodeURIComponent(query)}&limit=10`);
          if (response.ok) {
            warmLeads = await response.json();
          }
        }

        if (warmLeads.length >= 5) {
          console.log(`[Master Pool] Found ${warmLeads.length} warm leads. Recycling intelligence...`);
          if (onProgress) onProgress({ step: "Master Pool", percentage: 10, details: `Found ${warmLeads.length} Warm Leads. Recycling...` });
          
          const enrichedLeads: EcomStore[] = [];
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          for (let i = 0; i < warmLeads.length; i++) {
            const lead = warmLeads[i];
            const lastVerified = lead.lastVerifiedAt ? new Date(lead.lastVerifiedAt) : new Date(0);
            
            let finalLead = lead;
            if (lastVerified < sevenDaysAgo) {
              const progressPercent = 10 + Math.round(((i + 1) / warmLeads.length) * 80);
              if (onProgress) onProgress({ 
                step: "Agent Squad", 
                percentage: progressPercent, 
                details: `Re-verifying ${i + 1}/${warmLeads.length}`,
                agentName: "Verification Guard"
              });
              finalLead = await verifyLeadData(lead);
              await sleep(2000); 
            }
            
            enrichedLeads.push(finalLead);
            if (onLeadFound) onLeadFound(finalLead);
          }
          
          if (onProgress) onProgress({ step: "Complete", percentage: 100, details: "Intelligence recycled successfully." });
          return enrichedLeads;
        }
      } catch (err) {
        console.warn("[Master Pool] Failed to fetch warm leads, falling back to AI search:", err);
      }
    }

    // 2. Fallback to AI Search if no warm leads or forceFresh is true
    if (onProgress) onProgress({ step: "Brand Scout", percentage: 15, details: "Searching Google...", agentName: "Brand Scout" });
    console.log(`[Brand Scout] Searching for stores in niche: ${query}`);
    const response = await scout.process({ query, filters, mission });
    const initialLeads = response.data;
    console.log(`[Brand Scout] Found ${initialLeads.length} initial leads. Starting enrichment...`);

    if (onProgress) onProgress({ step: "Agent Squad", percentage: 25, details: "Initializing Enrichment..." });
    
    const enrichedLeads: EcomStore[] = [];
    
    for (let i = 0; i < initialLeads.length; i++) {
      const lead = initialLeads[i];
      const progressPercent = 25 + Math.round(((i + 1) / initialLeads.length) * 70);
      
      if (onProgress) onProgress({ 
        step: "Agent Squad", 
        percentage: progressPercent, 
        details: `Enriching ${i + 1}/${initialLeads.length}: ${lead.name}`,
        agentName: "Squad Leader"
      });
      
      console.log(`[Agent Squad] Processing lead ${i + 1} of ${initialLeads.length}: ${lead.url}`);
      
      try {
        const enriched = await verifyLeadData(lead);
        enrichedLeads.push(enriched);
        if (onLeadFound) onLeadFound(enriched);
      } catch (err) {
        console.error(`[Agent Squad] Failed to enrich lead ${lead.url}:`, err);
        const fallback = {
          ...lead,
          verificationStatus: 'AI-Scouted' as const,
          confidenceScore: lead.confidenceScore || 60
        };
        enrichedLeads.push(fallback);
        if (onLeadFound) onLeadFound(fallback);
      }
      
      if (i < initialLeads.length - 1) {
        await sleep(3000); 
      }
    }

    if (onProgress) onProgress({ step: "Complete", percentage: 100, details: "Enrichment complete." });
    console.log(`[Agent Squad] Enrichment complete. Returning ${enrichedLeads.length} leads.`);
    return enrichedLeads;
  } catch (error: any) {
    console.error("Error finding stores with Brand Scout:", error);
    throw new Error("Failed to search for stores. Please try again.");
  }
}

export async function verifyLeadData(lead: EcomStore, profile?: BusinessProfile): Promise<EcomStore> {
  const guard = new VerificationGuardAgent();
  const detective = new PeopleDetectiveAgent();
  const auditor = new TechAuditorAgent();
  const growth = new GrowthSignalAgent();
  const analyst = new BrandAnalystAgent();
  const closer = new DealCloserAgent();

  try {
    // Run agents sequentially to avoid hitting rate limits on search tools
    // Wrap each in try/catch so one failure doesn't kill the whole enrichment
    let guardResult: any = { data: {}, confidence: 0, sources: [] };
    try { guardResult = await guard.process(lead); } catch (e) { console.error("Guard failed:", e); }
    await sleep(500); 

    let detectiveResult: any = { data: {}, confidence: 0, sources: [] };
    try { detectiveResult = await detective.process(lead); } catch (e) { console.error("Detective failed:", e); }
    await sleep(500);

    let auditorResult: any = { data: {}, confidence: 0, sources: [] };
    try { auditorResult = await auditor.process(lead); } catch (e) { console.error("Auditor failed:", e); }
    await sleep(500);

    let growthResult: any = { data: {}, confidence: 0, sources: [] };
    try { growthResult = await growth.process(lead); } catch (e) { console.error("Growth failed:", e); }
    await sleep(500);

    let analystResult: any = { data: {}, confidence: 0, sources: [] };
    try { analystResult = await analyst.process({ lead }); } catch (e) { console.error("Analyst failed:", e); }

    // Merge results from all agents
    let mergedLead: EcomStore = {
      ...lead,
      ...guardResult.data,
      founderInfo: detectiveResult.data.founderInfo || lead.founderInfo,
      adInsights: auditorResult.data.adInsights || lead.adInsights,
      seoInsights: auditorResult.data.seoInsights || lead.seoInsights,
      apps: auditorResult.data.apps || lead.apps,
      appCount: auditorResult.data.appCount || lead.appCount,
      croInsights: growthResult.data.croInsights || lead.croInsights,
      competitors: analystResult.data.competitors || growthResult.data.competitors || lead.competitors,
      growthSignals: growthResult.data.growthSignals || lead.growthSignals,
      marketGaps: analystResult.data.marketGaps,
      positioning: analystResult.data.positioning
    };

    // If profile is provided, run the Deal Closer
    if (profile) {
      await sleep(500);
      const closerResult = await closer.process({ lead: mergedLead, profile });
      mergedLead.closingStrategy = closerResult.data;
    }

    // Refined Lead Scoring Mechanism (Confidence)
    let baseScore = Math.round((guardResult.confidence + detectiveResult.confidence + auditorResult.confidence) / 3);
    
    const hasEmail = !!(mergedLead.contactEmail || mergedLead.founderInfo?.personalEmail || mergedLead.revealedEmail);
    const hasAds = !!(mergedLead.isRunningAds || (mergedLead.adInsights?.primaryAdPlatform && mergedLead.adInsights.primaryAdPlatform !== 'None'));
    const hasFounder = !!(mergedLead.founderInfo?.name && (mergedLead.founderInfo?.linkedin || mergedLead.founderInfo?.twitter));
    const isVerifiable = guardResult.confidence >= 60;
    const hasGrowthSignals = !!(mergedLead.growthSignals?.isHiring || mergedLead.growthSignals?.newProductLaunch || mergedLead.growthSignals?.recentNews);
    const hasTechGaps = !!(mergedLead.seoInsights?.seoGaps?.length || mergedLead.croInsights?.conversionKillers?.length || (mergedLead.appCount && mergedLead.appCount < 5));
    const hasHighTraffic = !!(mergedLead.trafficMetrics?.monthlyVisits && mergedLead.trafficMetrics.monthlyVisits > 50000);
    const hasSocialPresence = !!(mergedLead.socialEngagement?.engagementLevel && mergedLead.socialEngagement.engagementLevel !== 'Low');
    const hasStrongFounder = !!(mergedLead.founderPresence?.linkedinFollowers && mergedLead.founderPresence.linkedinFollowers > 1000);

    // Bonuses for high-quality data points
    if (hasEmail) baseScore += 15;
    if (mergedLead.isEmailRevealed) baseScore += 5;
    if (hasAds) baseScore += 10;
    if (hasFounder) baseScore += 10;
    if (hasHighTraffic) baseScore += 15;
    if (hasSocialPresence) baseScore += 10;
    if (hasStrongFounder) baseScore += 10;
    
    // Penalties for missing or low-quality data
    if (!hasEmail) baseScore -= 10;
    if (!hasFounder) baseScore -= 10;
    if (!isVerifiable) baseScore -= 15;
    if (!hasAds) baseScore -= 5;
    if (!hasHighTraffic && mergedLead.estimatedRevenue?.includes('M')) baseScore -= 10;

    const finalScore = Math.min(Math.max(baseScore, 0), 100);
    mergedLead.confidenceScore = finalScore;

    // --- NEW: Intent Scoring (Ready-to-Buy Index) ---
    let intentScore = 40; // More conservative start
    const intentSignals: string[] = [];

    // Trigger 1: Ad Spend vs SEO Gap (High Intent for SEO/Ads Agencies)
    if (mergedLead.isRunningAds && mergedLead.seoInsights?.seoGaps?.length) {
      intentScore += 15;
      intentSignals.push("Burning budget on ads with SEO gaps (High ROI opportunity)");
    }

    // Trigger 2: High Revenue vs CRO Friction (High Intent for CRO/Dev)
    if (mergedLead.estimatedRevenue?.includes('M') && mergedLead.croInsights?.conversionKillers?.length) {
      intentScore += 20;
      intentSignals.push("High revenue brand with checkout friction (Immediate revenue leak)");
    }

    // Trigger 3: Growth Signals (Budget availability)
    if (mergedLead.growthSignals?.isHiring) {
      intentScore += 10;
      intentSignals.push("Active hiring detected (Expanding budget)");
    }

    // Trigger 4: Tech Under-utilization
    if (mergedLead.appCount && mergedLead.appCount < 8 && mergedLead.estimatedRevenue?.includes('K')) {
      intentScore += 10;
      intentSignals.push("Under-optimized tech stack for revenue level");
    }

    // Trigger 5: Missing Key Marketing Channels
    if (!mergedLead.isRunningAds && mergedLead.estimatedRevenue?.includes('M')) {
      intentScore += 15;
      intentSignals.push("Scaling brand not yet utilizing paid ads");
    }

    // Trigger 6: High Social Engagement but Low Traffic (Ad/SEO opportunity)
    if (hasSocialPresence && !hasHighTraffic) {
      intentScore += 15;
      intentSignals.push("Strong social following but low site traffic (Conversion gap)");
    }

    // Trigger 7: Strong Founder Presence (High trust, easier outreach)
    if (hasStrongFounder) {
      intentScore += 10;
      intentSignals.push("Founder is a thought leader (High authority brand)");
    }

    mergedLead.intentScore = Math.min(intentScore, 100);
    mergedLead.intentSignals = intentSignals;
    mergedLead.strategicFit = intentScore > 80 ? "Perfect Match" : intentScore > 60 ? "Strong Prospect" : "General Lead";

    // If it was already manually verified or verified via external service, keep that status if score is high
    if (lead.verificationStatus === 'Verified' && finalScore > 80) {
      mergedLead.verificationStatus = 'Verified';
    } else {
      mergedLead.verificationStatus = finalScore > 85 ? 'Verified' : finalScore > 60 ? 'Squad-Verified' : 'Partially Verified';
    }

    mergedLead.scoreBreakdown = {
      hasEmail,
      hasAds,
      hasFounder,
      isVerifiable,
      hasGrowthSignals,
      hasTechGaps,
      hasHighTraffic,
      hasSocialPresence,
      hasStrongFounder
    };
    mergedLead.lastVerifiedAt = new Date().toISOString();
    mergedLead.dataSources = [
        ...(guardResult.sources || []),
        ...(detectiveResult.sources || []),
        ...(auditorResult.sources || [])
    ].filter((v, i, a) => a.indexOf(v) === i); // Deduplicate

    return mergedLead;
  } catch (error) {
    console.error("Error verifying lead data with Agent Squad:", error);
    return lead;
  }
}

export async function generateGhostwrittenEmail(lead: EcomStore, profile: BusinessProfile): Promise<string> {
  const ghostwriter = new GhostwriterAgent();
  try {
    const response = await ghostwriter.process({ lead, profile });
    return response.data;
  } catch (error) {
    console.error("Error generating ghostwritten email:", error);
    throw new Error("Failed to generate personalized email draft.");
  }
}

