-- Private, invitation-only collaboration scoped to named spaces.
alter table public.members add column if not exists allowed_areas text[] not null default '{}';
alter table public.members add column if not exists active boolean not null default true;
alter table public.members add column if not exists invite_status text not null default 'none';
alter table public.members add column if not exists invited_at timestamptz;
alter table public.members add column if not exists access_version integer not null default 1;
alter table public.members add constraint members_allowed_areas_check check(allowed_areas <@ array['Limpeza da casa','Quinta · Arruda','Lavandaria','Arroios de Paixão — Quarto','Arroios de Paixão — Duplex','Alfama de Paixão']::text[]);
create or replace function public.ced_manage_employee(p_actor text,p_email text,p_name text,p_areas text[],p_active boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare old_member public.members;
begin
 if not exists(select 1 from public.members where email=p_actor and role='admin' and active) then raise exception 'Admin required'; end if;
 if p_email=coalesce((select value from public.settings where key='owner'),'') then return jsonb_build_object('error','O acesso da proprietária não pode ser alterado.'); end if;
 -- Serialize edits for the same invitation, including its initial creation.
 perform pg_advisory_xact_lock(hashtextextended(p_email,0));
 select * into old_member from public.members where email=p_email for update;
 if old_member.role='admin' then return jsonb_build_object('error','Esta pessoa já tem acesso de gestão.'); end if;
 if old_member.email is not null and old_member.name<>p_name then return jsonb_build_object('error','Mantém o nome usado nas tarefas desta pessoa.'); end if;
 if exists(select 1 from public.members where lower(name)=lower(p_name) and email<>p_email) then return jsonb_build_object('error','Usa um nome diferente para distinguir esta pessoa.'); end if;
 if cardinality(p_areas)<1 or cardinality(p_areas)>6 or length(p_name)<2 then raise exception 'Invalid collaboration'; end if;
 insert into public.members(email,name,role,allowed_areas,active) values(p_email,p_name,'employee',p_areas,p_active)
 on conflict(email) do update set allowed_areas=excluded.allowed_areas,active=excluded.active,
 access_version=public.members.access_version+case when public.members.allowed_areas is distinct from excluded.allowed_areas or public.members.active is distinct from excluded.active then 1 else 0 end;
 if not p_active then update public.push_subscriptions set enabled=false,updated_at=now() where member_email=p_email; end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.ced_manage_employee(text,text,text,text[],boolean) from public,anon,authenticated;
grant execute on function public.ced_manage_employee(text,text,text,text[],boolean) to service_role;

create table public.family_events(id text primary key,data jsonb not null check(jsonb_typeof(data)='object'),version integer not null default 1 check(version>0),created_by text not null,updated_at timestamptz not null default now());
alter table public.family_events enable row level security;
revoke all on public.family_events from public,anon,authenticated;
grant all on public.family_events to service_role;
-- No browser policy: the server requires a verified family administrator on every request.

create or replace function public.ced_plan_cleaning(p_stay_id text,p_version integer,p_actor_email text,p_tasks jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.records; actor_name text; task jsonb; task_id text; ids jsonb:='[]';
begin
 select name into actor_name from public.members where email=p_actor_email and role='admin' and active;
 if actor_name is null then raise exception 'Admin required'; end if;
 select * into s from public.records where id=p_stay_id and kind='stay' for update;
 if s.id is null or s.version<>p_version or s.data->>'status' in ('Concluído','Cancelado') or coalesce(s.data->>'deletedAt','')<>'' then return jsonb_build_object('conflict',true); end if;
 if jsonb_typeof(p_tasks)<>'array' or jsonb_array_length(p_tasks) not between 1 and 8 then raise exception 'Invalid tasks'; end if;
 for task in select value from jsonb_array_elements(p_tasks) loop
  if task->>'stayId' is distinct from s.id or task->>'area' is distinct from s.data->>'area' or coalesce(task->>'cleaningTemplateId','')=''
   or not exists(select 1 from public.members where name=task->>'assignee' and active and (role='admin' or (task->>'area')=any(allowed_areas))) then raise exception 'Invalid task'; end if;
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


create or replace function public.ced_claim_push(p_id text,p_event text) returns boolean language plpgsql security invoker set search_path='' as $$
declare claimed text;
begin
 insert into public.push_deliveries(subscription_id,event_key,status) values(p_id,p_event,'sending')
 on conflict(subscription_id,event_key) do update set status='sending',attempts=public.push_deliveries.attempts+1,attempted_at=now()
 where public.push_deliveries.status<>'sent' and public.push_deliveries.attempted_at<now()-(case when p_event like 'family-%' then interval '4 minutes' else interval '14 minutes' end) and public.push_deliveries.attempts<4
 returning subscription_id into claimed;
 return claimed is not null;
end $$;

revoke all on function public.ced_claim_push(text,text) from public,anon,authenticated;
grant execute on function public.ced_claim_push(text,text) to service_role;
