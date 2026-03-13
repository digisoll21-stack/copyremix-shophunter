/**
 * Apollo.io API Service
 * Used for finding and verifying direct contact information for decision makers.
 */

export interface ApolloContact {
  email: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  linkedin_url?: string;
  phone_number?: string;
}

export async function findContactInApollo(domain: string, personName?: string): Promise<ApolloContact | null> {
  const isServer = typeof window === 'undefined';
  const apiKey = isServer ? process.env.APOLLO_API_KEY : null;

  try {
    if (isServer) {
      if (!apiKey) {
        console.warn("APOLLO_API_KEY missing on server.");
        return null;
      }
      const response = await fetch('https://api.apollo.io/v1/people/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, domain, q_keywords: personName })
      });
      const data = await response.json();
      if (data.people?.[0]) {
        const person = data.people[0];
        return {
          email: person.email,
          first_name: person.first_name,
          last_name: person.last_name,
          title: person.title,
          linkedin_url: person.linkedin_url,
          phone_number: person.phone_numbers?.[0]?.sanitized_number
        };
      }
      return null;
    } else {
      const response = await fetch(((import.meta as any).env?.VITE_API_URL || '') + '/api/proxy/apollo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify({ domain, personName })
      });
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch contact:", error);
    return null;
  }
}
