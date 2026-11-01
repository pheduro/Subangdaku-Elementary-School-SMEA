-- smea2_save: save a teacher's reports for one period.
--
-- Change (safer deletes): the page now sends an explicit list of the reports the
-- teacher removed, in p_payload->'removed' as [{"area": "...", "section": "..."}].
-- Only those reports are deleted. Reports that are not in the payload are kept, so
-- a page that loaded late, loaded stale data or failed to load cannot wipe a
-- teacher's other entries.
--
-- Backward compatible: an older page that does not send 'removed' gets the previous
-- behaviour (everything not in the payload is deleted).

create or replace function public.smea2_save(p_id uuid, p_pin text, p_period uuid, p_payload jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare v record; per record; r jsonb; l jsonb; d jsonb; rid uuid; n int := 0; keep uuid[] := '{}';
begin
  select * into v from smea_verify_teacher(p_id, p_pin);
  if v.err is not null then return jsonb_build_object('ok', false, 'error', v.err); end if;
  select * into per from smea_periods where id = p_period;
  if per.id is null then return jsonb_build_object('ok', false, 'error', 'no_period'); end if;
  if not per.is_open then return jsonb_build_object('ok', false, 'error', 'period_closed'); end if;
  begin
    if jsonb_array_length(coalesce(p_payload->'reports','[]'::jsonb)) > 60 then raise exception 'Too many reports'; end if;
    for r in select value from jsonb_array_elements(coalesce(p_payload->'reports','[]'::jsonb)) loop
      if not exists (select 1 from smea2_areas where grade = v.t_grade and area = r->>'area') then raise exception 'Unknown learning area'; end if;
      if nullif(trim(coalesce(r->>'section','')),'') is null or length(r->>'section') > 40 then raise exception 'Section name required (max 40 characters)'; end if;
      insert into smea2_reports(period_id, teacher_id, area, section, ww_m, ww_f, pt_m, pt_f, st1_m, st1_f, st2_m, st2_f, te_m, te_f, remarks, updated_at)
      values (p_period, v.t_id, r->>'area', trim(r->>'section'),
        smea2_num(r->>'ww_m'), smea2_num(r->>'ww_f'), smea2_num(r->>'pt_m'), smea2_num(r->>'pt_f'),
        smea2_num(r->>'st1_m'), smea2_num(r->>'st1_f'), smea2_num(r->>'st2_m'), smea2_num(r->>'st2_f'),
        smea2_num(r->>'te_m'), smea2_num(r->>'te_f'), left(nullif(trim(coalesce(r->>'remarks','')),''), 500), now())
      on conflict (period_id, teacher_id, area, section) do update set
        ww_m=excluded.ww_m, ww_f=excluded.ww_f, pt_m=excluded.pt_m, pt_f=excluded.pt_f,
        st1_m=excluded.st1_m, st1_f=excluded.st1_f, st2_m=excluded.st2_m, st2_f=excluded.st2_f,
        te_m=excluded.te_m, te_f=excluded.te_f, remarks=excluded.remarks, updated_at=now()
      returning id into rid;
      keep := keep || rid;
      delete from smea2_llc where report_id = rid;
      for l in select value from jsonb_array_elements(coalesce(r->'llc','[]'::jsonb)) loop
        continue when nullif(trim(coalesce(l->>'competency','')),'') is null;
        insert into smea2_llc(report_id, assess, rank, competency, intervention, timeline, status)
        values (rid, l->>'assess', (l->>'rank')::int, left(trim(l->>'competency'),600),
          left(nullif(trim(coalesce(l->>'intervention','')),''),300), left(nullif(trim(coalesce(l->>'timeline','')),''),100), left(nullif(trim(coalesce(l->>'status','')),''),50));
      end loop;
      n := n + 1;
    end loop;
    if jsonb_typeof(p_payload->'removed') = 'array' then
      if jsonb_array_length(p_payload->'removed') > 60 then raise exception 'Too many removals'; end if;
      for d in select value from jsonb_array_elements(p_payload->'removed') loop
        delete from smea2_reports
         where period_id = p_period and teacher_id = v.t_id
           and area = d->>'area' and section = trim(coalesce(d->>'section',''))
           and not (id = any(keep));
      end loop;
    else
      delete from smea2_reports where period_id = p_period and teacher_id = v.t_id and not (id = any(keep));
    end if;
  exception when others then
    return jsonb_build_object('ok', false, 'error', 'invalid_data', 'detail', sqlerrm);
  end;
  return jsonb_build_object('ok', true, 'saved', n);
end $function$;
