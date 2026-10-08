// A slow connection must not leave a form or the assistant waiting indefinitely.
// Mutations are never retried automatically: the server may already have saved them.
export async function requestJSON<T>(url:string,init:RequestInit={},timeoutMs=20000):Promise<T>{
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetch(url,{...init,signal:controller.signal});
  const text=await response.text();
  let value:any;
  try{value=text?JSON.parse(text):null;}catch{
   if(response.ok)throw new Error('A resposta não foi reconhecida. Atualiza para confirmar os dados.');
  }
  if(!response.ok)throw new Error(typeof value?.error==='string'?value.error:text&&!text.trim().startsWith('<')?text.slice(0,400):'Não foi possível concluir. Tenta novamente.');
  return value as T;
 }catch(error){
  if(controller.signal.aborted)throw new Error(!init.method||init.method==='GET'?'A ligação está a demorar. Tenta atualizar novamente.':'A ligação demorou demasiado. Atualiza para confirmar o resultado antes de repetir.');
  if(error instanceof TypeError)throw new Error('Sem ligação à app. Verifica a Internet e tenta novamente.');
  throw error;
 }finally{clearTimeout(timer);}
}
