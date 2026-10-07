import {env} from 'cloudflare:workers';
export async function GET(){
 const ready=typeof (env as unknown as {AI?:{run?:unknown}}).AI?.run==='function';
 return Response.json({ready,provider:'Cloudflare Workers AI'},{headers:{'Cache-Control':'no-store'}});
}
