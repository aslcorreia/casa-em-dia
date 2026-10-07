begin;
-- Run inside BEGIN / ROLLBACK, after the migration. No fixtures persist.
do $$
declare actor_email text; s text:='ced-test-stay'; response jsonb; a text; b text; v integer; d jsonb;
begin
 select email into actor_email from public.members where role='admin' limit 1;
 insert into public.records(id,kind,data,created_by,updated_at,version) values(s,'stay',jsonb_build_object('title','Teste isolado','area','Arroios de Paixão — Quarto','due','2026-10-20','checkout','2026-10-22','status','Por fazer','cleaning','Por marcar'),actor_email,now(),1);
 d:=jsonb_build_object('title','Limpeza de teste','area','Arroios de Paixão — Quarto','stayId',s,'due','2026-10-20','repeat','Não repetir','assignee',(select name from public.members where email=actor_email),'status','Por fazer');
 response:=public.ced_plan_cleaning(s,1,actor_email,jsonb_build_array(d||'{"cleaningTemplateId":"test-room"}',d||'{"cleaningTemplateId":"test-bath"}'));
 a:=response->'ids'->>0;b:=response->'ids'->>1;
 if a is null or b is null or (select data->>'cleaning' from public.records where id=s)<>'Marcada' then raise exception 'Plan failed'; end if;
 if not (public.ced_plan_cleaning(s,1,actor_email,jsonb_build_array(d||'{"cleaningTemplateId":"test-room"}'))->>'conflict')::boolean then raise exception 'Missing version conflict'; end if;
 select version into v from public.records where id=s;
 response:=public.ced_plan_cleaning(s,v,actor_email,jsonb_build_array(d||'{"cleaningTemplateId":"test-room"}'));
 if jsonb_array_length(response->'ids')<>0 then raise exception 'Duplicate plan'; end if;
 update public.records set data=data||'{"status":"Concluído"}',version=version+1 where id=a;
 if (select data->>'cleaning' from public.records where id=s)<>'Marcada' then raise exception 'Partial completion incorrectly marked ready'; end if;
 update public.records set data=data||'{"status":"Concluído"}',version=version+1 where id=b;
 if (select data->>'cleaning' from public.records where id=s)<>'Concluída' then raise exception 'Completion failed'; end if;
 update public.records set data=data||'{"status":"Por fazer"}',version=version+1 where id=b;
 if (select data->>'cleaning' from public.records where id=s)<>'Marcada' then raise exception 'Reopen failed'; end if;
 update public.records set data=data||'{"due":"2026-10-19"}',version=version+1 where id=s;
 if (select data->>'due' from public.records where id=b)<>'2026-10-19' then raise exception 'Date shift failed'; end if;
 update public.records set data=data||'{"deletedAt":"2026-10-07T20:00:00Z"}' where id=b;
 -- Completed cleaning can be archived even if the stay dates have since changed.
 update public.records set data=data||'{"due":"2026-10-20"}',version=version+1 where id=s;
 update public.records set data=data||'{"deletedAt":"2026-10-07T20:00:00Z"}' where id=a;
 if (select data->>'cleaning' from public.records where id=s)<>'Por marcar' then raise exception 'Deleting all must require cleaning'; end if;
 update public.records set data=data||'{"deletedAt":""}' where id=b;
 if (select data->>'cleaning' from public.records where id=s)<>'Marcada' then raise exception 'Restore failed'; end if;
 if has_table_privilege('anon','public.push_config','SELECT') or has_table_privilege('authenticated','public.push_subscriptions','SELECT') or has_function_privilege('authenticated','public.ced_claim_push(text,text)','EXECUTE') then raise exception 'Push data exposed'; end if;
 insert into public.push_subscriptions(id,member_email,subscription) values('ced-test-device',actor_email,'{}');
 if not public.ced_claim_push('ced-test-device','test') or public.ced_claim_push('ced-test-device','test') then raise exception 'Duplicate push claim'; end if;
 update public.push_deliveries set status='failed',attempted_at=now()-interval '16 minutes' where subscription_id='ced-test-device';
 if not public.ced_claim_push('ced-test-device','test') then raise exception 'Retry claim failed'; end if;
 update public.push_deliveries set status='sent',attempted_at=now()-interval '16 minutes' where subscription_id='ced-test-device';
 if public.ced_claim_push('ced-test-device','test') then raise exception 'Resent delivery'; end if;
end $$;
select 'PASS: atomic cleaning plan, deduplication, version conflict, partial/all completion, reopening, date shift, trash/restore, push access and delivery claims' as verification;

rollback;
