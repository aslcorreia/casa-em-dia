'use client';
import {CheckCircle2,ChevronRight,X} from 'lucide-react';
import {Item,isOpen} from '@/lib/model';
export default function RecentTask({item,open,dismiss}:{item?:Item;open:(item:Item)=>void;dismiss:()=>void}){
 if(!item||item.kind!=='task'||!isOpen(item))return null;
 return <section className="recent-task" aria-label="Tarefa acabada de guardar">
  <CheckCircle2 size={23}/><button className="recent-task-open" onClick={()=>open(item)}><small>Guardada · {item.data.area}</small><strong>{item.data.title}</strong><span>{item.data.assignee}{item.data.due?' · '+new Date(item.data.due+'T12:00:00').toLocaleDateString('pt-PT'):' · Sem prazo'}</span></button>
  <button className="iconbutton" aria-label="Abrir tarefa guardada" onClick={()=>open(item)}><ChevronRight size={20}/></button><button className="iconbutton" aria-label="Fechar confirmação de tarefa guardada" onClick={dismiss}><X size={18}/></button>
 </section>;
}
