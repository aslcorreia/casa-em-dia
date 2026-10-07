'use client';
import {useEffect,useState} from 'react';
import {Bell,Smartphone} from 'lucide-react';
async function result<T=unknown>(r:Response):Promise<T>{if(!r.ok){let message=await r.text();try{message=JSON.parse(message).error||message;}catch{}throw new Error(message);}return r.json() as Promise<T>;}
async function hash(endpoint:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(endpoint)))).map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function pauseDevicePush(){
 if(!('serviceWorker' in navigator))return;
 const reg=await navigator.serviceWorker.getRegistration('/');const sub=await reg?.pushManager?.getSubscription();if(!sub)return;
 await result(await fetch('/api/push',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:await hash(sub.endpoint)})}));
 await sub.unsubscribe();
}
export default function PushSettings(){
 const [supported,setSupported]=useState(false),[needsInstall,setNeedsInstall]=useState(false),[enabled,setEnabled]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[key,setKey]=useState(''),[id,setId]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{let active=true;
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const installed=window.matchMedia('(display-mode: standalone)').matches||(navigator as any).standalone;
  setNeedsInstall(ios&&!installed);
  const ok='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;setSupported(ok);
  if(!ok){setReady(true);return;}
  (async()=>{try{const data=await result<{publicKey:string;devices:{id:string;enabled:boolean}[]}>(await fetch('/api/push'));const reg=await navigator.serviceWorker.register('/sw.js');const sub=await reg.pushManager.getSubscription();const current=sub?await hash(sub.endpoint):'';if(!active)return;setKey(data.publicKey);setId(current);setEnabled(Notification.permission==='granted'&&data.devices.some(d=>d.id===current&&d.enabled));}catch(e){if(active)setMessage((e as Error).message);}finally{if(active)setReady(true);}})();
  return()=>{active=false;};
 },[]);
 const toggle=async()=>{setBusy(true);setMessage('');try{
  if(enabled){await pauseDevicePush();setEnabled(false);setId('');setMessage('Avisos desativados neste dispositivo.');return;}
  // Request permission directly from the user's click, before asynchronous setup.
  const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Os avisos não foram autorizados. Podes permitir nas definições do navegador.');
  const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();
  if(!sub){const bytes=Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});}
  const saved=await result<{id:string}>(await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:sub.toJSON()})}));setId(saved.id);setEnabled(true);setMessage('Ativados. Podes testar a receção abaixo.');
 }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}};
 const test=async()=>{setBusy(true);setMessage('');try{await result(await fetch('/api/push',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'test',id})}));setMessage('Teste enviado. Confirma se apareceu uma notificação neste dispositivo.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}};
 return <section className="panel setup-card" aria-label="Avisos no telemóvel"><div className="setup-title"><Smartphone size={23}/><h2>Avisos no telemóvel</h2><span className="badge">{enabled?'Ativados neste dispositivo':'Por ativar'}</span></div><p>Um resumo às 08:00, hora de Lisboa, quando houver assuntos que precisem de atenção. Chega mesmo com a app fechada.</p><small>O aviso mostra apenas a quantidade de assuntos. Abre a app para ver os detalhes. Ao terminar sessão, os avisos deste dispositivo são desativados.</small>{needsInstall&&<div className="notice compact">No iPhone ou iPad: abre no Safari → Partilhar → Adicionar ao ecrã principal. Depois abre a Casa em Dia por esse ícone para ativar os avisos.</div>}{!supported&&ready&&!needsInstall&&<p>Este navegador não suporta avisos. Experimenta um navegador atualizado no teu telemóvel.</p>}{supported&&!needsInstall&&<div className="setup-actions"><button type="button" className="secondary" onClick={toggle} disabled={busy||!ready||!key}><Bell size={17}/>{busy?'A tratar…':enabled?'Desativar neste dispositivo':'Ativar neste dispositivo'}</button>{enabled&&<button type="button" className="textbutton" disabled={busy} onClick={test}>Enviar aviso de teste</button>}</div>}{message&&<p role="status" className="setup-feedback">{message}</p>}</section>;
}
