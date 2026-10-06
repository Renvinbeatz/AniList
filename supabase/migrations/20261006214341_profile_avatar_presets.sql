-- Stable catalog identifiers keep avatar choices independent of future artwork.
alter table public.profiles add column avatar_preset text;
alter table public.profiles add constraint profiles_avatar_preset_check
  check (avatar_preset is null or avatar_preset in ('black', 'blue', 'purple'));
