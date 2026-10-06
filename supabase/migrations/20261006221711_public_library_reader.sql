-- Only title, cover and status are published. Library notes/progress/score stay private.
create function profile_access.read_library(p_username text, p_status text default null, p_page integer default 1)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with visible as (
    select p.id, p.username, p.profile_visibility,
      coalesce(p.auth_user_id = auth.uid(), false) as is_owner
    from public.profiles p
    where p.username operator(public.=) p_username::public.citext
      and char_length(p_username) between 3 and 30
      and (p.profile_visibility = 'public' or (auth.uid() is not null and p.auth_user_id = auth.uid()))
      and (p_status is null or p_status in ('watching', 'planned', 'paused', 'completed', 'dropped'))
      and p_page between 1 and 1000000
  ), entries as materialized (
    select a.anilist_id,
      coalesce(nullif(a.title_romaji, ''), nullif(a.title_english, ''), nullif(a.title_native, ''), 'Anime sem título') as title,
      a.cover_image, u.status
    from visible p join public.user_anime u on u.profile_id = p.id
    join public.anime a on a.id = u.anime_id
  ), totals as (
    select count(*) as total,
      count(*) filter (where status = 'watching') as watching,
      count(*) filter (where status = 'planned') as planned,
      count(*) filter (where status = 'paused') as paused,
      count(*) filter (where status = 'completed') as completed,
      count(*) filter (where status = 'dropped') as dropped,
      count(*) filter (where p_status is null or status = p_status) as filtered
    from entries
  ), paging as (
    select *, least(p_page, greatest((filtered + 23) / 24, 1)) as page from totals
  )
  select jsonb_build_object(
    'username', p.username, 'profile_visibility', p.profile_visibility, 'is_owner', p.is_owner,
    'counts', jsonb_build_object('total', t.total, 'watching', t.watching, 'planned', t.planned,
      'paused', t.paused, 'completed', t.completed, 'dropped', t.dropped),
    'page', t.page, 'page_size', 24, 'total_items', t.filtered,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('anilist_id', entry_page.anilist_id, 'title', entry_page.title,
        'cover_image', entry_page.cover_image, 'status', entry_page.status) order by entry_page.title, entry_page.anilist_id)
      from (
        select e.* from entries e where p_status is null or e.status = p_status
        order by e.title, e.anilist_id limit 24 offset (t.page - 1) * 24
      ) entry_page
    ), '[]'::jsonb)
  ) from visible p cross join paging t;
$$;
revoke all on function profile_access.read_library(text, text, integer) from public, anon, authenticated;
grant execute on function profile_access.read_library(text, text, integer) to anon, authenticated, service_role;

create function public.read_public_library(p_username text, p_status text default null, p_page integer default 1)
returns jsonb
language sql stable security invoker set search_path = ''
as $$ select profile_access.read_library(p_username, p_status, p_page); $$;
revoke all on function public.read_public_library(text, text, integer) from public, anon, authenticated;
grant execute on function public.read_public_library(text, text, integer) to anon, authenticated, service_role;
