import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';import assert from 'node:assert/strict';
const handlers={},notices=[],opened=[];
const self={addEventListener:(type,fn)=>handlers[type]=fn,location:{origin:'https://app.test'},registration:{showNotification:async(title,data)=>notices.push({title,...data})},clients:{matchAll:async()=>[],openWindow:async url=>opened.push(url)}};
runInNewContext(readFileSync('public/sw.js','utf8'),{self,URL});
async function fire(type,event){let pending;handlers[type]({...event,waitUntil:p=>pending=p});await pending;}
await fire('push',{data:{json:()=>({body:'Sair às 16:35',tag:'family-example-2026-10-08-levar-123',url:'/?view=family'})}});assert.equal(notices[0].data.url,'/?view=family');assert.equal(notices[0].tag,'family-example-2026-10-08-levar-123');await fire('notificationclick',{notification:{...notices[0],close(){}}});assert.equal(opened[0],'https://app.test/?view=family');
await fire('push',{data:{json:()=>({body:'Unsafe route',tag:'https://evil.test',url:'https://evil.test'})}});assert.equal(notices[1].data.url,'/?view=notifications');await fire('notificationclick',{notification:{data:{url:'https://evil.test'},close(){}}});assert.equal(opened[1],'https://app.test/?view=notifications');console.log('PASS: family push opens family agenda, preserves occurrence tags and refuses external notification links.');
