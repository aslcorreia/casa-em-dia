import {entryTemplates, templateDraft} from './entry-templates';
import {Data, Item, recordSchema} from './model';

export const cleaningTemplates = (area:string) => entryTemplates.filter(t =>
 t.scope === area && t.kind === 'task' && ['Limpeza · Entre hóspedes','Limpeza · Revisão final'].includes(t.category || ''));
export const linkedCleaning = (items:Item[], stayId:string) => items.filter(i =>
 i.kind === 'task' && i.data.stayId === stayId && !i.data.deletedAt && i.data.status !== 'Cancelado');
export function cleaningDrafts(stay:Item, assignee:string, due:string, time:string):Data[] {
 return cleaningTemplates(stay.data.area).map(t => ({
  ...templateDraft(t, recordSchema.parse({title:'Limpeza', area:stay.data.area}), stay.data.area),
  assignee, due, time, repeat:'Não repetir', stayId:stay.id, cleaningTemplateId:t.id,
  // No guest identity, contact details or access codes in employee-visible tasks.
  description:'Preparação para a entrada de '+stay.data.due+'.\n\n'+(t.description || ''),
 }));
}
