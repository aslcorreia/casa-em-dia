import {authRequest,setSession,sameOrigin,db,fail} from '@/lib/server';
export async function POST(r:Request){try{
 sameOrigin(r);const p:any=await r.json();if(typeof p.refresh_token!=='string'||p.refresh_token.length>4096||p.refresh_token.length<10)return new Response('Convite inválido.',{status:400});
 const res=await authRequest('token?grant_type=refresh_token',{refresh_token:p.refresh_token});if(!res.ok)return new Response('Este convite expirou. Pede um novo código no ecrã de entrada.',{status:400});
 const s:any=await res.json();if(!s.user?.email_confirmed_at||!s.user.email)return new Response('Confirma o email do convite.',{status:401});
 const m=await db().prepare('SELECT * FROM members WHERE email=?').bind(s.user.email.toLowerCase()).first<any>();
 if(!m||m.active===false)return new Response('Este convite já não tem acesso. Contacta a responsável.',{status:403});
 await setSession(s);return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return fail(e);}}
