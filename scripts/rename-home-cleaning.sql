-- Run after deploying the model alias for the old and new names.
-- Idempotent data update; preserves IDs, history and unrelated fields; increments versions.
with selected as materialized (
  select id, data, version from public.records
  where data->>'area'='Casa'
     or data->'serviceAreas' @> '["Casa"]'::jsonb
  for update
), changed as (
  update public.records r
  set data=s.data
    || case when s.data->>'area'='Casa'
       then jsonb_build_object('area','Limpeza da casa') else '{}'::jsonb end
    || case when s.data->'serviceAreas' @> '["Casa"]'::jsonb
       then jsonb_build_object('serviceAreas',(
         select jsonb_agg(case when value='"Casa"'::jsonb
           then to_jsonb('Limpeza da casa'::text) else value end order by ordinal)
         from jsonb_array_elements(s.data->'serviceAreas') with ordinality as a(value,ordinal)
       )) else '{}'::jsonb end,
    version=s.version+1, updated_at=now()
  from selected s where r.id=s.id
  returning r.id, r.data, r.version
), logged as (
  insert into public.audit(id,record_id,actor,action,at)
  select gen_random_uuid()::text,id,'Casa em Dia · atualização do espaço',
    'Área renomeada: Casa → Limpeza da casa',now()
  from changed returning record_id
)
select count(*) as renamed,
  bool_and(c.data-'area'-'serviceAreas'=s.data-'area'-'serviceAreas') as other_fields_preserved,
  bool_and(c.version=s.version+1) as versions_incremented,
  (select count(*) from logged) as audit_entries
from changed c join selected s using(id);
