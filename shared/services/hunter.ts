/**
 * Hunter.io API Service
 * Used for domain search and email verification.
 */

export interface HunterResult {
  email: string;
  confidence: number;
  first_name?: string;
  last_name?: string;
}

export async function findEmailInHunter(domain: string, firstName?: string, lastName?: string): Promise<HunterResult | null> {
  const isServer = typeof window === 'undefined';
  const apiKey = isServer ? process.env.HUNTER_API_KEY : null;

  try {
    if (isServer) {
      if (!apiKey) {
        console.warn("HUNTER_API_KEY missing on server.");
        return null;
      }
      const response = await fetch(`https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${apiKey}`);
      const data = await response.json();
      if (data.data?.email) {
        return { email: data.data.email, confidence: data.data.score };
      }
      return null;
    } else {
      const response = await fetch(((import.meta as any).env?.VITE_API_URL || '') + '/api/proxy/hunter', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify({ domain, firstName, lastName })
      });
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch email:", error);
    return null;
  }
}
