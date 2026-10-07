// Fixed application queries only. Never executes arbitrary SQL.
import {rest} from './server';
const eq=(x:unknown)=>encodeURIComponent(String(x));
const row=(r:any)=>r?.data&&typeof r.data==='object'?{...r,data:JSON.stringify(r.data)}:r;
export function database(){return {prepare(sql:string){return statement(sql);},async batch(statements:any[]){const out=[];for(const s of statements)out.push(await s.run());return out;}};}
function statement(sql:string){let args:any[]=[];const q=sql.replace(/\s+/g,' ').trim();async function execute(){const a=args;
if(q==='SELECT * FROM members WHERE email=?')return rest('members','GET','?email=eq.'+eq(a[0]));
if(q==='SELECT name,email,role FROM members')return rest('members','GET','?select=name,email,role,allowed_areas,active,invite_status,invited_at');
if(q==='SELECT email FROM members WHERE lower(name)=lower(?) AND email<>?')return (await rest('members')).filter((m:any)=>m.name.toLowerCase()===String(a[0]).toLowerCase()&&m.email!==a[1]);
if(q.startsWith('INSERT INTO members(email,name,role)'))return rest('members','POST','?on_conflict=email',{email:a[0],name:a[1],role:a[2]});
if(q==="SELECT value FROM settings WHERE key='owner'")return rest('settings','GET','?key=eq.owner');
if(q==='SELECT value FROM settings WHERE key=?')return rest('settings','GET','?key=eq.'+eq(a[0]));
if(q.startsWith('INSERT INTO settings(key,value)'))return rest('settings','POST','?on_conflict=key',{key:a[0],value:a[1]});
if(q==='SELECT * FROM records ORDER BY updated_at DESC LIMIT 2000'){const all=[];for(let offset=0;;offset+=500){const page=await rest('records','GET','?order=updated_at.desc,id.asc&limit=500&offset='+offset);all.push(...page);if(page.length<500)return all;}}
if(q==='SELECT * FROM records WHERE id=?')return rest('records','GET','?id=eq.'+eq(a[0]));
if(q==='UPDATE records SET data=?,updated_at=?,version=version+1 WHERE id=? AND version=?'){if(!Number.isInteger(a[3]))return [];return rest('records','PATCH','?id=eq.'+eq(a[2])+'&version=eq.'+eq(a[3]),{data:JSON.parse(a[0]),updated_at:a[1],version:a[3]+1});}
if(q==='INSERT INTO records(id,kind,data,created_by,updated_at,version) VALUES (?,?,?,?,?,1)')return rest('records','POST','',{id:a[0],kind:a[1],data:JSON.parse(a[2]),created_by:a[3],updated_at:a[4],version:1});
if(q==='SELECT * FROM files WHERE record_id=?')return rest('files','GET','?record_id=eq.'+eq(a[0]));
if(q==='SELECT * FROM files WHERE id=?')return rest('files','GET','?id=eq.'+eq(a[0]));
if(q==='INSERT INTO files(id,record_id,name,mime) VALUES (?,?,?,?)')return rest('files','POST','',{id:a[0],record_id:a[1],name:a[2],mime:a[3]});
if(q==='SELECT * FROM audit WHERE record_id=? ORDER BY at DESC LIMIT 50')return rest('audit','GET','?record_id=eq.'+eq(a[0])+'&order=at.desc&limit=50');
if(q==='INSERT INTO audit(id,record_id,actor,action,at) VALUES (?,?,?,?,?)')return rest('audit','POST','',{id:a[0],record_id:a[1],actor:a[2],action:a[3],at:a[4]});
throw new Error('Unsupported application query');}
return {bind(...v:any[]){args=v;return this;},async first<T=any>():Promise<T|null>{return row((await execute())[0])||null;},async all<T=any>():Promise<{results:T[]}>{return {results:(await execute()).map(row)};},async run(){const r=await execute();return {meta:{changes:r.length}};}};
}
