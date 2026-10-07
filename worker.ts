import app from 'vinext/server/app-router-entry';
import {scheduledSummary} from './lib/push';
export default {
 fetch:app.fetch,
 async scheduled(controller:ScheduledController){await scheduledSummary(new Date(controller.scheduledTime));},
};
