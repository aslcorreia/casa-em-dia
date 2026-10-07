import webpush from 'web-push';
import {z} from 'zod';
import {rest} from './backend';
import {Item,maySee,notices,recordSchema,Member} from './model';
import {FamilyEvent,dueFamilyReminders,departureClock} from './family';

export function allowedEndpoint(value:string){
 try{const u=new URL(value),h=u.hostname;return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&
  (h==='fcm.googleapis.com'||h==='updates.push.services.mozilla.com'||h.endsWith('.push.services.mozilla.com')||h==='web.push.apple.com'||h.endsWith('.push.apple.com')||h.endsWith('.notify.windows.com'));}catch{return false;}
}
export const subscriptionSchema=z.object({endpoint:z.string().max(3000).refine(allowedEndpoint),expirationTime:z.number().nullable().optional(),keys:z.object({p256dh:z.string().regex(/^[A-Za-z0-9_-]{87}$/),auth:z.string().regex(/^[A-Za-z0-9_-]{22}$/)})});
export type Subscription=z.infer<typeof subscriptionSchema>;
export async function subscriptionId(endpoint:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(endpoint)))).map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function pushConfig(){
 const rows=await rest('push_config','GET','?id=eq.true');if(rows[0])return rows[0] as {public_key:string;private_key:string};
 const keys=webpush.generateVAPIDKeys();return await rest('rpc/ced_push_config','POST','',{p_public:keys.publicKey,p_private:keys.privateKey}) as unknown as {public_key:string;private_key:string};
}
export function lisbonDate(now:Date){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function isSummaryHour(now:Date){return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Lisbon',hour:'2-digit',hourCycle:'h23'}).format(now)==='08';}
export function reminderCount(items:Item[],person:Member,today:string){return new Set(notices(items.filter(i=>maySee(i,person)),today).map(n=>n.id)).size;}
export async function deliverPush(row:{id:string;subscription:Subscription},eventKey:string,body:string,options:{url?:string;ttl?:number;tag?:string}={}){
 const claimed=await rest('rpc/ced_claim_push','POST','',{p_id:row.id,p_event:eventKey}) as unknown as boolean;
 if(!claimed)return 'already';
 const query='?subscription_id=eq.'+encodeURIComponent(row.id)+'&event_key=eq.'+encodeURIComponent(eventKey);
 try{
  const sub=subscriptionSchema.parse(row.subscription),keys=await pushConfig();
  const req=webpush.generateRequestDetails(sub,JSON.stringify({title:'Casa em Dia',body,tag:options.tag||(eventKey.startsWith('test-')?'ced-test':'ced-daily'),url:options.url||'/?view=notifications'}),{
   TTL:options.ttl??3600,urgency:options.ttl?'high':'normal',vapidDetails:{subject:'https://casa-em-dia.as-lcorreia.workers.dev',publicKey:keys.public_key,privateKey:keys.private_key}});
  const headers=new Headers(req.headers as Record<string,string>);headers.delete('Content-Length');
  const sent=await fetch(req.endpoint,{method:'POST',headers,body:req.body as BodyInit,redirect:'manual',signal:AbortSignal.timeout(12000)});
  if(sent.status===404||sent.status===410)await rest('push_subscriptions','PATCH','?id=eq.'+row.id,{enabled:false,updated_at:new Date().toISOString()});
  if(!sent.ok)throw new Error('Push provider unavailable');
  await rest('push_deliveries','PATCH',query,{status:'sent',sent_at:new Date().toISOString()});return 'sent';
 }catch{
  await rest('push_deliveries','PATCH',query,{status:'failed'});return 'failed';
 }
}
export async function scheduledSummary(now=new Date()){
 if(!isSummaryHour(now))return {sent:0,skipped:true};
 const today=lisbonDate(now),subscriptions=await rest('push_subscriptions','GET','?enabled=eq.true');
 if(!subscriptions.length)return {sent:0};
 const members=await rest('members');const items:Item[]=[];
 for(let offset=0;;offset+=500){const page=await rest('records','GET','?order=id&limit=500&offset='+offset);for(const row of page)items.push({...row,data:recordSchema.parse(row.data)});if(page.length<500)break;}
 let sent=0,failed=0;
 for(const sub of subscriptions){const m=members.find(m=>m.email===sub.member_email);if(!m||m.active===false)continue;
  const count=reminderCount(items,m,today);if(!count)continue;
  const result=await deliverPush(sub,'daily-'+today,count===1?'Tens um assunto a rever hoje. Abre a app para ver o próximo passo.':'Tens '+count+' assuntos a rever hoje. Abre a app para escolher o próximo passo.');
  if(result==='sent')sent++;if(result==='failed')failed++;
 }
 await rest('push_deliveries','DELETE','?attempted_at=lt.'+encodeURIComponent(new Date(now.getTime()-30*86400000).toISOString()));
 if(failed)throw new Error('Some push notifications failed; the next scheduled run will retry.');
 return {sent};
}

export async function scheduledFamily(now=new Date()){
 const subscriptions=await rest('push_subscriptions','GET','?enabled=eq.true');if(!subscriptions.length)return {sent:0};
 const members=await rest('members','GET','?role=eq.admin&active=eq.true');
 const events:FamilyEvent[]=[];for(let offset=0;;offset+=200){const page=await rest('family_events','GET','?order=id&limit=200&offset='+offset);events.push(...page as FamilyEvent[]);if(page.length<200)break;}
 let sent=0,failed=0;for(const leg of dueFamilyReminders(events,now)){
  const person=members.find(m=>m.role==='admin'&&m.active!==false&&m.name===leg.person);if(!person)continue;
  for(const sub of subscriptions.filter(s=>s.member_email===person.email)){
   const result=await deliverPush(sub,'family-'+leg.key,'Agenda familiar: sair às '+departureClock(leg.departure)+'. Abre a app para ver o compromisso.',{url:'/?view=family',tag:'family-'+leg.key,ttl:300});if(result==='sent')sent++;if(result==='failed')failed++;
  }
 }
 if(failed)throw new Error('Family reminders will retry while still useful.');return {sent};
}
