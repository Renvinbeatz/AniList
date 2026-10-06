-- The public API receives a curated snapshot, never raw profile rows.
-- RLS stays enabled; direct table access is removed from API roles.
revoke all on public.profiles, public.profile_favorites, public.profile_pinned_anime,
  public.user_anime from anon, authenticated;

create schema if not exists profile_access;
revoke all on schema profile_access from public;
grant usage on schema profile_access to anon, authenticated, service_role;

create function profile_access.read_profile(p_username text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'username', p.username,
    'display_name', p.display_name,
    'bio', p.bio,
    'banner_url', p.banner_url,
    'avatar_preset', p.avatar_preset,
    'favorite_character_anilist_id', p.favorite_character_anilist_id,
    'profile_visibility', p.profile_visibility,
    'is_owner', coalesce(p.auth_user_id = auth.uid(), false),
    'collections', jsonb_build_object(
      'favorites', coalesce((
        select jsonb_agg(jsonb_build_object(
          'anime_id', a.id, 'position', f.position,
          'anime', jsonb_build_object('id', a.id, 'anilist_id', a.anilist_id,
            'title_romaji', a.title_romaji, 'title_english', a.title_english,
            'title_native', a.title_native, 'cover_image', a.cover_image)
        ) order by f.position)
        from public.profile_favorites f join public.anime a on a.id = f.anime_id
        where f.profile_id = p.id
      ), '[]'::jsonb),
      'pinned', coalesce((
        select jsonb_agg(jsonb_build_object(
          'anime_id', a.id, 'position', f.position,
          'anime', jsonb_build_object('id', a.id, 'anilist_id', a.anilist_id,
            'title_romaji', a.title_romaji, 'title_english', a.title_english,
            'title_native', a.title_native, 'cover_image', a.cover_image)
        ) order by f.position)
        from public.profile_pinned_anime f join public.anime a on a.id = f.anime_id
        where f.profile_id = p.id
      ), '[]'::jsonb)
    )
  )
  from public.profiles p
  where p.username = p_username::public.citext
    and char_length(p_username) between 3 and 30
    and (p.profile_visibility = 'public'
      or (auth.uid() is not null and p.auth_user_id = auth.uid()));
$$;
revoke all on function profile_access.read_profile(text) from public, anon, authenticated;
grant execute on function profile_access.read_profile(text) to anon, authenticated, service_role;

-- Only this invoker wrapper is in the PostgREST-exposed schema.
create function public.read_public_profile(p_username text)
returns jsonb
language sql stable security invoker set search_path = ''
as $$ select profile_access.read_profile(p_username); $$;
revoke all on function public.read_public_profile(text) from public, anon, authenticated;
grant execute on function public.read_public_profile(text) to anon, authenticated, service_role;
