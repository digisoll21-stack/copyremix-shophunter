import { getSupabase } from '../../shared/services/supabase.ts';
import { BrandScoutAgent } from '../../shared/agents/BrandScout.ts';
import { Intent, BusinessProfile } from '../../shared/types.ts';

export async function runDailyHunt() {
  const supabase = getSupabase();
  if (!supabase) {
    console.error('Worker: Supabase not configured. Skipping hunt.');
    return;
  }

  try {
    // 1. Fetch all business profiles
    const { data: profiles, error: profileError } = await supabase
      .from('business_profiles')
      .select('*');

    if (profileError) throw profileError;
    if (!profiles || profiles.length === 0) {
      console.log('Worker: No business profiles found.');
      return;
    }

    const scout = new BrandScoutAgent();

    for (const profileRow of profiles) {
      const profile: BusinessProfile = JSON.parse(profileRow.data);
      const userId = profileRow.user_id;

      console.log(`Worker: Processing profile "${profile.name}" for user ${userId}`);

      const intents: Intent[] = profile.intents || [];

      for (const intent of intents) {
        console.log(`Worker: Hunting for intent "${intent.title}"...`);
        
        try {
          const response = await scout.process({ 
            query: intent.searchQuery,
            mission: intent 
          });

          if (response.data && response.data.length > 0) {
            console.log(`Worker: Found ${response.data.length} leads for intent "${intent.title}"`);

            const leadsToUpsert = response.data.map(lead => ({
              url: lead.url,
              name: lead.name,
              status: 'New',
              user_id: userId,
              data: JSON.stringify({
                ...lead,
                intentSignals: [intent.title],
                strategicFit: lead.strategicFit || `Matched via mission: ${intent.title}`
              })
            }));

            const { error: upsertError } = await supabase
              .from('leads')
              .upsert(leadsToUpsert, { onConflict: 'url,user_id' });

            if (upsertError) {
              console.error(`Worker: Failed to save leads for user ${userId}:`, upsertError);
            }
          }
        } catch (intentErr) {
          console.error(`Worker: Error hunting for intent "${intent.title}":`, intentErr);
        }
      }
    }
    console.log('Worker: Daily hunt job completed.');
  } catch (err) {
    console.error('Worker: Fatal error during daily hunt:', err);
  }
}
