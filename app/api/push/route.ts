import {member,sameOrigin,fail,json,rest} from '@/lib/server';
import {subscriptionSchema,subscriptionId,pushConfig,deliverPush} from '@/lib/push';
export async function GET(){try{const m=await member(),config=await pushConfig();const devices=await rest('push_subscriptions','GET','?member_email=eq.'+encodeURIComponent(m.email)+'&select=id,enabled');return json({publicKey:config.public_key,devices});}catch(e){return fail(e);}}
export async function POST(r:Request){try{
 sameOrigin(r);const m=await member();if(Number(r.headers.get('content-length')||0)>10000)return new Response('Pedido demasiado grande',{status:413});const p:any=await r.json();
 if(p.action==='test'){
  if(typeof p.id!=='string'||!/^[a-f0-9]{64}$/.test(p.id))return new Response('Dispositivo inválido.',{status:400});
  const [row]=await rest('push_subscriptions','GET','?id=eq.'+p.id+'&member_email=eq.'+encodeURIComponent(m.email)+'&enabled=eq.true');
  if(!row)return new Response('Ativa os avisos neste dispositivo.',{status:404});
  const status=await deliverPush(row,'test-'+new Date().toISOString().slice(0,16),'Os avisos estão a chegar a este dispositivo.');
  if(status==='already')return new Response('Espera um minuto antes de testar novamente.',{status:429});
  if(status!=='sent')return new Response('Não foi possível enviar o teste. Tenta desativar e voltar a ativar.',{status:503});return json({ok:true});
 }
 const parsed=subscriptionSchema.safeParse(p.subscription);if(!parsed.success)return new Response('Subscrição inválida ou navegador não suportado.',{status:400});
 const id=await subscriptionId(parsed.data.endpoint);
 await rest('push_subscriptions','POST','?on_conflict=id',{id,member_email:m.email,subscription:parsed.data,enabled:true,updated_at:new Date().toISOString()});return json({id});
 }catch(e){return fail(e);}}
export async function DELETE(r:Request){try{sameOrigin(r);const m=await member();const p:any=await r.json();if(typeof p.id!=='string'||!/^[a-f0-9]{64}$/.test(p.id))return new Response('Dispositivo inválido',{status:400});await rest('push_subscriptions','PATCH','?id=eq.'+p.id+'&member_email=eq.'+encodeURIComponent(m.email),{enabled:false,updated_at:new Date().toISOString()});return json({ok:true});}catch(e){return fail(e);}}
