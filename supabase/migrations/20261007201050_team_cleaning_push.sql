-- Additive migration: existing records and access rules are preserved.
create index if not exists records_linked_stay_idx on public.records ((data->>'stayId')) where kind='task';
create unique index if not exists records_cleaning_template_idx on public.records ((data->>'stayId'),(data->>'cleaningTemplateId'))
 where kind='task' and coalesce(data->>'stayId','')<>'' and coalesce(data->>'cleaningTemplateId','')<>'' and coalesce(data->>'deletedAt','')='' and coalesce(data->>'status','')<>'Cancelado';

create or replace function public.ced_cleaning_guard() returns trigger language plpgsql security invoker set search_path='' as $$
declare s public.records; old_link text; new_link text; total integer; done_count integer;
begin
 if new.kind='task' then
  old_link:=case when tg_op='UPDATE' then nullif(old.data->>'stayId','') end;
  new_link:=nullif(new.data->>'stayId','');
  -- Serialize simultaneous task changes on their parent stay, in a stable order.
  perform 1 from public.records where id in (old_link,new_link) order by id for update;
  if new_link is not null then
   select * into s from public.records where id=new_link;
   if s.id is null or s.kind<>'stay' or s.data->>'area' is distinct from new.data->>'area'
    or coalesce(new.data->>'due','')='' or (new.data->>'due'>s.data->>'due' and coalesce(new.data->>'deletedAt','')='' and not (tg_op='UPDATE' and old_link=new_link and old.data->>'status'='Concluído' and new.data->>'status'='Concluído' and old.data->>'due'=new.data->>'due'))
    or new.data->>'repeat' is distinct from 'Não repetir' then raise exception 'Invalid cleaning link'; end if;
  end if;
 elsif new.kind='stay' and coalesce((new.data->>'cleaningManaged')::boolean,false) then
  if tg_op='UPDATE' and new.data->>'area' is distinct from old.data->>'area'
   and exists(select 1 from public.records where kind='task' and data->>'stayId'=new.id) then
   raise exception 'A stay with linked cleaning cannot change property';
  end if;
  select count(*),count(*) filter(where data->>'status'='Concluído') into total,done_count from public.records
   where kind='task' and data->>'stayId'=new.id and coalesce(data->>'deletedAt','')='' and data->>'status'<>'Cancelado';
  new.data:=jsonb_set(new.data,'{cleaning}',to_jsonb(case when total=0 then 'Por marcar' when total=done_count then 'Concluída' else 'Marcada' end));
 end if;
 return new;
end $$;
create or replace function public.ced_cleaning_sync() returns trigger language plpgsql security invoker set search_path='' as $$
declare linked text; old_link text; s public.records; total integer; done_count integer; state text; event_at timestamptz:=clock_timestamp();
begin
 if new.kind='task' then
  old_link:=case when tg_op='UPDATE' then nullif(old.data->>'stayId','') end;
  for linked in select distinct x from unnest(array[old_link,nullif(new.data->>'stayId','')]) x where x is not null loop
   select * into s from public.records where id=linked for update;
   select count(*),count(*) filter(where data->>'status'='Concluído') into total,done_count from public.records
    where kind='task' and data->>'stayId'=linked and coalesce(data->>'deletedAt','')='' and data->>'status'<>'Cancelado';
   state:=case when total=0 then 'Por marcar' when total=done_count then 'Concluída' else 'Marcada' end;
   if s.data->>'cleaning' is distinct from state or s.data->>'cleaningManaged' is distinct from 'true' then
    update public.records set data=data||jsonb_build_object('cleaning',state,'cleaningManaged',true),version=version+1,updated_at=event_at where id=linked;
    insert into public.audit(id,record_id,actor,action,at) values(gen_random_uuid()::text,linked,'Casa em Dia','Limpezas ligadas · '||state,event_at);
   end if;
  end loop;
 elsif new.kind='stay' and tg_op='UPDATE' and new.data->>'due' is distinct from old.data->>'due' then
  update public.records set data=jsonb_set(data,'{due}',to_jsonb(((data->>'due')::date+((new.data->>'due')::date-(old.data->>'due')::date))::text)),updated_at=event_at,version=version+1
   where kind='task' and data->>'stayId'=new.id and coalesce(data->>'deletedAt','')='' and data->>'status' not in ('Concluído','Cancelado');
 end if;
 return new;
end $$;
drop trigger if exists ced_cleaning_guard on public.records;
create trigger ced_cleaning_guard before insert or update on public.records for each row execute function public.ced_cleaning_guard();
drop trigger if exists ced_cleaning_sync on public.records;
create trigger ced_cleaning_sync after insert or update on public.records for each row execute function public.ced_cleaning_sync();
revoke all on function public.ced_cleaning_guard(),public.ced_cleaning_sync() from public,anon,authenticated;

create or replace function public.ced_plan_cleaning(p_stay_id text,p_version integer,p_actor_email text,p_tasks jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.records; actor_name text; task jsonb; task_id text; ids jsonb:='[]';
begin
 select name into actor_name from public.members where email=p_actor_email and role='admin';
 if actor_name is null then raise exception 'Admin required'; end if;
 select * into s from public.records where id=p_stay_id and kind='stay' for update;
 if s.id is null or s.version<>p_version or s.data->>'status' in ('Concluído','Cancelado') or coalesce(s.data->>'deletedAt','')<>'' then return jsonb_build_object('conflict',true); end if;
 if jsonb_typeof(p_tasks)<>'array' or jsonb_array_length(p_tasks) not between 1 and 8 then raise exception 'Invalid tasks'; end if;
 for task in select value from jsonb_array_elements(p_tasks) loop
  if task->>'stayId' is distinct from s.id or task->>'area' is distinct from s.data->>'area' or coalesce(task->>'cleaningTemplateId','')=''
   or not exists(select 1 from public.members where name=task->>'assignee') then raise exception 'Invalid task'; end if;
  if exists(select 1 from public.records where kind='task' and data->>'stayId'=s.id and data->>'cleaningTemplateId'=task->>'cleaningTemplateId' and coalesce(data->>'deletedAt','')='' and data->>'status'<>'Cancelado') then continue; end if;
  task_id:=gen_random_uuid()::text;
  insert into public.records(id,kind,data,created_by,updated_at,version) values(task_id,'task',task,p_actor_email,now(),1);
  insert into public.audit(id,record_id,actor,action,at) values(gen_random_uuid()::text,task_id,actor_name,'Limpeza criada a partir da estadia',now());
  ids:=ids||jsonb_build_array(task_id);
 end loop;
 return jsonb_build_object('ids',ids);
end $$;
revoke all on function public.ced_plan_cleaning(text,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.ced_plan_cleaning(text,integer,text,jsonb) to service_role;

create table if not exists public.push_config (id boolean primary key default true check(id),public_key text not null,private_key text not null);
create table if not exists public.push_subscriptions (
 id text primary key,member_email text not null references public.members(email) on delete cascade,
 subscription jsonb not null,enabled boolean not null default true,updated_at timestamptz not null default now());
create index if not exists push_subscriptions_member_idx on public.push_subscriptions(member_email);
create table if not exists public.push_deliveries (
 subscription_id text not null references public.push_subscriptions(id) on delete cascade,
 event_key text not null,status text not null check(status in ('sending','sent','failed')),attempts integer not null default 1,
 attempted_at timestamptz not null default now(),sent_at timestamptz,primary key(subscription_id,event_key));
alter table public.push_config enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_deliveries enable row level security;
revoke all on public.push_config,public.push_subscriptions,public.push_deliveries from public,anon,authenticated;
grant all on public.push_config,public.push_subscriptions,public.push_deliveries to service_role;
-- No browser policies: all use requires Auth + membership in server routes.
create or replace function public.ced_push_config(p_public text,p_private text) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 insert into public.push_config(id,public_key,private_key) values(true,p_public,p_private) on conflict do nothing;
 return (select to_jsonb(c) from public.push_config c where id);
end $$;
create or replace function public.ced_claim_push(p_id text,p_event text) returns boolean language plpgsql security invoker set search_path='' as $$
declare claimed text;
begin
 insert into public.push_deliveries(subscription_id,event_key,status) values(p_id,p_event,'sending')
 on conflict(subscription_id,event_key) do update set status='sending',attempts=public.push_deliveries.attempts+1,attempted_at=now()
 where public.push_deliveries.status<>'sent' and public.push_deliveries.attempted_at<now()-interval '14 minutes' and public.push_deliveries.attempts<4
 returning subscription_id into claimed;
 return claimed is not null;
end $$;
revoke all on function public.ced_push_config(text,text),public.ced_claim_push(text,text) from public,anon,authenticated;
grant execute on function public.ced_push_config(text,text),public.ced_claim_push(text,text) to service_role;
