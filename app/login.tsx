'use client';
import {useState} from 'react';
export default function Login({onSuccess}:{onSuccess:()=>void}){
 const [email,setEmail]=useState(''),[code,setCode]=useState(''),[sent,setSent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:React.FormEvent){
  e.preventDefault();if(busy)return;setBusy(true);setError('');
  try{
   const r=await fetch('/api/auth/'+(sent?'verify':'login'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim(),code:code.trim()})});
   if(!r.ok){const text=await r.text();let message=text;try{message=JSON.parse(text).error||text;}catch{}throw new Error(message);}
   if(sent)onSuccess();else setSent(true);
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível entrar. Tenta novamente.');}finally{setBusy(false);}
 }
 return <form onSubmit={submit} className="login-form" aria-label="Iniciar sessão">
  <label className="field"><span>O teu email</span><input type="email" name="email" autoComplete="email" required maxLength={200} placeholder="nome@exemplo.pt" value={email} disabled={sent||busy} onChange={e=>setEmail(e.target.value)}/></label>
  {sent?<><p className="login-sent" role="status">Enviámos um código para <strong>{email.trim()}</strong>. Consulta também o spam.</p><label className="field"><span>Código recebido por email</span><input name="code" required maxLength={12} autoComplete="one-time-code" inputMode="numeric" value={code} disabled={busy} onChange={e=>setCode(e.target.value)}/></label></>:<p className="login-help">Usa o email autorizado para a tua família ou equipa. Recebes um código para entrar, sem palavra-passe.</p>}
  {error&&<p className="errorbox" role="alert">{error}</p>}
  <button className="primary" disabled={busy}>{busy?(sent?'A entrar…':'A enviar código…'):sent?'Entrar':'Receber código'}</button>
  {sent&&<button type="button" className="textbutton" disabled={busy} onClick={()=>{setSent(false);setCode('');setError('');}}>Usar outro email ou pedir novo código</button>}
 </form>;
}
