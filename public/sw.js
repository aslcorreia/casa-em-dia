/* No offline cache: personal records always come from the authenticated server. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{};}catch{}
 event.waitUntil(self.registration.showNotification('Casa em Dia',{
  body:typeof data.body==='string'?data.body.slice(0,250):'Abre a app para rever os teus assuntos.',
  icon:'/app-icon-192.png',badge:'/app-icon-192.png',tag:typeof data.tag==='string'&&/^family-[A-Za-z0-9-]{1,180}$/.test(data.tag)?data.tag:data.tag==='ced-test'?'ced-test':'ced-daily',
  data:{url:data.url==='/?view=family'?'/?view=family':'/?view=notifications'},
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const target=new URL(event.notification.data?.url==='/?view=family'?'/?view=family':'/?view=notifications',self.location.origin).href;
  for(const client of windows){if(new URL(client.url).origin===self.location.origin){await client.navigate(target);return client.focus();}}
  return self.clients.openWindow(target);
 })());
});
