import cron from 'node-cron';
import { runEOD } from '../services/eodService.js';

const TZ = process.env.TZ || 'UTC';

function getToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

// Runs every day at 11:59 PM in the configured timezone
export const eodJob = cron.schedule('59 23 * * *', async () => {
  const today = getToday();
  console.log(`[Scheduler] Running EOD for ${today} (${TZ})`);
  try {
    await runEOD(today);
  } catch (err) {
    console.error('[Scheduler] EOD job failed:', err.message);
  }
}, { timezone: TZ });
