'use client';
import AssistantChat from './assistant-chat';
import {Proposal} from '@/lib/assistant-ai';
import {useState} from 'react';
import {ArrowRight,CheckCheck,Clock,Copy,Search,Sparkles} from 'lucide-react';
import {toast} from 'sonner';
import {Item,Data,assistantItems,possibleDuplicates,notices} from '@/lib/model';

type Props={items:Item[];today:string;me:{name:string;role:string};busy:boolean;open:(item:Item)=>void;update:(item:Item,patch:Partial<Data>)=>Promise<boolean>;onProposal:(proposal:Proposal)=>void};
const format=(value:string)=>new Date(value+'T12:00:00').toLocaleDateString('pt-PT',{day:'numeric',month:'short'});
export default function Assistant({items,today,me,busy,open,update,onProposal}:Props){
 const [tab,setTab]=useState('mine');
 const active=assistantItems(items,today),alerts=notices(items,today),duplicates=possibleDuplicates(active);
 const mine=active.filter(i=>i.data.status!=='À espera'&&(i.data.assignee===me.name||i.data.assignee==='Por atribuir'));
 const team=active.filter(i=>!mine.includes(i)),shown=tab==='mine'?mine:team;
 const tomorrow=new Date(new Date(today+'T12:00:00Z').getTime()+86400000).toISOString().slice(0,10);
 const copyGuest=async(i:Item)=>{const d=i.data;const message=`Olá! Para prepararmos a sua estadia, ${!d.guestsConfirmed?'pode confirmar o total de adultos, crianças e bebés? ':''}${!d.arrivalConfirmed?'Qual é a hora prevista de chegada? ':''}Se tiver algum pedido especial, diga-nos, por favor. Obrigada!`;try{await navigator.clipboard.writeText(message);toast.success('Mensagem copiada. Revê antes de enviar.');}catch{toast.error('Não foi possível copiar. Abre os detalhes da estadia.');}};
 return <div className="assistant-view">
  <AssistantChat onProposal={onProposal}/>
  <section className="assistant-intro"><span className="assistant-icon"><Sparkles size={24}/></span><div><h2>Vamos dar o próximo passo.</h2><p>Organizo os teus registos por prazo, responsável e informação em falta. Também incluo tarefas sem data.</p><small>O acompanhamento abaixo identifica prazos e revisões automaticamente.</small></div></section>
  <div className="assistant-tabs" role="group" aria-label="Quem pode avançar"><button aria-pressed={tab==='mine'} onClick={()=>setTab('mine')}>Posso avançar <span>{mine.length}</span></button><button aria-pressed={tab==='team'} onClick={()=>setTab('team')}>Com a equipa / à espera <span>{team.length}</span></button></div>
  {!active.length?<div className="panel empty"><CheckCheck size={32}/><h3>Sem próximos passos para já</h3><p>As tarefas adiadas continuam em Tarefas. Voltam aqui na data escolhida, ou antes se houver um prazo hoje ou uma chegada próxima.</p></div>:!shown.length?<div className="panel quiet-empty">{tab==='mine'?'Os assuntos em aberto estão com a equipa. Podes acompanhá-los no separador ao lado.':'Não há assuntos com a equipa ou à espera.'}</div>:<>
   <p className="assistant-caption">{tab==='mine'?'Começa por um destes assuntos.':'Acompanha quem está a tratar de cada assunto.'} Primeiro aparecem os que precisam de atenção.</p>
   <div className="assistant-cards">{shown.map(i=>{
    const d=i.data,reasons=alerts.filter(a=>a.id===i.id).map(a=>a.reason);
    const next=d.steps.find(s=>!s.done)?.title||d.nextStep;
    const waiting=d.status==='À espera';
    return <article className="panel assistant-card" key={i.id}>
     <div className="assistant-card-top"><small>{d.area}</small><span className={'badge '+(reasons.length?'waiting':'')}>{reasons.length?'Precisa de atenção':waiting?'À espera':d.status}</span></div>
     <h3>{d.title}</h3><p className="assistant-owner">{waiting?'À espera de '+(d.waitingFor||d.assignee):'Responsável: '+d.assignee}{d.due?' · '+format(d.due):' · Sem prazo'}</p>
     {reasons.length>0&&<ul className="assistant-reasons">{reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>}
     {next&&<p className="assistant-next"><ArrowRight size={17}/><span>{next}</span></p>}
     {!next&&!waiting&&i.kind==='task'&&<p className="assistant-hint">{d.assignee==='Por atribuir'?'Escolhe quem fica responsável nos detalhes.':!d.due?'Escolhe um dia para esta tarefa, se tiver prazo.':'Abre os detalhes para dividir a tarefa em pequenos passos.'}</p>}
     {waiting&&<p className="assistant-hint"><Clock size={16}/>{d.reviewOn?'Voltar a verificar em '+format(d.reviewOn):'Falta combinar quando voltar a verificar.'}</p>}
     <div className="assistant-actions">
      <button className="secondary" onClick={()=>open(i)}>{waiting?'Ver acompanhamento':'Ver detalhes'}<ArrowRight size={16}/></button>
      {i.kind==='task'&&!d.due&&!waiting&&<><button className="textbutton" disabled={busy} onClick={()=>update(i,{due:today})}>Prazo hoje</button><button className="textbutton" disabled={busy} onClick={()=>update(i,{due:tomorrow})}>Amanhã</button></>}
      {waiting&&<button className="textbutton" disabled={busy} onClick={()=>update(i,{reviewOn:tomorrow})}>Rever amanhã</button>}
      {d.snoozeUntil&&d.snoozeUntil<=today&&<button className="textbutton" disabled={busy} onClick={()=>update(i,{snoozeUntil:''})}>Retomar</button>}
      {i.kind==='stay'&&(!d.guestsConfirmed||!d.arrivalConfirmed)&&<button className="textbutton" onClick={()=>copyGuest(i)}><Copy size={16}/>Copiar pedido ao hóspede</button>}
      {['incident','purchase'].includes(i.kind)&&<a className="textbutton" target="_blank" rel="noopener noreferrer" href={'https://www.google.com/search?q='+encodeURIComponent(d.title+' '+(d.area==='Quinta · Arruda'?'Arruda dos Vinhos':'Lisboa'))}><Search size={16}/>Abrir pesquisa</a>}
     </div>
    </article>;
   })}</div>
  </>}
  {duplicates.length>0&&<section className="day-section"><div className="section-top"><h2>Vale a pena confirmar</h2></div><div className="panel">{duplicates.map(group=><div className="duplicate-check" key={group[0].id}><strong>Possível tarefa repetida: {group[0].data.title}</strong><p>{group[0].data.area} · Há {group.length} tarefas com este nome. Confirma se são o mesmo assunto antes de apagar.</p><div>{group.map(i=><button className="textbutton" key={i.id} onClick={()=>open(i)}>Ver · {i.data.assignee}{i.data.due?' · '+format(i.data.due):' · sem prazo'}</button>)}</div></div>)}</div></section>}
  <p className="assistant-limit">As alterações só são guardadas quando carregas num botão. Esta app ainda não envia mensagens a hóspedes, não pesquisa preços sozinha e não interpreta fotografias.</p>
 </div>;
}
