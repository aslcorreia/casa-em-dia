'use client';
import {Bell,ArrowRight,RefreshCw} from 'lucide-react';
import {Item,notices,isOpen} from '@/lib/model';

export default function Notifications({items,today,name,open,refresh}:{items:Item[];today:string;name:string;open:(item:Item)=>void;refresh:()=>void}){
 const alerts=notices(items,today);
 const list=items.filter(i=>alerts.some(a=>a.id===i.id)).sort((a,b)=>(a.data.due||'9999').localeCompare(b.data.due||'9999'));
 return <section className="notification-view">
  <div className="notice"><Bell size={22}/><div><strong>{list.length?`${list.length} ${list.length===1?'assunto precisa':'assuntos precisam'} de atenção`:'Sem avisos para este momento'}</strong><p>Prazos, aprovações, revisões e chegadas nos próximos dois dias. Cada assunto fica aqui até ser tratado ou adiado.</p></div></div>
  <div className="section-top"><h2>Avisos atuais</h2><button className="textbutton" onClick={refresh}><RefreshCw size={16}/>Atualizar</button></div>
  <div className="panel">{list.length?list.map(i=><button className="alert-row" key={i.id} onClick={()=>open(i)}><div><small>{i.data.area} · {i.data.status==='À espera'?'À espera de '+(i.data.waitingFor||i.data.assignee):i.data.assignee===name?'Depende de ti':'Responsável: '+i.data.assignee}</small><strong>{i.data.title}</strong><p>{alerts.filter(a=>a.id===i.id).map(a=>a.reason).join(' · ')}</p></div><ArrowRight size={20}/></button>):<p className="quiet-empty">{items.some(isOpen)?'Há assuntos em aberto, mas nenhum precisa de aviso agora. Podes vê-los em Tarefas ou no Assistente.':'Não há assuntos em aberto nos registos carregados.'}</p>}</div>
  <p className="assistant-limit">Atualização automática ao abrir a app, ao voltar a esta janela e a cada minuto. As notificações push, com a app fechada, ainda não estão ligadas.</p>
 </section>;
}
