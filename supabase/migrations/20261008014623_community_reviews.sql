alter table public.community_posts add column kind text not null default 'topic' check(kind in ('topic','review'));
alter table public.community_posts add column anime_id uuid references public.anime(id) on delete cascade;
alter table public.community_posts add constraint community_post_kind_anime check((kind='topic' and anime_id is null) or (kind='review' and anime_id is not null));
create unique index community_review_author_anime_idx on public.community_posts(profile_id,anime_id) where kind='review';
create index community_review_anime_idx on public.community_posts(anime_id,created_at desc) where anime_id is not null;
create or replace function public.social_save_post(p_actor uuid,p_id uuid,p_title text,p_body text,p_image text,p_spoiler boolean) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare saved uuid; wait_seconds integer;
begin
 if not exists(select 1 from public.profiles where id=p_actor) then return jsonb_build_object('error','unauthorized'); end if;
 if p_title is null or char_length(btrim(p_title)) not between 1 and 120 or p_body is null or char_length(btrim(p_body)) not between 1 and 4000
 or (p_image is not null and (char_length(p_image)>2000 or p_image not like 'https://%')) or p_spoiler is null
 then return jsonb_build_object('error','invalid'); end if;
 if p_id is not null and not exists(select 1 from public.community_posts where id=p_id and profile_id=p_actor and kind='topic') then return jsonb_build_object('error','missing'); end if;
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


create function public.social_save_review(p_actor uuid,p_id uuid,p_anime uuid,p_title text,p_body text,p_image text,p_spoiler boolean) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare saved uuid; wait_seconds integer;
begin
 if not exists(select 1 from public.profiles where id=p_actor) then return jsonb_build_object('error','unauthorized'); end if;
 if p_anime is null or not exists(select 1 from public.anime where id=p_anime) or p_title is null or char_length(btrim(p_title)) not between 1 and 120 or p_body is null or char_length(btrim(p_body)) not between 1 and 4000 or p_spoiler is null or (p_image is not null and (char_length(p_image)>2000 or p_image not like 'https://%')) then return jsonb_build_object('error','invalid'); end if;
 if p_id is null then
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor::text,0));
  if exists(select 1 from public.community_posts where profile_id=p_actor and anime_id=p_anime and kind='review') then return jsonb_build_object('error','duplicate'); end if;
  wait_seconds:=public.social_rate(p_actor,'publication');
  if wait_seconds>0 then return jsonb_build_object('error','rate','wait',wait_seconds); end if;
  insert into public.community_posts(profile_id,anime_id,kind,title,body,image_url,spoiler) values(p_actor,p_anime,'review',btrim(p_title),btrim(p_body),p_image,p_spoiler) returning id into saved;
 else
  update public.community_posts set title=btrim(p_title),body=btrim(p_body),image_url=p_image,spoiler=p_spoiler,updated_at=now()
  where id=p_id and profile_id=p_actor and anime_id=p_anime and kind='review' returning id into saved;
 end if;
 if saved is null then return jsonb_build_object('error','missing'); end if;
 return jsonb_build_object('id',saved);
end;
$$;
revoke all on function public.social_save_review(uuid,uuid,uuid,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.social_save_review(uuid,uuid,uuid,text,text,text,boolean) to service_role;
drop function public.social_feed(uuid,text,integer,uuid);
create function public.social_feed(p_actor uuid,p_mode text default 'all',p_page integer default 1,p_id uuid default null,p_anime uuid default null) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare items jsonb; total bigint;
begin
 if p_mode not in ('all','following') or p_page not between 1 and 1000 then raise exception 'invalid_input'; end if;
 with entries as (
 select post.id,post.created_at,post.profile_id,
 jsonb_build_object('id',post.id,'type',post.kind,'title',post.title,'body',post.body,'image_url',post.image_url,'spoiler',post.spoiler,
 'created_at',post.created_at,'updated_at',post.updated_at,'username',p.username,'display_name',p.display_name,'avatar_preset',p.avatar_preset,'is_owner',post.profile_id=p_actor,'anime',(select jsonb_build_object('id',a.id,'title',coalesce(a.title_romaji,a.title_english,a.title_native),'anilist_id',a.anilist_id) from public.anime a where a.id=post.anime_id)) payload
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
