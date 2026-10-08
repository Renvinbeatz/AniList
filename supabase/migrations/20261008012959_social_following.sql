create table public.profile_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index profile_follows_following_idx on public.profile_follows(following_id, follower_id);
alter table public.profile_follows enable row level security;
revoke all on public.profile_follows from public, anon, authenticated;
grant all on public.profile_follows to service_role;

-- Trusted server supplies actor after authenticating; never callable by clients.
create function public.social_visible(p_actor uuid, p_subject uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
 select exists(select 1 from public.profiles p where p.id = p_subject
   and (p.profile_visibility = 'public' or p.id = p_actor));
$$;
revoke all on function public.social_visible(uuid,uuid) from public, anon, authenticated;
grant execute on function public.social_visible(uuid,uuid) to service_role;

create function public.social_people(p_actor uuid, p_query text default '', p_username text default null,
 p_mode text default 'search', p_page integer default 1) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare target uuid; total bigint; items jsonb; offset_rows integer;
begin
 if p_mode not in ('search','followers','following') or p_page not between 1 and 1000
 or char_length(p_query)>30 then raise exception 'invalid_input'; end if;
 if p_mode <> 'search' then
  select id into target from public.profiles where lower(username)=lower(p_username)
   and public.social_visible(p_actor,id);
  if target is null then return null; end if;
 end if;
 offset_rows := (p_page-1)*20;
 with candidates as (
 select p.* from public.profiles p where public.social_visible(p_actor,p.id)
 and (p_mode <> 'search' or (p.profile_visibility='public' and position(lower(p_query) in lower(p.username))>0))
 and (p_mode <> 'followers' or exists(select 1 from public.profile_follows f where f.following_id=target and f.follower_id=p.id))
 and (p_mode <> 'following' or exists(select 1 from public.profile_follows f where f.follower_id=target and f.following_id=p.id))
 ) select count(*) into total from candidates;
 select coalesce(jsonb_agg(row_data order by username), '[]'::jsonb) into items from (
 select p.username, jsonb_build_object('username',p.username,'display_name',p.display_name,'avatar_preset',p.avatar_preset,
 'is_owner',p.id=p_actor,'is_following',exists(select 1 from public.profile_follows f where f.follower_id=p_actor and f.following_id=p.id)) row_data
 from public.profiles p where public.social_visible(p_actor,p.id)
 and (p_mode <> 'search' or (p.profile_visibility='public' and position(lower(p_query) in lower(p.username))>0))
 and (p_mode <> 'followers' or exists(select 1 from public.profile_follows f where f.following_id=target and f.follower_id=p.id))
 and (p_mode <> 'following' or exists(select 1 from public.profile_follows f where f.follower_id=target and f.following_id=p.id))
 order by p.username limit 20 offset offset_rows) page;
 return jsonb_build_object('items',items,'total',total,'page',p_page);
end;
$$;
revoke all on function public.social_people(uuid,text,text,text,integer) from public, anon, authenticated;
grant execute on function public.social_people(uuid,text,text,text,integer) to service_role;

create function public.social_follow(p_actor uuid, p_username text, p_selected boolean) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare target uuid;
begin
 if not exists(select 1 from public.profiles where id=p_actor) then return false; end if;
 select id into target from public.profiles where lower(username)=lower(p_username);
 if target is null or target=p_actor then return false; end if;
 if p_selected then
  if not public.social_visible(p_actor,target) then return false; end if;
  insert into public.profile_follows(follower_id,following_id) values(p_actor,target) on conflict do nothing;
 else delete from public.profile_follows where follower_id=p_actor and following_id=target;
 end if;
 return true;
end;
$$;
revoke all on function public.social_follow(uuid,text,boolean) from public, anon, authenticated;
grant execute on function public.social_follow(uuid,text,boolean) to service_role;

create function public.social_relationship(p_actor uuid, p_username text) returns jsonb
language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object('following',exists(select 1 from public.profile_follows f where f.follower_id=p_actor and f.following_id=p.id),
 'followers',(select count(*) from public.profile_follows f where f.following_id=p.id and public.social_visible(p_actor,f.follower_id)),
 'following_count',(select count(*) from public.profile_follows f where f.follower_id=p.id and public.social_visible(p_actor,f.following_id)))
 from public.profiles p where lower(p.username)=lower(p_username) and public.social_visible(p_actor,p.id);
$$;
revoke all on function public.social_relationship(uuid,text) from public, anon, authenticated;
grant execute on function public.social_relationship(uuid,text) to service_role;
