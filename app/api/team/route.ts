import {member,sameOrigin,fail,json,rest,config,authRequest} from '@/lib/server';
import {areas} from '@/lib/model';
import {z} from 'zod';
const input=z.object({email:z.string().email().max(200).transform(v=>v.toLowerCase().trim()),name:z.string().trim().min(2).max(80),allowed_areas:z.array(z.enum(areas)).min(1).max(6).refine(a=>!a.includes('Família')),active:z.boolean().default(true),action:z.enum(['invite','save']).default('invite')});
export async function POST(r:Request){try{
 sameOrigin(r);const m=await member();if(m.role!=='admin')return new Response('Sem permissão',{status:403});
 const parsed=input.safeParse(await r.json());if(!parsed.success)return new Response('Indica nome, email e pelo menos um espaço de trabalho.',{status:400});
 const p=parsed.data;
 const saved:any=await rest('rpc/ced_manage_employee','POST','',{p_actor:m.email,p_email:p.email,p_name:p.name,p_areas:[...new Set(p.allowed_areas)],p_active:p.active});
 if(saved.error)return new Response(saved.error,{status:400});
 if(p.action==='save'||!p.active)return json({ok:true,sent:false});
 // A sent invitation is not claimed until the provider accepted it. Never return credentials.
 const c=config(),redirect=new URL('/',r.url).href;
 let response=await fetch(c.SUPABASE_URL+'/auth/v1/invite?redirect_to='+encodeURIComponent(redirect),{method:'POST',headers:{apikey:c.SUPABASE_SECRET_KEY,Authorization:'Bearer '+c.SUPABASE_SECRET_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:p.email})});
 let delivery='invite';
 if(!response.ok){const problem:any=await response.json().catch(()=>({}));if(problem.error_code==='email_exists'||problem.code==='email_exists'){
  // Existing confirmed users receive the app's email code instead of a second signup.
  response=await authRequest('otp',{email:p.email,create_user:false});delivery='code';
 }}
 await rest('members','PATCH','?email=eq.'+encodeURIComponent(p.email),{invite_status:response.ok?'sent':'failed',...(response.ok?{invited_at:new Date().toISOString()}: {})});
 if(!response.ok)return Response.json({error:'O acesso ficou guardado, mas o email não foi enviado. Confirma o endereço e usa Reenviar convite dentro de um minuto.'},{status:502});
 return json({ok:true,sent:true,delivery});
 }catch(e){return fail(e);}}
