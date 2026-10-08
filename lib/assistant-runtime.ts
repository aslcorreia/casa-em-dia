// Bound the server wait as well as the phone's request. Never retry inference.
export class AssistantTimeout extends Error {}
export async function boundedInference<T>(run:()=>Promise<T>,timeoutMs=45000):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([Promise.resolve().then(run),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new AssistantTimeout('AI_TIMEOUT')),timeoutMs);})]);}
 finally{if(timer!==undefined)clearTimeout(timer);}
}
