import { findEcomBrands } from "../../shared/services/gemini.ts";
import { emitToUser } from "./socketService.ts";
import { EcomStore, SearchFilters, Intent, ProgressUpdate } from "../../shared/types.ts";
import { getSupabase } from "../../shared/services/supabase.ts";

interface HuntJob {
  id: string;
  userId: string;
  query: string;
  filters?: SearchFilters;
  mission?: Intent;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: EcomStore[];
  progress: string;
  progressDetail?: ProgressUpdate;
  createdAt: string;
}

const activeJobs = new Map<string, HuntJob>();

export async function startHuntJob(userId: string, query: string, filters?: SearchFilters, mission?: Intent) {
  const jobId = Math.random().toString(36).substring(7);
  
  const job: HuntJob = {
    id: jobId,
    userId,
    query,
    filters,
    mission,
    status: 'pending',
    results: [],
    progress: 'Initializing...',
    createdAt: new Date().toISOString()
  };

  activeJobs.set(jobId, job);
  
  // Start the background process
  processHunt(jobId).catch(err => {
    console.error(`Job ${jobId} failed:`, err);
  });

  return jobId;
}

async function processHunt(jobId: string) {
  const job = activeJobs.get(jobId);
  if (!job) return;

  job.status = 'running';
  emitToUser(job.userId, "job:status", { jobId, status: job.status, progress: job.progress });

  try {
    const results = await findEcomBrands(
      job.query,
      job.filters,
      (update) => {
        job.progress = update.details || update.step;
        job.progressDetail = update;
        emitToUser(job.userId, "job:progress", { jobId, progress: job.progress, detail: update });
      },
      job.mission,
      false, // forceFresh
      (lead) => {
        job.results.push(lead);
        emitToUser(job.userId, "lead:found", { jobId, lead });
        
        // Also save to Supabase incrementally
        saveLeadToDb(job.userId, lead).catch(err => console.error("Failed to save lead to DB:", err));
      }
    );

    job.status = 'completed';
    job.progress = 'Completed';
    job.progressDetail = { step: "Complete", percentage: 100, details: "Hunt finished." };
    emitToUser(job.userId, "job:status", { 
      jobId, 
      status: job.status, 
      progress: job.progress, 
      count: job.results.length,
      detail: job.progressDetail
    });
    
  } catch (err: any) {
    job.status = 'failed';
    job.progress = `Error: ${err.message}`;
    job.progressDetail = { step: "Failed", percentage: 0, details: err.message };
    emitToUser(job.userId, "job:status", { 
      jobId, 
      status: job.status, 
      progress: job.progress,
      detail: job.progressDetail
    });
  }
}

async function saveLeadToDb(userId: string, lead: EcomStore) {
  const supabase = getSupabase();
  if (!supabase) return;

  const leadToUpsert = {
    url: lead.url,
    name: lead.name,
    status: 'New',
    notes: '',
    user_id: userId,
    data: JSON.stringify(lead)
  };

  await supabase
    .from('leads')
    .upsert(leadToUpsert, { onConflict: 'url,user_id' });
}

export function getJob(jobId: string) {
  return activeJobs.get(jobId);
}

export function getUserJobs(userId: string) {
  return Array.from(activeJobs.values()).filter(j => j.userId === userId);
}
