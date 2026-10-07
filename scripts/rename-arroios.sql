-- Run after deploying the model alias for the old and new names.
-- Idempotent data update; preserves IDs, history, versions and unrelated fields.
with selected as materialized (
  select id, data, version from public.records
  where data->>'area'='Alojamento 1'
     or data->'serviceAreas' @> '["Alojamento 1"]'::jsonb
  for update
), changed as (
  update public.records r
  set data=s.data
    || case when s.data->>'area'='Alojamento 1'
       then jsonb_build_object('area','Arroios de Paixão — Quarto') else '{}'::jsonb end
    || case when s.data->'serviceAreas' @> '["Alojamento 1"]'::jsonb
       then jsonb_build_object('serviceAreas',(
         select jsonb_agg(case when value='"Alojamento 1"'::jsonb
           then to_jsonb('Arroios de Paixão — Quarto'::text) else value end order by ordinal)
         from jsonb_array_elements(s.data->'serviceAreas') with ordinality as a(value,ordinal)
       )) else '{}'::jsonb end,
    version=s.version+1, updated_at=now()
  from selected s where r.id=s.id
  returning r.id, r.data, r.version
), logged as (
  insert into public.audit(id,record_id,actor,action,at)
  select gen_random_uuid()::text,id,'Casa em Dia · atualização do espaço',
    'Área renomeada: Alojamento 1 → Arroios de Paixão — Quarto',now()
  from changed returning record_id
)
select count(*) as renamed,
  bool_and(c.data-'area'-'serviceAreas'=s.data-'area'-'serviceAreas') as other_fields_preserved,
  bool_and(c.version=s.version+1) as versions_incremented,
  (select count(*) from logged) as audit_entries
from changed c join selected s using(id);
