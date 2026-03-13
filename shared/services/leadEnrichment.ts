import { EcomStore } from "../types.ts";
import { findContactInApollo } from "./apollo.ts";
import { findEmailInHunter } from "./hunter.ts";

/**
 * Service to enrich leads with verified email data from Apollo or Hunter.io
 */
export async function revealVerifiedEmail(lead: EcomStore): Promise<{ email: string; source: string }> {
  const domain = new URL(lead.url).hostname.replace('www.', '');
  const founderName = lead.founderInfo?.name;

  // 1. Try Apollo.io first (Best for direct contacts)
  const apolloContact = await findContactInApollo(domain, founderName);
  if (apolloContact && apolloContact.email) {
    return {
      email: apolloContact.email,
      source: 'Apollo.io (Verified)'
    };
  }

  // 2. Try Hunter.io as fallback
  const firstName = founderName?.split(' ')[0];
  const lastName = founderName?.split(' ').slice(1).join(' ');
  const hunterContact = await findEmailInHunter(domain, firstName, lastName);
  
  if (hunterContact && hunterContact.email) {
    return {
      email: hunterContact.email,
      source: `Hunter.io (${hunterContact.confidence}% Confidence)`
    };
  }

  // 3. Last resort: Fallback to logic-based guess if no API keys or no results
  const firstNameLower = firstName?.toLowerCase() || 'contact';
  const lastNameLower = lastName?.toLowerCase() || '';
  
  const mockEmail = lastNameLower 
    ? `${firstNameLower}.${lastNameLower}@${domain}` 
    : `${firstNameLower}@${domain}`;

  return {
    email: mockEmail,
    source: 'AI Intelligence (Estimated)'
  };
}
