import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
import {createECDH,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{build}=require(require.resolve('esbuild',{paths:[require.resolve('wrangler')]}));
mkdirSync('.runtime-tests',{recursive:true});
const runtime=`export const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_SECRET_KEY:'test-secret',SUPABASE_PUBLISHABLE_KEY:'test-public'};export async function cookies(){return {get:()=>({value:'session'})}};`;
await build({stdin:{contents:`export * as cleaning from './app/api/cleaning/route';export * as pushApi from './app/api/push/route';export * from './lib/push';export * from './lib/cleaning';export * from './lib/model';`,resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',outfile:'.runtime-tests/cleaning-push.cjs',plugins:[{name:'runtime',setup(b){b.onResolve({filter:/^(cloudflare:workers|next\/headers)$/},()=>({path:'runtime',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:runtime,loader:'js'}));}}]});
const app=require('../.runtime-tests/cleaning-push.cjs');
const admin={email:'owner@test.pt',name:'Ana',role:'admin'},employee={email:'cleaner@test.pt',name:'Maria',role:'employee',allowed_areas:['Lavandaria','Arroios de Paixão — Quarto'],active:true};let person=admin,providerStatus=201,requests=0,rpcTasks,authed=true;
const stay={id:'stay-test',kind:'stay',version:1,created_by:admin.email,updated_at:new Date().toISOString(),data:app.recordSchema.parse({title:'Guest private name',area:app.ARROIOS,due:'2026-10-20',checkout:'2026-10-22',contact:'private@example.test'})};
const db={members:[admin,employee],records:[stay],push_config:[],push_subscriptions:[],push_deliveries:[],family_events:[]};
const json=(x,status=200)=>Response.json(x,{status});
globalThis.fetch=async(url,opt={})=>{
 const u=new URL(url);if(u.hostname==='web.push.apple.com'){requests++;assert.equal(opt.redirect,'manual');assert(new Headers(opt.headers).get('authorization').startsWith('vapid '));assert(!Buffer.from(opt.body).toString().includes('Casa em Dia'));return new Response('',{status:providerStatus});}
 if(u.pathname==='/auth/v1/user')return authed?json({...person,email_confirmed_at:'2026-10-01'}):json({},401);
 if(u.pathname==='/auth/v1/token')return json({},401);
 assert.equal(opt.headers.apikey,'test-secret');const name=u.pathname.split('/').pop(),p=opt.body?JSON.parse(opt.body):null;
 if(name==='ced_plan_cleaning'){rpcTasks=p.p_tasks;return json({ids:rpcTasks.map((_,n)=>'task-'+n)});}
 if(name==='ced_push_config'){if(!db.push_config.length)db.push_config.push({id:true,public_key:p.p_public,private_key:p.p_private});return json(db.push_config[0]);}
 if(name==='ced_claim_push'){if(db.push_deliveries.some(d=>d.subscription_id===p.p_id&&d.event_key===p.p_event))return json(false);db.push_deliveries.push({subscription_id:p.p_id,event_key:p.p_event,status:'sending'});return json(true);}
 assert(name in db,name);let rows=db[name];for(const [k,v] of u.searchParams)if(v.startsWith('eq.'))rows=rows.filter(r=>String(r[k])===v.slice(3));
 if(opt.method==='PATCH'){rows.forEach(r=>Object.assign(r,p));return json(rows);}
 if(opt.method==='DELETE')return json([]);
 if(opt.method==='POST'){const match=db[name].find(r=>r.id===p.id);if(match)Object.assign(match,p);else db[name].push(p);return json([p]);}
 const offset=Number(u.searchParams.get('offset')||0),limit=Number(u.searchParams.get('limit')||1000);return json(rows.slice(offset,offset+limit));
};
const request=(p,method='POST',origin='https://app.test')=>new Request('https://app.test/api/test',{method,headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(p)});
const payload={stayId:stay.id,version:1,assignee:employee.name,due:'2026-10-20',time:'14:00'};
assert.equal((await app.cleaning.POST(request(payload))).status,200);assert.equal(rpcTasks.length,3);assert(rpcTasks.every(t=>t.stayId===stay.id&&t.assignee===employee.name&&t.repeat==='Não repetir'));assert(!JSON.stringify(rpcTasks).includes(stay.data.contact));assert(!JSON.stringify(rpcTasks).includes(stay.data.title));
assert.equal((await app.cleaning.POST(request({...payload,due:'2026-10-21'}))).status,400);assert.equal((await app.cleaning.POST(request({...payload,assignee:'Unknown'}))).status,400);person=employee;assert.equal((await app.cleaning.POST(request(payload))).status,403);person=admin;
assert.equal((await app.cleaning.POST(request(payload,'POST','https://evil.test'))).status,403);
for(const area of [app.ARROIOS,app.DUPLEX,app.ALFAMA]){const tasks=app.cleaningDrafts({...stay,data:{...stay.data,area}},employee.name,stay.data.due,'');assert.equal(tasks.length,area===app.ARROIOS?3:5);tasks.forEach(t=>app.recordSchema.parse(t));}
assert(app.allowedEndpoint('https://web.push.apple.com/abc'));for(const value of ['http://web.push.apple.com/x','https://localhost/x','https://169.254.169.254/x','https://web.push.apple.com.evil.test/x','https://web.push.apple.com:8443/x','https://u:p@web.push.apple.com/x'])assert(!app.allowedEndpoint(value));
const ecdh=createECDH('prime256v1');ecdh.generateKeys();const subscription={endpoint:'https://web.push.apple.com/test-only-mocked',keys:{p256dh:ecdh.getPublicKey().toString('base64url'),auth:randomBytes(16).toString('base64url')}};
assert.equal((await app.pushApi.POST(request({subscription:{...subscription,endpoint:'https://localhost/secret'}}))).status,400);
const config=await (await app.pushApi.GET()).json();assert(config.publicKey);assert(!JSON.stringify(config).includes(db.push_config[0].private_key));
const saved=await (await app.pushApi.POST(request({subscription}))).json();assert(saved.id);const test={action:'test',id:saved.id};person=employee;assert.equal((await app.pushApi.POST(request(test))).status,404);person=admin;
assert.equal((await app.pushApi.POST(request(test))).status,200);assert.equal(requests,1);assert.equal((await app.pushApi.POST(request(test))).status,429);assert.equal(requests,1);
for(const iso of ['2026-01-07T08:00:00Z','2026-07-07T07:00:00Z','2026-10-25T08:00:00Z'])assert(app.isSummaryHour(new Date(iso)),iso);assert(!app.isSummaryHour(new Date('2026-07-07T08:00:00Z')));
const task=(id,data)=>({id,kind:'task',data:app.recordSchema.parse({title:'Task test',area:'Lavandaria',assignee:employee.name,...data}),created_by:admin.email,version:1,updated_at:''});
const cases=[task('today',{due:'2026-10-20',snoozeUntil:'2026-11-01'}),task('past',{due:'2026-10-19',snoozeUntil:'2026-11-01'}),task('done',{due:'2026-10-20',status:'Concluído'}),task('approval',{status:'Por aprovar'}),task('waiting',{status:'À espera',reviewOn:'2026-10-20'}),task('other',{due:'2026-10-20',assignee:'Ana'})];
assert.equal(app.reminderCount(cases,employee,'2026-10-20'),3);assert.equal(app.reminderCount(cases,admin,'2026-10-20'),4);
db.records.push(...cases);assert.equal((await app.scheduledSummary(new Date('2026-10-20T07:15:00Z'))).sent,1);assert.equal((await app.scheduledSummary(new Date('2026-10-20T07:30:00Z'))).sent,0);assert.equal(requests,2);
// Timed family reminders are sent only to the named parent, once per occurrence.
const otherParent={email:'other@test.pt',name:'Afonso',role:'admin',active:true};db.members.push(otherParent);admin.active=true;
db.family_events.push({id:'lesson',version:1,data:{title:'Private lesson',child:'Private child',category:'Explicações',date:'2026-10-20',time:'10:00',endTime:'11:00',responsible:'Ana',pickupBy:'Afonso',travelMinutes:15,pickupTravelMinutes:15,bufferMinutes:5,remindMinutes:15,repeat:'once',weekdays:[],until:'',excludedDates:[],cancelled:false}});
const beforeFamily=requests;assert.equal((await app.scheduledFamily(new Date('2026-10-20T08:25:00Z'))).sent,1);assert.equal(requests,beforeFamily+1);assert.equal((await app.scheduledFamily(new Date('2026-10-20T08:30:00Z'))).sent,0);assert.equal((await app.scheduledFamily(new Date('2026-10-20T09:25:00Z'))).sent,0);admin.active=false;db.family_events[0].data.time='12:00';assert.equal((await app.scheduledFamily(new Date('2026-10-20T10:25:00Z'))).sent,0);admin.active=true;
providerStatus=410;assert.equal(await app.deliverPush(db.push_subscriptions[0],'test-expired','Test'), 'failed');assert.equal(db.push_subscriptions[0].enabled,false);
authed=false;assert.equal((await app.pushApi.GET()).status,401);
console.log('PASS: cleaning permissions and private drafts; encrypted push, endpoint restrictions, user-scoped subscription/test, duplicate suppression, expiration, Lisbon DST and snooze/visibility. Provider transport simulated.');
