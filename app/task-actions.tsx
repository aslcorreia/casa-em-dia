'use client';
import {Check,Trash2} from 'lucide-react';
import {Item,isOpen} from '@/lib/model';

export default function TaskActions({item,busy,onDone,onDelete}:{item:Item;busy:boolean;onDone:(item:Item)=>void;onDelete?:(item:Item)=>void}){
 if(item.kind!=='task')return null;
 return <div className="task-actions" aria-label={'Ações de '+item.data.title}>
  {isOpen(item)&&<button type="button" className="done-button" disabled={busy} onClick={()=>onDone(item)} aria-label={'Marcar como feita: '+item.data.title}><Check size={17}/>Feita</button>}
  {onDelete&&<button type="button" className="delete-button" disabled={busy} onClick={()=>onDelete(item)} aria-label={'Apagar tarefa: '+item.data.title}><Trash2 size={16}/><span>Apagar</span></button>}
 </div>;
}
