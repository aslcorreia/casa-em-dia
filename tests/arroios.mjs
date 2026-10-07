import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {build}=require(require.resolve('esbuild',{paths:[require.resolve('wrangler')]}));
mkdirSync('.runtime-tests',{recursive:true});
await build({stdin:{contents:"export * from './lib/model';export * from './lib/entry-templates';export {EntrySuggestions} from './app/entry-templates';export {proposalData} from './lib/assistant-ai';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom','react-dom/server'],outfile:'.runtime-tests/arroios.cjs'});
const {ARROIOS,areas,lodgingAreas,isLodgingArea,recordSchema,entryTemplates,templatesFor,templateDraft,EntrySuggestions,proposalData}=require('../.runtime-tests/arroios.cjs');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const base=recordSchema.parse({title:'Base de teste',area:'Casa',assignee:'Pessoa de teste'});
const old=recordSchema.parse({...base,area:'Alojamento 1',serviceAreas:['Alojamento 1','Alojamento 2']});
assert.equal(old.area,ARROIOS);assert.deepEqual(old.serviceAreas,[ARROIOS,'Alojamento 2']);
assert.equal(areas.length,7);assert.equal(lodgingAreas.length,3);
assert(!areas.includes('Alojamento 1'));assert(isLodgingArea(ARROIOS));assert(!isLodgingArea('Casa'));
const local=templatesFor(ARROIOS,'task',true);
assert(local.slice(0,4).every(t=>t.scope===ARROIOS));
assert(!local.some(t=>t.id==='al-turnover'));
assert(!templatesFor('Alojamento 2','all',true).some(t=>t.scope===ARROIOS));
assert(templatesFor('Alojamento 3','task',true).some(t=>t.id==='al-turnover'));
assert.equal(new Set(entryTemplates.map(t=>t.id)).size,entryTemplates.length);
for(const t of entryTemplates){
 const draft=templateDraft(t,base,'Todas as áreas');
 recordSchema.parse({...draft,title:draft.title||'Nome de teste'});
 assert.equal(draft.assignee,base.assignee);assert.equal(draft.due,'');
 assert(draft.steps.every(s=>!s.done));
 if(t.scope===ARROIOS){assert.equal(draft.area,ARROIOS);assert.equal(draft.repeat,'Não repetir');}
 if(t.kind==='stay')assert(isLodgingArea(draft.area));
 if(t.excludeAreas)assert(!t.excludeAreas.includes(draft.area));
}
const html=renderToStaticMarkup(React.createElement(EntrySuggestions,{area:ARROIOS,kind:'all',admin:false,onChoose:()=>{},onAll:()=>{}}));
assert.match(html,/Cama de casal/);assert.match(html,/Casa de banho/);
assert.equal((html.match(/class="entry-template"/g)||[]).length,4);
assert.match(html,/Revisão antes da chegada/);
const proposal=proposalData({type:'createTask',title:'Tarefa antiga',area:'Alojamento 1',assignee:base.assignee,due:'',nextStep:'',steps:[]});
assert.equal(proposal.area,ARROIOS);
console.log('PASS: renamed area and legacy associations; 44 valid templates; local cleaning scope; 4 visible cleaner shortcuts; old AI proposals remain usable.');
