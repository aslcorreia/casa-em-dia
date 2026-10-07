import {z} from 'zod';
export const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const date=z.string().refine(validDate,'Data inválida');
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const familySchema=z.object({title:z.string().trim().min(2).max(120),child:z.string().trim().min(1).max(80),category:z.enum(['Escola','Explicações','Atividade','Outro']),location:z.string().trim().max(180).default(''),date,time,endTime:z.union([z.literal(''),time]).default(''),responsible:z.string().min(2).max(150),travelMinutes:z.number().int().min(0).max(240).default(15),bufferMinutes:z.number().int().min(0).max(60).default(5),remindMinutes:z.number().int().min(5).max(120).default(15),repeat:z.enum(['once','weekly']).default('once'),weekdays:z.array(z.number().int().min(0).max(6)).max(7).default([]),until:z.union([z.literal(''),date]).default(''),excludedDates:z.array(date).max(120).default([]),pickupBy:z.string().max(150).default(''),pickupTravelMinutes:z.number().int().min(0).max(240).default(15),notes:z.string().max(2000).default(''),cancelled:z.boolean().default(false)}).superRefine((d,ctx)=>{if(d.repeat==='weekly'&&(!d.until||d.until<d.date||!d.weekdays.length))ctx.addIssue({code:'custom',message:'Escolhe os dias da semana e a data de fim do horário.'});if(d.endTime&&d.endTime<=d.time)ctx.addIssue({code:'custom',message:'A hora de fim tem de ser depois do início.'});if(d.pickupBy&&!d.endTime)ctx.addIssue({code:'custom',message:'Indica a hora para ir buscar.'});});
export type FamilyData=z.infer<typeof familySchema>;
export type FamilyEvent={id:string;data:FamilyData;version:number};
export function addDays(day:string,n:number){return new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);}
export function lisbonDay(now:Date){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
// Convert a Lisbon wall-clock time using its actual seasonal UTC offset. Reject DST gaps.
export function lisbonInstant(day:string,clock:string){
 const target=Date.parse(day+'T'+clock+':00Z');let stamp=target;
 for(let i=0;i<3;i++){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(stamp));const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));const wall=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);const delta=target-wall;if(!delta)return stamp;stamp+=delta;}
 return null;
}
export function occursOn(event:FamilyEvent,day:string){const d=event.data;if(d.cancelled||d.excludedDates.includes(day)||day<d.date)return false;return d.repeat==='once'?day===d.date:day<=d.until&&d.weekdays.includes(new Date(day+'T12:00:00Z').getUTCDay());}
export function familyLegs(event:FamilyEvent,day:string){
 if(!occursOn(event,day))return [];const d=event.data;
 return [{kind:'levar',clock:d.time,person:d.responsible,travel:d.travelMinutes},...(d.pickupBy&&d.endTime?[{kind:'buscar',clock:d.endTime,person:d.pickupBy,travel:d.pickupTravelMinutes}]:[])].flatMap(leg=>{const starts=lisbonInstant(day,leg.clock);if(starts===null)return [];const departure=starts-(leg.travel+d.bufferMinutes)*60000;return [{...leg,event,day,starts,departure,reminder:departure-d.remindMinutes*60000,key:event.id+'-'+day+'-'+leg.kind+'-'+departure}];});
}
export function agendaOccurrences(events:FamilyEvent[],start:string,days=7){const rows=[];for(let n=0;n<days;n++){const day=addDays(start,n);for(const event of events)if(occursOn(event,day))rows.push({event,day,legs:familyLegs(event,day)});}return rows.sort((a,b)=>a.day.localeCompare(b.day)||a.event.data.time.localeCompare(b.event.data.time));}
export const departureClock=(stamp:number)=>new Intl.DateTimeFormat('pt-PT',{timeZone:'Europe/Lisbon',hour:'2-digit',minute:'2-digit'}).format(new Date(stamp));
export function dueFamilyReminders(events:FamilyEvent[],now:Date){
 const today=lisbonDay(now),out:ReturnType<typeof familyLegs>=[];
 // Tomorrow is included because a departure/reminder may fall on the previous day.
 for(const day of [today,addDays(today,1)])for(const event of events)for(const leg of familyLegs(event,day))if(now.getTime()>=leg.reminder&&now.getTime()<leg.departure+5*60000)out.push(leg);
 return out;
}
