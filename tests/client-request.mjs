import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{build}=require(require.resolve('esbuild',{paths:[require.resolve('wrangler')]}));
mkdirSync('.runtime-tests',{recursive:true});
await build({entryPoints:['lib/client-request.ts'],bundle:true,platform:'node',format:'cjs',outfile:'.runtime-tests/client-request.cjs'});
const {requestJSON}=require('../.runtime-tests/client-request.cjs');
const original=global.fetch;
try{
 let calls=0;
 global.fetch=async()=>{calls++;return Response.json({item:{id:'saved',version:2}});};
 assert.equal((await requestJSON('/api/records',{method:'POST'})).item.version,2);assert.equal(calls,1);
 global.fetch=async()=>Response.json({error:'Outra pessoa alterou esta tarefa.'},{status:409});
 await assert.rejects(requestJSON('/api/records',{method:'POST'}),/Outra pessoa alterou/);
 global.fetch=async()=>new Response('<html>Proxy unavailable</html>',{status:502});
 await assert.rejects(requestJSON('/api/records'),/Não foi possível concluir/);
 global.fetch=async()=>{throw new TypeError('Failed to fetch');};
 await assert.rejects(requestJSON('/api/records'),/Sem ligação/);
 calls=0;global.fetch=(_url,{signal})=>{calls++;return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));};
 await assert.rejects(requestJSON('/api/assistant',{method:'POST'},5),/confirmar o resultado antes de repetir/);
 assert.equal(calls,1,'A timed-out mutation must never be retried automatically');
 await assert.rejects(requestJSON('/api/records',{},5),/ligação está a demorar/);
 console.log('PASS: confirmed responses, concurrent-edit errors, unavailable proxy, offline connection, bounded waits and no automatic mutation retries.');
}finally{global.fetch=original;}
