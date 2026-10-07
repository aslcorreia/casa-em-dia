import {cookies} from 'next/headers';
import {sameOrigin,fail} from '@/lib/server';
export async function POST(r:Request){try{sameOrigin(r);const c=await cookies();c.delete('ced-access');c.delete('ced-refresh');return Response.json({ok:true});}catch(e){return fail(e);}}
