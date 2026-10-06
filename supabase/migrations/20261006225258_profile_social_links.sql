-- Optional platform links; the profile remains closed to direct API access.
create function profile_access.valid_social_links(links jsonb)
returns boolean language plpgsql immutable security invoker set search_path = ''
as $$
declare item record; pattern text; address text;
begin
  if links is null then return true; end if;
  if jsonb_typeof(links) <> 'object' or links = '{}'::jsonb then return false; end if;
  for item in select key, value from jsonb_each(links) loop
    pattern := case item.key
      when 'instagram' then '^https://(www\.)?instagram\.com([/?#]|$)'
      when 'x' then '^https://(www\.)?(x\.com|twitter\.com)([/?#]|$)'
      when 'youtube' then '^https://((www\.|m\.)?youtube\.com|youtu\.be)([/?#]|$)'
      when 'discord' then '^https://((www\.)?discord\.com|discord\.gg)([/?#]|$)'
      when 'github' then '^https://(www\.)?github\.com([/?#]|$)'
      else null end;
    if pattern is null or jsonb_typeof(item.value) <> 'string' then return false; end if;
    address := item.value #>> '{}';
    if char_length(address) > 2000 or address ~ '[[:cntrl:][:space:]]'
      or address ~* '%(00|0a|0d)' or address !~ pattern then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function profile_access.valid_social_links(jsonb) from public, anon, authenticated;
grant execute on function profile_access.valid_social_links(jsonb) to service_role;
alter table public.profiles add column social_links jsonb null
  constraint profiles_social_links_valid check (profile_access.valid_social_links(social_links));
comment on column public.profiles.social_links is 'Optional HTTPS links for Instagram, X, YouTube, Discord, GitHub; absent links use SQL NULL.';

-- Qualify the citext operator under the hardened empty search_path.
create or replace function profile_access.read_profile(p_username text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'social_links', p.social_links,
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
  where p.username operator(public.=) p_username::public.citext
    and char_length(p_username) between 3 and 30
    and (p.profile_visibility = 'public'
      or (auth.uid() is not null and p.auth_user_id = auth.uid()));
$$;
