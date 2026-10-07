'use client';
import {useState} from 'react';
import {Users,CalendarDays,Check} from 'lucide-react';
import {areas,Data,Item,isOpen,mayUseArea,Member} from '@/lib/model';
import {entryTemplates,templateDraft} from '@/lib/entry-templates';
import PushSettings from './push-settings';
type Person=Member;
export default function Setup({team,items,initial,onTeam,onDraft,onOpen}:{team:Person[];items:Item[];initial:Data;onTeam:()=>void;onDraft:(d:Data)=>void;onOpen:(i:Item)=>void}){
 const [area,setArea]=useState<Data['area']>('Limpeza da casa'),[templateId,setTemplateId]=useState(''),[assignee,setAssignee]=useState(''),[due,setDue]=useState(''),[time,setTime]=useState('');
 const routines=items.filter(i=>i.kind==='task'&&isOpen(i)&&i.data.repeat!=='Não repetir');
 const models=entryTemplates.filter(t=>t.kind==='task'&&(t.routine||t.repeat&&t.repeat!=='Não repetir')&&(t.scope===area||t.scope==='Alojamentos'&&area.includes('Paixão')));
 const selected=models.find(t=>t.id===templateId);const hasEmployee=team.some(m=>m.role==='employee');
 return <div className="setup-stack"><section className="panel setup-card"><div className="setup-title"><Users size={23}/><h2>1. Quem faz parte da equipa?</h2>{hasEmployee&&<Check size={20}/>}</div><p>{team.map(m=>m.name).join(' · ')}</p><p>{hasEmployee?'A equipa já tem acesso de colaboração. Podes rever quem entra e as permissões.':'Falta autorizar a empregada com o nome e o email que vai usar para entrar.'}</p><button className="secondary" onClick={onTeam}>{hasEmployee?'Rever equipa':'Adicionar a empregada'}</button><small>Escolhe os espaços de trabalho e envia um convite por email. A colaboradora entra diretamente na sua vista simples.</small></section>
 <section className="panel setup-card"><div className="setup-title"><CalendarDays size={23}/><h2>2. Combinar as rotinas</h2><span className="badge">{routines.length} em aberto</span></div><p>Escolhe uma rotina, quem trata e a primeira data. Podes rever os passos antes de guardar.</p>
 <form onSubmit={e=>{e.preventDefault();if(selected)onDraft({...templateDraft(selected,initial,area),assignee,due,time});}}>
 <div className="form-grid"><label className="field"><span>Espaço</span><select value={area} onChange={e=>{setArea(e.target.value as Data['area']);setTemplateId('');setAssignee('');}}>{areas.map(a=><option key={a}>{a}</option>)}</select></label><label className="field"><span>Rotina</span><select required value={templateId} onChange={e=>setTemplateId(e.target.value)}><option value="">Escolher uma rotina</option>{models.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label><label className="field"><span>Responsável</span><select required value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">Escolher uma pessoa</option>{team.filter(m=>mayUseArea(m,area)).map(m=><option key={m.email}>{m.name}</option>)}</select></label><label className="field"><span>Primeira data</span><input required type="date" value={due} onChange={e=>setDue(e.target.value)}/></label><label className="field"><span>Hora, se fizer sentido</span><input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label></div>
 {!models.length&&<p>Para este espaço, começa por uma tarefa em Modelos e rotinas e escolhe a repetição.</p>}{selected&&<p>{selected.hint} Repetição: {selected.repeat||'Semanal'}.</p>}<button className="primary" disabled={!selected}>Rever e criar rotina</button><small>A próxima ocorrência é criada quando marcas a anterior como feita.</small></form>
 {routines.length>0&&<div className="setup-routines">{routines.map(i=><button className="space-row" key={i.id} onClick={()=>onOpen(i)}><span><strong>{i.data.title}</strong><small>{i.data.area} · {i.data.assignee} · {i.data.due} · {i.data.repeat}</small></span></button>)}</div>}</section>
 <PushSettings/></div>;
}
