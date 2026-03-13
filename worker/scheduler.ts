import cron from 'node-cron';
import { runDailyHunt } from './tasks/dailyHunt.ts';

export function startWorker() {
  console.log('Worker initialized. Scheduling daily hunts...');
  
  // Schedule a task to run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily hunt job...');
    await runDailyHunt();
  });
}
