import { createClient } from "@supabase/supabase-js";

let supabaseClient: any = null;

export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const isBackend = typeof window === 'undefined';
  
  // In the frontend, we might need to use import.meta.env if process.env isn't polyfilled
  // But for now, we'll stick to the existing logic minus the dotenv call which crashes the browser
  const supabaseUrl = process.env.SUPABASE_URL || (isBackend ? "" : ((import.meta as any).env?.VITE_SUPABASE_URL || ""));
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || (isBackend ? "" : ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ""));

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing. Database operations will fail.");
    return null;
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}
