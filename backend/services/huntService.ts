import { findEcomBrands } from "../../shared/services/gemini.ts";
import { emitToUser } from "./socketService.ts";
import { EcomStore, SearchFilters, Intent, ProgressUpdate } from "../../shared/types.ts";
import { prisma } from "../lib/prisma.ts";

export async function startHuntJob(userId: string, query: string, filters?: SearchFilters, mission?: Intent) {
  // Create job in Prisma
  const job = await prisma.discoveryJob.create({
    data: {
      userId,
      query,
      status: 'PENDING',
      progress: 0
    }
  });
  
  // Start the background process
  processHunt(job.id).catch(err => {
    console.error(`Job ${job.id} failed:`, err);
  });

  return job.id;
}

async function processHunt(jobId: string) {
  const job = await prisma.discoveryJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  await prisma.discoveryJob.update({
    where: { id: jobId },
    data: { status: 'RUNNING' }
  });
  
  emitToUser(job.userId, "job:status", { jobId, status: 'running', progress: 'Initializing...' });

  try {
    const results = await findEcomBrands(
      job.query,
      undefined, // filters
      async (update) => {
        await prisma.discoveryJob.update({
          where: { id: jobId },
          data: { progress: update.percentage }
        });
        emitToUser(job.userId, "job:progress", { jobId, progress: update.details || update.step, detail: update });
      },
      undefined, // mission
      false, // forceFresh
      async (lead) => {
        emitToUser(job.userId, "lead:found", { jobId, lead });
        
        // Save to Prisma incrementally
        await prisma.lead.upsert({
          where: {
            url_userId: {
              url: lead.url,
              userId: job.userId
            }
          },
          update: {
            name: lead.name,
            data: lead as any,
            jobId: jobId
          },
          create: {
            url: lead.url,
            name: lead.name,
            userId: job.userId,
            jobId: jobId,
            data: lead as any
          }
        });
      }
    );

    await prisma.discoveryJob.update({
      where: { id: jobId },
      data: { 
        status: 'COMPLETED',
        progress: 100,
        resultCount: results.length
      }
    });

    emitToUser(job.userId, "job:status", { 
      jobId, 
      status: 'completed', 
      progress: 'Completed', 
      count: results.length,
      detail: { step: "Complete", percentage: 100, details: "Hunt finished." }
    });
    
  } catch (err: any) {
    await prisma.discoveryJob.update({
      where: { id: jobId },
      data: { status: 'FAILED' }
    });

    emitToUser(job.userId, "job:status", { 
      jobId, 
      status: 'failed', 
      progress: `Error: ${err.message}`,
      detail: { step: "Failed", percentage: 0, details: err.message }
    });
  }
}
