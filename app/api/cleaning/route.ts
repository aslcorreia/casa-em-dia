import {z} from 'zod';
import {db,member,sameOrigin,fail,json,rest} from '@/lib/server';
import {recordSchema,mayUseArea} from '@/lib/model';
import {cleaningDrafts} from '@/lib/cleaning';
const input=z.object({stayId:z.string().min(1).max(100),version:z.number().int().positive(),assignee:z.string().min(2).max(150),due:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),time:z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/)});
export async function POST(r:Request){try{
 sameOrigin(r);const m=await member();if(m.role!=='admin')return new Response('Sem permissão',{status:403});
 const p=input.safeParse(await r.json());if(!p.success)return new Response('Escolhe responsável, data e hora válida.',{status:400});
 const row=await db().prepare('SELECT * FROM records WHERE id=?').bind(p.data.stayId).first<any>();
 if(!row||row.kind!=='stay')return new Response('Estadia não encontrada.',{status:404});
 const stay={...row,data:recordSchema.parse(JSON.parse(row.data))};
 if(!p.data.due||p.data.due>stay.data.due||Number.isNaN(Date.parse(p.data.due))||['Concluído','Cancelado'].includes(stay.data.status))return new Response('Escolhe uma data até à entrada, numa estadia em aberto.',{status:400});
 const team=await db().prepare('SELECT name,email,role FROM members').all<any>();
 if(!team.results.some(x=>x.name===p.data.assignee&&mayUseArea(x,stay.data.area)))return new Response('Escolhe alguém da equipa.',{status:400});
 const tasks=cleaningDrafts(stay,p.data.assignee,p.data.due,p.data.time);if(!tasks.length)return new Response('Não há modelos de limpeza para este alojamento.',{status:400});
 const result:any=await rest('rpc/ced_plan_cleaning','POST','',{p_stay_id:stay.id,p_version:p.data.version,p_actor_email:m.email,p_tasks:tasks});
 if(result.conflict)return new Response('A estadia mudou. Fecha e abre novamente para confirmar os dados.',{status:409});
 return json(result);
 }catch(e){return fail(e);}}
