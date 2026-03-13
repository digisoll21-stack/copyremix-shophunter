/**
 * Serper.dev API Service
 * High-speed Google Search API for AI agents.
 */

export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export interface SerperResponse {
  searchParameters: any;
  organic: SerperResult[];
  peopleAlsoAsk?: any[];
  relatedSearches?: any[];
}

export async function searchGoogle(query: string, limit: number = 10): Promise<SerperResult[]> {
  // If we are on the server (Node.js), we can use the API key directly if available
  // In the browser, we must use the proxy
  const isServer = typeof window === 'undefined';
  const apiKey = isServer ? process.env.SERPER_API_KEY : null;

  try {
    if (isServer) {
      if (!apiKey) {
        console.warn("SERPER_API_KEY missing on server. Search will likely fail.");
        return [];
      }
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q: query, num: limit })
      });
      const data = await response.json();
      return data.organic || [];
    } else {
      const response = await fetch(((import.meta as any).env?.VITE_API_URL || '') + '/api/proxy/serper', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify({ q: query, num: limit })
      });
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch search results:", error);
    return [];
  }
}

/**
 * Specialized search for finding e-commerce brands
 */
export async function findBrands(niche: string, location?: string): Promise<SerperResult[]> {
  const query = `best e-commerce brands in ${niche} ${location ? `in ${location}` : ''} -amazon -ebay -walmart -etsy`;
  return searchGoogle(query, 15);
}

/**
 * Specialized search for finding contact info
 */
export async function findContactPages(domain: string): Promise<SerperResult[]> {
  const query = `site:${domain} contact OR "about us" OR "team" OR linkedin`;
  return searchGoogle(query, 5);
}
