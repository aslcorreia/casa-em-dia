-- Apply only after deploying the backwards-compatible model. Idempotent.
with names(mapping) as (
  values ('{"Alojamento 1":"Arroios de Paixão — Quarto","Alojamento 2":"Arroios de Paixão — Duplex","Alojamento 3":"Alfama de Paixão"}'::jsonb)
), selected as materialized (
  select r.id,r.data,r.version from public.records r cross join names n
  where n.mapping ? (r.data->>'area')
     or r.data->'serviceAreas' ?| array['Alojamento 1','Alojamento 2','Alojamento 3']
  for update of r
), changed as (
  update public.records r
  set data=s.data
    || case when n.mapping ? (s.data->>'area')
       then jsonb_build_object('area',n.mapping->(s.data->>'area')) else '{}'::jsonb end
    || case when s.data->'serviceAreas' ?| array['Alojamento 1','Alojamento 2','Alojamento 3']
       then jsonb_build_object('serviceAreas',(
         select jsonb_agg(coalesce(n.mapping->(value #>> '{}'),value) order by ordinal)
         from jsonb_array_elements(s.data->'serviceAreas') with ordinality as a(value,ordinal)
       )) else '{}'::jsonb end,
    version=s.version+1,updated_at=now()
  from selected s cross join names n where r.id=s.id
  returning r.id,r.data,r.version
), logged as (
  insert into public.audit(id,record_id,actor,action,at)
  select gen_random_uuid()::text,id,'Casa em Dia · atualização dos espaços',
    'Nomes dos alojamentos atualizados: Arroios — Quarto, Arroios — Duplex e Alfama',now()
  from changed returning record_id
)
select count(*) as renamed,
  bool_and(c.data-'area'-'serviceAreas'=s.data-'area'-'serviceAreas') as other_fields_preserved,
  bool_and(c.version=s.version+1) as versions_incremented,
  (select count(*) from logged) as audit_entries
from changed c join selected s using(id);
