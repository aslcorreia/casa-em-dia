import {z} from 'zod';
export const ARROIOS='Arroios de Paixão — Quarto' as const;
export const DUPLEX='Arroios de Paixão — Duplex' as const;
export const ALFAMA='Alfama de Paixão' as const;
export const lodgingAreas=[ARROIOS,DUPLEX,ALFAMA] as const;
export const areas=['Família','Limpeza da casa','Quinta · Arruda','Lavandaria',...lodgingAreas] as const;
// Accept older records and open clients without losing their space associations.
export const normalizeArea=(value:unknown)=>value==='Casa'?'Limpeza da casa':value==='Alojamento 1'?ARROIOS:value==='Alojamento 2'?DUPLEX:value==='Alojamento 3'?ALFAMA:value;
export const areaSchema=z.preprocess(normalizeArea,z.enum(areas));
export const isLodgingArea=(value:unknown)=>lodgingAreas.some(area=>area===normalizeArea(value));
export const states=['Por fazer','Em curso','À espera','Por aprovar','Aprovado','Concluído','Cancelado'] as const;
export const kinds=['task','incident','purchase','supplier','stay'] as const;
export const recordSchema=z.object({deletedAt:z.string().max(40).default(''),nextStep:z.string().max(300).default(''),steps:z.array(z.object({id:z.string().max(100),title:z.string().trim().min(1).max(200),done:z.boolean()})).max(30).default([]),waitingFor:z.string().max(150).default(''),reviewOn:z.string().max(10).default(''),snoozeUntil:z.string().max(10).default(''),title:z.string().trim().min(2).max(160),area:areaSchema,description:z.string().max(5000).default(''),status:z.enum(states).default('Por fazer'),priority:z.enum(['Normal','Alta','Urgente']).default('Normal'),assignee:z.string().max(150).default('Por atribuir'),due:z.string().max(16).default(''),time:z.string().max(5).default(''),repeat:z.enum(['Não repetir','Diária','Semanal','Mensal']).default('Não repetir'),accepted:z.boolean().default(false),price:z.number().min(0).max(1000000).nullable().default(null),url:z.string().max(2000).refine(v=>!v||/^https?:\/\//.test(v),'Use um endereço https://').default(''),supplierId:z.string().max(100).default(''),phone:z.string().max(40).regex(/^[+\d\s().-]*$/,'Telefone inválido').default(''),email:z.union([z.literal(''),z.string().email().max(200)]).default(''),serviceAreas:z.array(areaSchema).max(7).default([]),completedAt:z.string().default(''),contact:z.string().max(200).default(''),category:z.string().max(100).default(''),channel:z.enum(['Manual','Booking','Airbnb','Trip.com','Talkguest']).default('Manual'),checkout:z.string().max(10).default(''),guests:z.number().int().min(1).max(100).default(1),confirmedGuests:z.number().int().min(1).max(100).nullable().default(null),guestsConfirmed:z.boolean().default(false),arrival:z.string().max(5).default(''),arrivalConfirmed:z.boolean().default(false),cleaning:z.enum(['Por marcar','Marcada','Concluída']).default('Por marcar'),quotes:z.array(z.object({id:z.string(),supplier:z.string().min(1).max(160),amount:z.number().min(0).max(1000000),notes:z.string().max(1000),url:z.string().max(2000).refine(v=>!v||/^https?:\/\//.test(v)),selected:z.boolean()})).max(30).default([])});
export type Data=z.infer<typeof recordSchema>;
export type Item={id:string;kind:typeof kinds[number];data:Data;version:number;updated_at:string;created_by:string};
export function maySee(item:Item,member:{role:string;name:string;email:string}) {return member.role==='admin'||(['task','incident'].includes(item.kind)&&item.data.area!=='Família'&&(item.data.assignee===member.name||item.created_by===member.email));}
export const isOpen=(i:Item)=>i.kind!=='supplier'&&!i.data.deletedAt&&!['Concluído','Cancelado'].includes(i.data.status);
export const canTrash=(i:Item,m:{role:string;email:string;name:string})=>i.kind==='task'&&maySee(i,m)&&(m.role==='admin'||i.created_by===m.email);
export function statusTone(status:string){return status==='Concluído'?'success':status==='À espera'||status==='Por aprovar'?'waiting':status==='Em curso'?'progress':'';}
export function notices(items:Item[],today:string){
 const horizon=new Date(new Date(today+'T12:00:00Z').getTime()+2*86400000).toISOString().slice(0,10);
 return items.filter(isOpen).flatMap(i=>{
  const d=i.data,out:{id:string;title:string;reason:string}[]=[];
  const add=(reason:string)=>out.push({id:i.id,title:d.title,reason});
  const upcoming=i.kind==='stay'&&d.due>=today&&d.due<=horizon;
  const paused=d.snoozeUntil>today;
  if(d.due===today)add(i.kind==='stay'?'Entrada hoje':'Prazo hoje');
  if(d.due&&d.due<today&&!paused)add('Prazo ultrapassado');
  if(upcoming){
   if(!d.guestsConfirmed)add('Confirmar o número de hóspedes');
   if(!d.arrivalConfirmed)add('Confirmar a hora de chegada');
   if(d.guestsConfirmed&&d.confirmedGuests!==d.guests)add('Ocupação diferente da reserva');
   if(d.cleaning==='Por marcar')add('Limpeza por marcar');
  }
  if(!paused){
   if(d.snoozeUntil&&d.snoozeUntil<=today)add('Retomar assunto adiado');
   if(d.reviewOn&&d.reviewOn<=today&&d.status==='À espera')add('Voltar a contactar '+(d.waitingFor||'o responsável'));
   if(d.status==='Por aprovar')add('Precisa de aprovação');
   if(i.kind==='task'&&d.assignee==='Por atribuir')add('Falta atribuir um responsável');
  }
  return out;
 });
}
export function assistantItems(items:Item[],today:string){
 const alerts=notices(items,today),flagged=new Set(alerts.map(a=>a.id));
 return items.filter(isOpen).filter(i=>!i.data.snoozeUntil||i.data.snoozeUntil<=today||flagged.has(i.id)).sort((a,b)=>Number(flagged.has(b.id))-Number(flagged.has(a.id))||(a.data.due||'9999').localeCompare(b.data.due||'9999')||b.updated_at.localeCompare(a.updated_at));
}
export function possibleDuplicates(items:Item[]){
 const groups=new Map<string,Item[]>();
 for(const i of items.filter(i=>i.kind==='task'&&isOpen(i))){const key=i.data.area+'|'+i.data.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();groups.set(key,[...(groups.get(key)||[]),i]);}
 return [...groups.values()].filter(g=>g.length>1);
}
