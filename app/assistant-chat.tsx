'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUp,Sparkles,RotateCcw,Check,LoaderCircle} from 'lucide-react';
import {requestJSON} from '@/lib/client-request';
import {ChatMessage,Proposal} from '@/lib/assistant-ai';

export default function AssistantChat({onProposal}:{onProposal:(proposal:Proposal)=>void}){
 const [messages,setMessages]=useState<ChatMessage[]>([]),[text,setText]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[ready,setReady]=useState<boolean|null>(null),[pending,setPending]=useState('');
 const end=useRef<HTMLDivElement>(null),input=useRef<HTMLTextAreaElement>(null);
 const load=async()=>{setLoading(true);try{const p=await requestJSON<{messages:ChatMessage[];ready:boolean}>('/api/assistant',{cache:'no-store'});setMessages(p.messages);setReady(p.ready);setError('');}catch(e){setError((e as Error).message);}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 useEffect(()=>{if(messages.length)end.current?.scrollIntoView({behavior:'smooth',block:'nearest'});},[messages.length,busy]);
 const send=async(value:string)=>{if(busy||loading||value.trim().length<2)return;setBusy(true);setPending(value.trim());setError('');try{const p=await requestJSON<{messages:ChatMessage[];ready:boolean}>('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:value.trim()})},60000);setMessages(p.messages);setReady(true);setText('');}catch(e){setText(value.trim());setError((e as Error).message);}finally{setBusy(false);setPending('');input.current?.focus();}};
 const clear=async()=>{if(busy)return;setBusy(true);try{await requestJSON('/api/assistant',{method:'DELETE'});setMessages([]);setError('');}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 return <section className="ai-chat panel" aria-label="Conversar com a IA">
  <div className="ai-chat-heading"><div><Sparkles size={22}/><h2>Fala com o teu Assistente</h2></div>{messages.length>0&&<button className="textbutton" disabled={busy} onClick={clear}><RotateCcw size={15}/>Nova conversa</button>}</div>
  <p className="ai-chat-description">Lê os registos a que tens acesso e, para a família, os horários dos próximos sete dias. Ajuda a organizar e propõe tarefas para reveres.</p>
  {loading?<p className="quiet-empty">A abrir a conversa…</p>:<>
   {ready===false&&<div className="notice compact"><div><strong>A IA está indisponível neste momento.</strong><p>Podes continuar a organizar as tarefas no acompanhamento abaixo.</p><button className="textbutton" onClick={load}>Verificar ligação</button></div></div>}
   {!messages.length&&<div className="ai-starters">{['O que devo tratar primeiro?','Ajuda-me a organizar a semana','Divide uma tarefa em pequenos passos','Prepara uma mensagem para confirmar os hóspedes'].map(question=><button key={question} disabled={busy||ready===false} onClick={()=>send(question)}>{question}</button>)}</div>}
   <div className="ai-conversation" role="log" aria-label="Histórico da conversa">{messages.map((message,n)=><div className={'ai-message ai-message-'+message.role} key={message.at+n}><small>{message.role==='user'?'Tu':'Casa em Dia · IA'}</small><p>{message.text}</p>{message.role==='assistant'&&message.actions?.map((a,k)=><div className="ai-proposal" key={k}><span className="badge">Proposta · {a.type==='createTask'?'nova tarefa':'organizar tarefa'}</span><h3>{a.title}</h3><p>{a.area} · {a.assignee}{a.due?' · '+new Date(a.due+'T12:00:00').toLocaleDateString('pt-PT'):' · Sem prazo'}</p>{a.nextStep&&<p>{a.nextStep}</p>}{a.steps.length>0&&<ol>{a.steps.map((step,j)=><li key={j}>{step}</li>)}</ol>}<button className="secondary" disabled={busy} onClick={()=>onProposal(a)}><Check size={16}/>Rever tarefa antes de guardar</button></div>)}</div>)}{pending&&<div className="ai-message ai-message-user"><small>Tu · a enviar</small><p>{pending}</p></div>}{busy&&<p className="ai-thinking" role="status"><LoaderCircle size={17}/>A pensar nos teus registos…</p>}<div ref={end}/></div>
   {error&&<p className="errorbox" role="alert">{error}<button onClick={load} disabled={busy}>Atualizar conversa</button></p>}
   <form className="ai-composer" onSubmit={e=>{e.preventDefault();send(text);}}><label htmlFor="assistant-question" className="sr-only">Pergunta ao Assistente</label><textarea ref={input} id="assistant-question" rows={2} maxLength={2000} value={text} disabled={busy} onChange={e=>setText(e.target.value)} placeholder="Ex.: ajuda-me a preparar a próxima chegada…" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send(text);}}}/><button className="primary" disabled={busy||ready===false||text.trim().length<2} aria-label="Enviar pergunta">{busy?<LoaderCircle size={20}/>:<ArrowUp size={20}/>}</button></form>
  </>}
  <p className="ai-chat-footnote">A IA recebe o teu pedido e uma seleção dos registos visíveis. A conversa é privada por utilizador e fica guardada na app. Pode enganar-se: revê as sugestões. Pesquisa de preços na Internet e análise de fotografias ainda não estão ligadas.</p>
 </section>;
}

