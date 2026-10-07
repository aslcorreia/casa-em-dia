'use client';
import {Users,House,Leaf,WashingMachine,Plus,ChevronRight} from 'lucide-react';
import {areas,Item,isOpen} from '@/lib/model';
export default function SpaceCards({items,admin,today,onOpen,onAdd}:{items:Item[];admin:boolean;today:string;onOpen:(area:string)=>void;onAdd:(area:string)=>void}){
 const active=items.filter(isOpen);
 return <section className="spaces-section" aria-label="Os teus espaços"><div className="section-top"><h2>Os teus espaços</h2><span className="muted">Abre um espaço ou acrescenta uma tarefa</span></div><div className="space-cards">{areas.filter(a=>admin||a!=='Família').map(area=>{
  const n=areas.indexOf(area);
  const records=active.filter(i=>i.data.area===area),urgent=records.filter(i=>i.data.due&&i.data.due<=today).length;
  const next=[...records].sort((a,b)=>(a.data.due||'9999').localeCompare(b.data.due||'9999')||b.updated_at.localeCompare(a.updated_at))[0];
  const Icon=area==='Família'?Users:area==='Quinta · Arruda'?Leaf:area==='Lavandaria'?WashingMachine:House;
  return <article className={'space-card space-card-'+n} key={area}><button className="space-card-open" onClick={()=>onOpen(area)} aria-label={'Abrir '+area}><span className="space-card-top"><span className={'space-icon space-'+n}><Icon size={23}/></span><span className="space-card-count">{records.length}<span>em aberto</span></span></span><h3>{area}</h3><p className={urgent?'space-card-alert':''}>{urgent?`${urgent} com prazo hoje ou ultrapassado`:records.length?next.data.title:'Sem assuntos em aberto'}</p></button><div className="space-card-footer"><button onClick={()=>onAdd(area)} aria-label={'Adicionar tarefa em '+area}><Plus size={17}/>Tarefa</button><button onClick={()=>onOpen(area)} aria-label={'Ver assuntos de '+area}>Ver<ChevronRight size={16}/></button></div></article>;
 })}</div></section>;
}
