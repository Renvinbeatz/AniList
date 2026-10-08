alter table public.profiles add column share_library_activity boolean not null default false;
create table public.community_posts (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(title) between 1 and 120),
 body text not null check(char_length(body) between 1 and 4000),
 image_url text check(image_url is null or (char_length(image_url)<=2000 and image_url like 'https://%')),
 spoiler boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index community_posts_author_created_idx on public.community_posts(profile_id,created_at desc,id);
create index community_posts_created_idx on public.community_posts(created_at desc,id);
create table public.social_publish_log (
 id bigint generated always as identity primary key,
 profile_id uuid not null references public.profiles(id) on delete cascade,
 bucket text not null check(bucket in ('publication','comment','report')),
 created_at timestamptz not null default now()
);
create index social_publish_log_rate_idx on public.social_publish_log(profile_id,bucket,created_at desc);
create table public.library_activity (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 user_anime_id uuid not null,
 status text not null check(status in ('watching','planned','paused','completed','dropped')),
 created_at timestamptz not null default now(),
 foreign key(profile_id,user_anime_id) references public.user_anime(profile_id,id) on delete cascade
);
create index library_activity_created_idx on public.library_activity(created_at desc,id);
create index library_activity_owner_library_idx on public.library_activity(profile_id,user_anime_id);
do $$ declare t text; begin
 foreach t in array array['community_posts','social_publish_log','library_activity'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant usage,select on sequence public.social_publish_log_id_seq to service_role;

create function public.social_rate(p_actor uuid,p_bucket text) returns integer
language plpgsql security invoker set search_path = '' as $$
declare last_at timestamptz; oldest_at timestamptz; n integer; gap integer; max_count integer; seconds_left integer;
begin
 if p_bucket not in ('publication','comment','report') then raise exception 'invalid_bucket'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor::text,0));
 gap := case when p_bucket='publication' then 60 when p_bucket='comment' then 15 else 30 end;
 max_count := case when p_bucket='publication' then 3 when p_bucket='comment' then 20 else 10 end;
 select max(created_at),min(created_at),count(*) into last_at,oldest_at,n from public.social_publish_log
 where profile_id=p_actor and bucket=p_bucket and created_at > now()-interval '10 minutes';
 seconds_left := greatest(0,coalesce(ceil(extract(epoch from last_at+make_interval(secs=>gap)-now()))::integer,0));
 if n>=max_count then seconds_left:=greatest(seconds_left,ceil(extract(epoch from oldest_at+interval '10 minutes'-now()))::integer); end if;
 if seconds_left=0 then insert into public.social_publish_log(profile_id,bucket) values(p_actor,p_bucket); end if;
 return seconds_left;
end;
$$;
revoke all on function public.social_rate(uuid,text) from public,anon,authenticated;
grant execute on function public.social_rate(uuid,text) to service_role;

create function public.social_save_post(p_actor uuid,p_id uuid,p_title text,p_body text,p_image text,p_spoiler boolean) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare saved uuid; wait_seconds integer;
begin
 if not exists(select 1 from public.profiles where id=p_actor) then return jsonb_build_object('error','unauthorized'); end if;
 if p_title is null or char_length(btrim(p_title)) not between 1 and 120 or p_body is null or char_length(btrim(p_body)) not between 1 and 4000
 or (p_image is not null and (char_length(p_image)>2000 or p_image not like 'https://%')) or p_spoiler is null
 then return jsonb_build_object('error','invalid'); end if;
 if p_id is null then
  wait_seconds:=public.social_rate(p_actor,'publication');
  if wait_seconds>0 then return jsonb_build_object('error','rate','wait',wait_seconds); end if;
  insert into public.community_posts(profile_id,title,body,image_url,spoiler) values(p_actor,btrim(p_title),btrim(p_body),p_image,p_spoiler) returning id into saved;
 else
  update public.community_posts set title=btrim(p_title),body=btrim(p_body),image_url=p_image,spoiler=p_spoiler,updated_at=now()
  where id=p_id and profile_id=p_actor returning id into saved;
 end if;
 if saved is null then return jsonb_build_object('error','missing'); end if;
 return jsonb_build_object('id',saved);
end;
$$;
revoke all on function public.social_save_post(uuid,uuid,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.social_save_post(uuid,uuid,text,text,text,boolean) to service_role;

create function public.capture_library_activity() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 if old.status is distinct from new.status and exists(select 1 from public.profiles p
 where p.id=new.profile_id and p.share_library_activity and p.profile_visibility='public') then
 insert into public.library_activity(profile_id,user_anime_id,status) values(new.profile_id,new.id,new.status);
 end if;
 return new;
end;
$$;
revoke all on function public.capture_library_activity() from public,anon,authenticated;
create trigger library_activity_status after update of status on public.user_anime for each row execute function public.capture_library_activity();

create function public.social_activity_setting(p_actor uuid,p_enabled boolean) returns boolean
language plpgsql security invoker set search_path = '' as $$
begin
 if p_enabled is null then return false; end if;
 update public.profiles set share_library_activity=p_enabled where id=p_actor;
 if not found then return false; end if;
 if not p_enabled then delete from public.library_activity where profile_id=p_actor; end if;
 return true;
end;
$$;
revoke all on function public.social_activity_setting(uuid,boolean) from public,anon,authenticated;
grant execute on function public.social_activity_setting(uuid,boolean) to service_role;

create function public.social_feed(p_actor uuid,p_mode text default 'all',p_page integer default 1,p_id uuid default null) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare items jsonb; total bigint;
begin
 if p_mode not in ('all','following') or p_page not between 1 and 1000 then raise exception 'invalid_input'; end if;
 with entries as (
 select post.id,post.created_at,post.profile_id,
 jsonb_build_object('id',post.id,'type','topic','title',post.title,'body',post.body,'image_url',post.image_url,'spoiler',post.spoiler,
 'created_at',post.created_at,'updated_at',post.updated_at,'username',p.username,'display_name',p.display_name,'avatar_preset',p.avatar_preset,'is_owner',post.profile_id=p_actor) payload
 from public.community_posts post join public.profiles p on p.id=post.profile_id
 where public.social_visible(p_actor,p.id) and (p_id is null or post.id=p_id)
 union all
 select event.id,event.created_at,event.profile_id,jsonb_build_object('id',event.id,'type','activity','created_at',event.created_at,
 'username',p.username,'display_name',p.display_name,'avatar_preset',p.avatar_preset,'status',event.status,
 'anime',jsonb_build_object('title',coalesce(a.title_romaji,a.title_english,a.title_native),'cover_image',a.cover_image,'anilist_id',a.anilist_id))
 from public.library_activity event join public.profiles p on p.id=event.profile_id
 join public.user_anime ua on ua.id=event.user_anime_id join public.anime a on a.id=ua.anime_id
 where p.share_library_activity and p.profile_visibility='public' and public.social_visible(p_actor,p.id) and p_id is null
 ), visible as (
 select * from entries e where p_mode='all' or e.profile_id=p_actor or exists(select 1 from public.profile_follows f where f.follower_id=p_actor and f.following_id=e.profile_id)
 ), page as (select * from visible order by created_at desc,id desc limit 20 offset (p_page-1)*20)
 select (select count(*) from visible),(select coalesce(jsonb_agg(payload order by created_at desc,id desc),'[]'::jsonb) from page) into total,items;
 return jsonb_build_object('items',items,'total',total,'page',p_page);
end;
$$;
revoke all on function public.social_feed(uuid,text,integer,uuid) from public,anon,authenticated;
grant execute on function public.social_feed(uuid,text,integer,uuid) to service_role;
