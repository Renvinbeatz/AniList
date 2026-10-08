create table public.profile_blocks (
 blocker_id uuid not null references public.profiles(id) on delete cascade,
 blocked_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),primary key(blocker_id,blocked_id),check(blocker_id<>blocked_id)
);
create index profile_blocks_target_idx on public.profile_blocks(blocked_id,blocker_id);
create table public.community_comments (
 id uuid primary key default gen_random_uuid(),post_id uuid not null references public.community_posts(id) on delete cascade,
 profile_id uuid not null references public.profiles(id) on delete cascade,parent_id uuid,
 body text not null check(char_length(body) between 1 and 2000),spoiler boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(post_id,id),
 foreign key(post_id,parent_id) references public.community_comments(post_id,id) on delete cascade
);
create index community_comments_post_created_idx on public.community_comments(post_id,created_at,id);
create index community_comments_author_idx on public.community_comments(profile_id,id);
create index community_comments_parent_idx on public.community_comments(post_id,parent_id);
create table public.social_notifications (
 id uuid primary key default gen_random_uuid(),recipient_id uuid not null references public.profiles(id) on delete cascade,
 actor_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null check(kind in ('follow','comment','reply','moderation')),
 post_id uuid references public.community_posts(id) on delete cascade,
 comment_id uuid references public.community_comments(id) on delete cascade,
 created_at timestamptz not null default now(),read_at timestamptz
);
create index social_notifications_recipient_created_idx on public.social_notifications(recipient_id,created_at desc,id);
create index social_notifications_actor_idx on public.social_notifications(actor_id);
create index social_notifications_post_idx on public.social_notifications(post_id);
create index social_notifications_comment_idx on public.social_notifications(comment_id);
create unique index social_notifications_unread_follow_idx on public.social_notifications(recipient_id,actor_id) where kind='follow' and read_at is null;
create table public.community_moderators(profile_id uuid primary key references public.profiles(id) on delete cascade);
create table public.community_reports (
 id uuid primary key default gen_random_uuid(),reporter_id uuid not null references public.profiles(id) on delete cascade,
 target_profile_id uuid not null references public.profiles(id) on delete cascade,
 target_type text not null check(target_type in ('post','comment')),target_id uuid not null,
 reason text not null check(reason in ('harassment','spam','spoiler','image','other')),
 detail text check(detail is null or char_length(detail)<=500),snapshot jsonb not null,
 state text not null default 'pending' check(state in ('pending','dismissed','removed')),
 created_at timestamptz not null default now(),resolved_at timestamptz,
 unique(reporter_id,target_type,target_id)
);
create index community_reports_state_created_idx on public.community_reports(state,created_at,id);
create index community_reports_target_profile_idx on public.community_reports(target_profile_id);
do $$ declare t text; begin
 foreach t in array array['profile_blocks','community_comments','social_notifications','community_moderators','community_reports'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;

create or replace function public.social_visible(p_actor uuid,p_subject uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
 select exists(select 1 from public.profiles p where p.id=p_subject and (p.profile_visibility='public' or p.id=p_actor))
 and not exists(select 1 from public.profile_blocks b where (b.blocker_id=p_actor and b.blocked_id=p_subject) or (b.blocked_id=p_actor and b.blocker_id=p_subject));
$$;
create function public.social_post_visible(p_actor uuid,p_post uuid) returns boolean
language sql stable security invoker set search_path = '' as $$
 select exists(select 1 from public.community_posts p where p.id=p_post and public.social_visible(p_actor,p.profile_id));
$$;
revoke all on function public.social_post_visible(uuid,uuid) from public,anon,authenticated;
grant execute on function public.social_post_visible(uuid,uuid) to service_role;

create function public.social_block(p_actor uuid,p_username text,p_selected boolean) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare target uuid;
begin
 if p_selected is null then return false; end if;
 select id into target from public.profiles where lower(username)=lower(p_username);
 if target is null or target=p_actor then return false; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(p_actor::text,target::text)||greatest(p_actor::text,target::text),0));
 if p_selected then
  if not public.social_visible(p_actor,target) and not exists(select 1 from public.profile_blocks where blocker_id=p_actor and blocked_id=target) then return false; end if;
  insert into public.profile_blocks(blocker_id,blocked_id) values(p_actor,target) on conflict do nothing;
  delete from public.profile_follows where (follower_id=p_actor and following_id=target) or (follower_id=target and following_id=p_actor);
  delete from public.social_notifications where (recipient_id=p_actor and actor_id=target) or (recipient_id=target and actor_id=p_actor);
 else delete from public.profile_blocks where blocker_id=p_actor and blocked_id=target;
 end if;
 return true;
end;
$$;
revoke all on function public.social_block(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.social_block(uuid,text,boolean) to service_role;
create function public.social_blocked_list(p_actor uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('username',p.username) order by p.username),'[]'::jsonb)
 from public.profile_blocks b join public.profiles p on p.id=b.blocked_id where b.blocker_id=p_actor;
$$;
revoke all on function public.social_blocked_list(uuid) from public,anon,authenticated;
grant execute on function public.social_blocked_list(uuid) to service_role;

create function public.social_notify(p_recipient uuid,p_actor uuid,p_kind text,p_post uuid default null,p_comment uuid default null) returns void
language plpgsql security invoker set search_path = '' as $$
begin
 if p_recipient is not null and p_recipient<>p_actor and (p_kind='moderation' or public.social_visible(p_recipient,p_actor)) then
 insert into public.social_notifications(recipient_id,actor_id,kind,post_id,comment_id)
 values(p_recipient,p_actor,p_kind,p_post,p_comment) on conflict do nothing;
 end if;
end;
$$;
revoke all on function public.social_notify(uuid,uuid,text,uuid,uuid) from public,anon,authenticated;
grant execute on function public.social_notify(uuid,uuid,text,uuid,uuid) to service_role;
create function public.capture_follow_notification() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin perform public.social_notify(new.following_id,new.follower_id,'follow'); return new; end;
$$;
revoke all on function public.capture_follow_notification() from public,anon,authenticated;
create trigger social_follow_notification after insert on public.profile_follows for each row execute function public.capture_follow_notification();

create function public.social_save_comment(p_actor uuid,p_post uuid,p_id uuid,p_parent uuid,p_body text,p_spoiler boolean) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare saved uuid; recipient uuid; reply_author uuid; wait_seconds integer;
begin
 if not public.social_post_visible(p_actor,p_post) then return jsonb_build_object('error','missing'); end if;
 if p_body is null or char_length(btrim(p_body)) not between 1 and 2000 or p_spoiler is null then return jsonb_build_object('error','invalid'); end if;
 if p_id is null then
  if p_parent is not null then
   select profile_id into reply_author from public.community_comments where id=p_parent and post_id=p_post and parent_id is null and public.social_visible(p_actor,profile_id);
   if reply_author is null then return jsonb_build_object('error','missing'); end if;
  end if;
  wait_seconds:=public.social_rate(p_actor,'comment');
  if wait_seconds>0 then return jsonb_build_object('error','rate','wait',wait_seconds); end if;
  insert into public.community_comments(profile_id,post_id,parent_id,body,spoiler) values(p_actor,p_post,p_parent,btrim(p_body),p_spoiler) returning id into saved;
  select profile_id into recipient from public.community_posts where id=p_post;
  perform public.social_notify(recipient,p_actor,'comment',p_post,saved);
  if reply_author is distinct from recipient then perform public.social_notify(reply_author,p_actor,'reply',p_post,saved); end if;
 else
  update public.community_comments set body=btrim(p_body),spoiler=p_spoiler,updated_at=now()
  where id=p_id and profile_id=p_actor and post_id=p_post returning id into saved;
 end if;
 if saved is null then return jsonb_build_object('error','missing'); end if;
 return jsonb_build_object('id',saved);
end;
$$;
revoke all on function public.social_save_comment(uuid,uuid,uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.social_save_comment(uuid,uuid,uuid,uuid,text,boolean) to service_role;

create function public.social_comments(p_actor uuid,p_post uuid,p_page integer default 1) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare items jsonb; total bigint;
begin
 if p_page not between 1 and 1000 or not public.social_post_visible(p_actor,p_post) then return null; end if;
 with visible as (select c.*,p.username,p.display_name,p.avatar_preset from public.community_comments c join public.profiles p on p.id=c.profile_id
 where c.post_id=p_post and public.social_visible(p_actor,c.profile_id)
 and (c.parent_id is null or exists(select 1 from public.community_comments parent where parent.id=c.parent_id and public.social_visible(p_actor,parent.profile_id)))),
 page as (select * from visible order by created_at,id limit 30 offset (p_page-1)*30)
 select (select count(*) from visible),(select coalesce(jsonb_agg(jsonb_build_object('id',id,'parent_id',parent_id,'body',body,'spoiler',spoiler,'created_at',created_at,'username',username,'display_name',display_name,'avatar_preset',avatar_preset,'is_owner',profile_id=p_actor) order by created_at,id),'[]'::jsonb) from page) into total,items;
 return jsonb_build_object('items',items,'total',total,'page',p_page);
end;
$$;
revoke all on function public.social_comments(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.social_comments(uuid,uuid,integer) to service_role;

create function public.social_notification_list(p_actor uuid,p_page integer default 1) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare items jsonb; total bigint;
begin
 if p_page not between 1 and 1000 then return null; end if;
 with visible as (select n.*,p.username from public.social_notifications n join public.profiles p on p.id=n.actor_id
 where n.recipient_id=p_actor and (n.kind='moderation' or public.social_visible(p_actor,n.actor_id))
 and (n.post_id is null or public.social_post_visible(p_actor,n.post_id))
 and (n.comment_id is null or exists(select 1 from public.community_comments c where c.id=n.comment_id and public.social_visible(p_actor,c.profile_id)))),
 page as (select * from visible order by created_at desc,id desc limit 30 offset (p_page-1)*30)
 select (select count(*) from visible),(select coalesce(jsonb_agg(jsonb_build_object('id',id,'kind',kind,'username',case when kind='moderation' then null else username end,'post_id',post_id,'read',read_at is not null,'created_at',created_at) order by created_at desc,id desc),'[]'::jsonb) from page) into total,items;
 return jsonb_build_object('items',items,'total',total,'page',p_page);
end;
$$;
revoke all on function public.social_notification_list(uuid,integer) from public,anon,authenticated;
grant execute on function public.social_notification_list(uuid,integer) to service_role;

create function public.social_report(p_actor uuid,p_target_type text,p_target uuid,p_reason text,p_detail text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare target_author uuid; snapshot_data jsonb; wait_seconds integer; saved uuid;
begin
 if p_reason not in ('harassment','spam','spoiler','image','other') or char_length(p_detail)>500 then return jsonb_build_object('error','invalid'); end if;
 if p_target_type='post' then
 select profile_id,jsonb_build_object('title',title,'body',body,'image_url',image_url) into target_author,snapshot_data from public.community_posts where id=p_target and public.social_post_visible(p_actor,id);
 elsif p_target_type='comment' then
 select profile_id,jsonb_build_object('body',body) into target_author,snapshot_data from public.community_comments where id=p_target and public.social_visible(p_actor,profile_id) and public.social_post_visible(p_actor,post_id);
 end if;
 if target_author is null or target_author=p_actor then return jsonb_build_object('error','missing'); end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor::text,0));
 if exists(select 1 from public.community_reports where reporter_id=p_actor and target_type=p_target_type and target_id=p_target) then return jsonb_build_object('error','duplicate'); end if;
 wait_seconds:=public.social_rate(p_actor,'report');
 if wait_seconds>0 then return jsonb_build_object('error','rate','wait',wait_seconds); end if;
 insert into public.community_reports(reporter_id,target_profile_id,target_type,target_id,reason,detail,snapshot) values(p_actor,target_author,p_target_type,p_target,p_reason,nullif(btrim(p_detail),''),snapshot_data) returning id into saved;
 return jsonb_build_object('id',saved);
end;
$$;
revoke all on function public.social_report(uuid,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.social_report(uuid,text,uuid,text,text) to service_role;

create function public.social_moderation_queue(p_actor uuid,p_page integer default 1) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
begin
 if not exists(select 1 from public.community_moderators where profile_id=p_actor) or p_page not between 1 and 1000 then return null; end if;
 return jsonb_build_object('total',(select count(*) from public.community_reports where state='pending'),'page',p_page,'items',(
 select coalesce(jsonb_agg(payload order by created_at,id),'[]'::jsonb) from (
 select created_at,id,jsonb_build_object('id',id,'target_type',target_type,'reason',reason,'detail',detail,'snapshot',snapshot,'created_at',created_at) payload
 from public.community_reports where state='pending' order by created_at,id limit 20 offset (p_page-1)*20) pending));
end;
$$;
revoke all on function public.social_moderation_queue(uuid,integer) from public,anon,authenticated;
grant execute on function public.social_moderation_queue(uuid,integer) to service_role;

create function public.social_resolve_report(p_actor uuid,p_id uuid,p_remove boolean) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare report public.community_reports;
begin
 if p_remove is null or not exists(select 1 from public.community_moderators where profile_id=p_actor) then return false; end if;
 select * into report from public.community_reports where id=p_id and state='pending' for update;
 if not found then return false; end if;
 if p_remove then
  if report.target_type='post' then delete from public.community_posts where id=report.target_id;
  else delete from public.community_comments where id=report.target_id; end if;
  perform public.social_notify(report.target_profile_id,p_actor,'moderation');
 end if;
 update public.community_reports set state=case when p_remove then 'removed' else 'dismissed' end,resolved_at=now()
 where target_type=report.target_type and target_id=report.target_id and state='pending';
 return true;
end;
$$;
revoke all on function public.social_resolve_report(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.social_resolve_report(uuid,uuid,boolean) to service_role;

create or replace function public.social_follow(p_actor uuid, p_username text, p_selected boolean) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare target uuid;
begin
 if not exists(select 1 from public.profiles where id=p_actor) then return false; end if;
 select id into target from public.profiles where lower(username)=lower(p_username);
 if target is null or target=p_actor then return false; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(p_actor::text,target::text)||greatest(p_actor::text,target::text),0));
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
    and not exists(select 1 from public.profile_blocks b join public.profiles viewer on viewer.auth_user_id=auth.uid() where (b.blocker_id=viewer.id and b.blocked_id=p.id) or (b.blocked_id=viewer.id and b.blocker_id=p.id))
    and (p.profile_visibility = 'public'
      or (auth.uid() is not null and p.auth_user_id = auth.uid()));
$$;


create or replace function profile_access.read_library(p_username text, p_status text default null, p_page integer default 1)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with visible as (
    select p.id, p.username, p.profile_visibility,
      coalesce(p.auth_user_id = auth.uid(), false) as is_owner
    from public.profiles p
    where p.username operator(public.=) p_username::public.citext
      and char_length(p_username) between 3 and 30
      and not exists(select 1 from public.profile_blocks b join public.profiles viewer on viewer.auth_user_id=auth.uid() where (b.blocker_id=viewer.id and b.blocked_id=p.id) or (b.blocked_id=viewer.id and b.blocker_id=p.id))
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


create or replace function public.social_feed(p_actor uuid,p_mode text default 'all',p_page integer default 1,p_id uuid default null,p_anime uuid default null) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare items jsonb; total bigint;
begin
 if p_mode not in ('all','following') or p_page not between 1 and 1000 then raise exception 'invalid_input'; end if;
 with entries as (
 select post.id,post.created_at,post.profile_id,
 jsonb_build_object('id',post.id,'type',post.kind,'title',post.title,'body',post.body,'image_url',post.image_url,'spoiler',post.spoiler,
 'created_at',post.created_at,'updated_at',post.updated_at,'comment_count',(select count(*) from public.community_comments c where c.post_id=post.id and public.social_visible(p_actor,c.profile_id) and (c.parent_id is null or exists(select 1 from public.community_comments parent where parent.id=c.parent_id and public.social_visible(p_actor,parent.profile_id)))),'username',p.username,'display_name',p.display_name,'avatar_preset',p.avatar_preset,'is_owner',post.profile_id=p_actor,'anime',(select jsonb_build_object('id',a.id,'title',coalesce(a.title_romaji,a.title_english,a.title_native),'anilist_id',a.anilist_id) from public.anime a where a.id=post.anime_id)) payload
 from public.community_posts post join public.profiles p on p.id=post.profile_id
 where public.social_visible(p_actor,p.id) and (p_id is null or post.id=p_id) and (p_anime is null or post.anime_id=p_anime)
 union all
 select event.id,event.created_at,event.profile_id,jsonb_build_object('id',event.id,'type','activity','created_at',event.created_at,
 'username',p.username,'display_name',p.display_name,'avatar_preset',p.avatar_preset,'status',event.status,
 'anime',jsonb_build_object('title',coalesce(a.title_romaji,a.title_english,a.title_native),'cover_image',a.cover_image,'anilist_id',a.anilist_id))
 from public.library_activity event join public.profiles p on p.id=event.profile_id
 join public.user_anime ua on ua.id=event.user_anime_id join public.anime a on a.id=ua.anime_id
 where p.share_library_activity and p.profile_visibility='public' and public.social_visible(p_actor,p.id) and p_id is null and p_anime is null
 ), visible as (
 select * from entries e where p_mode='all' or e.profile_id=p_actor or exists(select 1 from public.profile_follows f where f.follower_id=p_actor and f.following_id=e.profile_id)
 ), page as (select * from visible order by created_at desc,id desc limit 20 offset (p_page-1)*20)
 select (select count(*) from visible),(select coalesce(jsonb_agg(payload order by created_at desc,id desc),'[]'::jsonb) from page) into total,items;
 return jsonb_build_object('items',items,'total',total,'page',p_page);
end;
$$;
revoke all on function public.social_feed(uuid,text,integer,uuid,uuid) from public,anon,authenticated;
grant execute on function public.social_feed(uuid,text,integer,uuid,uuid) to service_role;
