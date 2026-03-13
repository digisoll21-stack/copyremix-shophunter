/**
 * Wappalyzer API Service
 * Cost-effective technology detection for identifying e-commerce stacks.
 */

export interface WappalyzerTech {
  name: string;
  slug: string;
  categories: { id: number; slug: string; name: string }[];
}

export interface WappalyzerResponse {
  technologies: WappalyzerTech[];
}

export async function getTechStack(url: string): Promise<WappalyzerTech[]> {
  const isServer = typeof window === 'undefined';
  const apiKey = isServer ? process.env.WAPPALYZER_API_KEY : null;

  try {
    if (isServer) {
      if (!apiKey) {
        console.warn("WAPPALYZER_API_KEY missing on server.");
        return [];
      }
      const response = await fetch(`https://api.wappalyzer.com/v2/lookup/?urls=${encodeURIComponent(url)}`, {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      return Array.isArray(data) && data.length > 0 ? data[0].technologies || [] : [];
    } else {
      const response = await fetch(((import.meta as any).env?.VITE_API_URL || '') + '/api/proxy/wappalyzer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify({ url })
      });
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch tech stack:", error);
    return [];
  }
}
