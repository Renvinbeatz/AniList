-- Personal platforms are accessed only through authenticated Server Actions.
-- Composite foreign keys prevent associations across profile ownership.
alter table public.user_anime add constraint user_anime_profile_id_id_key unique (profile_id, id);

create table public.personal_platforms (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 60 and name !~ '[[:cntrl:]]'),
  website_url text check (website_url is null or (char_length(website_url) <= 2000 and website_url ~ '^https://[^/@[:space:]]+')),
  unique (profile_id, id)
);
create unique index personal_platforms_profile_name_idx on public.personal_platforms (profile_id, lower(name));

create table public.user_anime_personal_platforms (
  profile_id uuid not null,
  user_anime_id uuid not null,
  personal_platform_id uuid not null,
  primary key (user_anime_id, personal_platform_id),
  foreign key (profile_id, user_anime_id) references public.user_anime(profile_id, id) on delete cascade,
  foreign key (profile_id, personal_platform_id) references public.personal_platforms(profile_id, id) on delete cascade
);
create index user_anime_personal_platforms_owner_anime_idx on public.user_anime_personal_platforms (profile_id, user_anime_id);
create index user_anime_personal_platforms_owner_platform_idx on public.user_anime_personal_platforms (profile_id, personal_platform_id);

alter table public.personal_platforms enable row level security;
alter table public.user_anime_personal_platforms enable row level security;
revoke all on public.personal_platforms, public.user_anime_personal_platforms from public, anon, authenticated;
grant all on public.personal_platforms, public.user_anime_personal_platforms to service_role;
