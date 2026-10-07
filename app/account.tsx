'use client';
import {LogOut,ShieldCheck} from 'lucide-react';

export default function Account({member,busy,onLogout}:{member:{name:string;email:string;role:string};busy:boolean;onLogout:()=>void}){
 return <section className="panel account-panel" aria-label="A minha conta">
  <div className="account-identity"><span className="avatar">{member.name.slice(0,1)}</span><div><h2>{member.name}</h2><p>{member.email}</p></div></div>
  <dl><div><dt>Acesso</dt><dd>{member.role==='admin'?'Gestão e aprovações':'Colaboração'}</dd></div><div><dt>Entrada</dt><dd>Código por email</dd></div></dl>
  <p className="account-help"><ShieldCheck size={18}/>A sessão já está iniciada neste dispositivo.</p>
  <div className="account-actions"><a className="primary" href="/">Ir para o meu dia</a><button className="secondary" disabled={busy} onClick={onLogout}><LogOut size={17}/>{busy?'A terminar sessão…':'Terminar sessão'}</button></div>
  <small>Para usar outra conta, termina sessão e entra com o outro email autorizado.</small>
 </section>;
}
