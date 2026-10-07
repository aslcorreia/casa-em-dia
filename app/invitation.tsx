'use client';
import {useEffect,useState} from 'react';
export default function Invitation(){
 const [token,setToken]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{const p=new URLSearchParams(location.hash.slice(1));const refresh=p.get('refresh_token');if(refresh){setToken(refresh);history.replaceState(null,'',location.pathname+location.search);}else if(p.get('error_description')){setMessage('O convite expirou. Pede um novo código para entrar.');history.replaceState(null,'',location.pathname);}},[]);
 async function accept(){setBusy(true);setMessage('');try{const r=await fetch('/api/auth/accept',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:token})});if(!r.ok)throw new Error('Não foi possível aceitar o convite. Pede um novo código no ecrã de entrada.');setToken('');location.replace('/');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 if(!token&&!message)return null;
 return <section className="invitation panel" role="region" aria-label="Convite Casa em Dia"><h2>Bem-vinda à Casa em Dia</h2><p>Entra para ver os teus espaços e o trabalho combinado.</p>{token&&<button className="primary" disabled={busy} onClick={accept}>{busy?'A entrar…':'Aceitar convite e entrar'}</button>}{message&&<p role="alert">{message}</p>}</section>;
}
