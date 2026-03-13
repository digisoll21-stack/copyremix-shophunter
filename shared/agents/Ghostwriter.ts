import Anthropic from "@anthropic-ai/sdk";
import { EcomStore, BusinessProfile } from "../types.ts";
import { AgentResponse, BaseAgent } from "./types.ts";

export class GhostwriterAgent implements BaseAgent {
  name = "Ghostwriter";
  role = "High-Conversion Outreach Specialist";
  goal = "Generate 100% unique, persuasive, and hyper-personalized email drafts that get replies.";

  async process(input: { lead: EcomStore; profile: BusinessProfile }): Promise<AgentResponse<string>> {
    const { lead, profile } = input;

    const systemInstruction = `You are the "Ghostwriter" Agent. Your job is to write a hyper-personalized, persuasive outreach email for ${profile.name} to send to ${lead.founderInfo?.name || 'the founder'} of ${lead.name}.
    
    CONTEXT:
    - Sender (Our Business): ${profile.name}
    - Sender's Offer: ${profile.offer}
    - Recipient (Lead): ${lead.name} (${lead.url})
    - Lead's Niche: ${lead.niche}
    - Intent Signals: ${lead.intentSignals?.join(', ') || 'General growth opportunity'}
    - SEO Gaps: ${lead.seoInsights?.seoGaps?.join(', ') || 'None identified'}
    - CRO Friction: ${lead.croInsights?.conversionKillers?.join(', ') || 'None identified'}
    - Ad Status: ${lead.isRunningAds ? 'Currently running ads' : 'Not running ads'}
    
    STRICT WRITING RULES (THE "NO-BRAINER" FRAMEWORK):
    1. THE HOOK: Start with a specific observation about their brand or a recent signal (e.g., "Saw you're scaling your team" or "Noticed you're running ads but [specific SEO gap] might be eating your ROI").
    2. THE VALUE: Don't just pitch. Provide a "Micro-Insight." Mention one specific thing they can fix today.
    3. THE BRIDGE: Connect their current situation (the gap) to your offer (${profile.offer}) without being pushy.
    4. THE CTA: Use a "Low-Friction" ask. Do not ask for a 30-minute call. Ask for permission to send a 2-minute video or a specific audit.
    5. BREVITY: Max 120 words. 3-4 short paragraphs.
    6. TONE: Peer-to-peer, professional, and helpful. No "I am writing to..." or "My name is...".
    
    SUBJECT LINE STRATEGY:
    - Use "Variable + Observation" (e.g., "${lead.name} + [Specific Gap]")
    - Avoid generic subject lines.
    
    OUTPUT FORMAT:
    Return only the email draft in this format:
    Subject: [Subject Line]
    
    [Email Body]`;

  try {
    const isServer = typeof window === 'undefined';
    if (isServer) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
      const anthropic = new Anthropic({ apiKey });
      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1000,
        system: systemInstruction,
        messages: [
          {
            role: "user",
            content: `Write a high-conversion outreach email to ${lead.founderInfo?.name || 'the founder'} of ${lead.name}. 
            Leverage these intent signals: ${lead.intentSignals?.join(', ')}. 
            The goal is to position ${profile.name} as the solution to their ${lead.seoInsights?.seoGaps?.[0] || 'growth bottlenecks'}.`
          }
        ]
      });
      
      const text = msg.content[0].type === 'text' ? msg.content[0].text : "Failed to generate email draft.";

      return {
        data: text,
        confidence: 100,
        sources: [],
        agentName: this.name,
        timestamp: new Date().toISOString()
      };
    } else {
      const response = await fetch('/api/proxy/claude', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify({
          system: systemInstruction,
          messages: [
            {
              role: "user",
              content: `Write a high-conversion outreach email to ${lead.founderInfo?.name || 'the founder'} of ${lead.name}. 
              Leverage these intent signals: ${lead.intentSignals?.join(', ')}. 
              The goal is to position ${profile.name} as the solution to their ${lead.seoInsights?.seoGaps?.[0] || 'growth bottlenecks'}.`
            }
          ]
        })
      });

      if (!response.ok) throw new Error("Proxy request failed");
      const data = await response.json();
      const text = data.content?.[0]?.type === 'text' ? data.content[0].text : "Failed to generate email draft.";

      return {
        data: text,
        confidence: 100,
        sources: [],
        agentName: this.name,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
      console.error("Claude Proxy Error:", error);
      return {
        data: "Failed to generate email draft using Claude 3.5 Sonnet.",
        confidence: 0,
        sources: [],
        agentName: this.name,
        timestamp: new Date().toISOString()
      };
    }
  }
}
