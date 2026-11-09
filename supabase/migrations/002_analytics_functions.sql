-- Aggregation helpers for the analytics dashboard (PostgREST caps responses at 1000 rows,
-- so counting is done in SQL, not in the API).

-- One row per local day in the range, zero-filled. p_tz_offset = JS getTimezoneOffset() (minutes behind UTC).
create or replace function public.analytics_daily(p_profile uuid, p_days int, p_tz_offset int default 0)
returns table(day date, views bigint, clicks bigint)
language sql stable as $$
  with days as (
    select generate_series(
      (((now() at time zone 'utc') - make_interval(mins => p_tz_offset))::date - (p_days - 1)),
      (((now() at time zone 'utc') - make_interval(mins => p_tz_offset))::date),
      interval '1 day')::date as day
  )
  select d.day,
         count(a.id) filter (where a.event_type = 'view'),
         count(a.id) filter (where a.event_type = 'click')
  from days d
  left join public.analytics a
    on a.profile_id = p_profile
   and (((a.created_at at time zone 'utc') - make_interval(mins => p_tz_offset))::date) = d.day
  group by d.day
  order by d.day;
$$;

-- Every link of the profile with its click count (zero included), most clicked first.
create or replace function public.analytics_top_links(p_profile uuid, p_days int default null)
returns table(link_id uuid, title text, url text, clicks bigint, last_click timestamptz)
language sql stable as $$
  select l.id, l.title, l.url, count(a.id), max(a.created_at)
  from public.links l
  left join public.analytics a
    on a.link_id = l.id and a.event_type = 'click'
   and (p_days is null or a.created_at >= now() - make_interval(days => p_days))
  where l.profile_id = p_profile
  group by l.id
  order by count(a.id) desc, l.display_order;
$$;

-- Only the API (service role) should call these.
revoke execute on function public.analytics_daily(uuid, int, int) from public, anon, authenticated;
revoke execute on function public.analytics_top_links(uuid, int) from public, anon, authenticated;
grant execute on function public.analytics_daily(uuid, int, int) to service_role;
grant execute on function public.analytics_top_links(uuid, int) to service_role;
