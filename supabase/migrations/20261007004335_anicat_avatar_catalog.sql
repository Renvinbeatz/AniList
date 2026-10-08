-- Expand the approved catalog without rewriting existing profile choices.
set local lock_timeout = '5s';
set local statement_timeout = '30s';
alter table public.profiles
  drop constraint profiles_avatar_preset_check,
  add constraint profiles_avatar_preset_check
    check (avatar_preset is null or avatar_preset in (
      'happy-lavender',
      'happy-blue',
      'happy-sage',
      'happy-peach',
      'happy-rose',
      'happy-sand',
      'sad-lavender',
      'sad-blue',
      'sad-sage',
      'sad-peach',
      'sad-rose',
      'sad-sand',
      'laughing-lavender',
      'laughing-blue',
      'laughing-sage',
      'laughing-peach',
      'laughing-rose',
      'laughing-sand',
      'purple',
      'blue',
      'normal-sage',
      'normal-peach',
      'normal-rose',
      'black'
    ));
