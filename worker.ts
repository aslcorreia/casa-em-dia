import app from 'vinext/server/app-router-entry';
import {scheduledSummary,scheduledFamily} from './lib/push';
export default {
 fetch:app.fetch,
 async scheduled(controller:ScheduledController){const now=new Date(controller.scheduledTime);const results=await Promise.allSettled([scheduledSummary(now),scheduledFamily(now)]);if(results.some(r=>r.status==='rejected'))throw new Error('Some reminders failed');},
};
