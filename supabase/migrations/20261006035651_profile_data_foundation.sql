-- 1. Alter profiles table to add new foundation fields
ALTER TABLE profiles
  ADD COLUMN bio TEXT CHECK (bio IS NULL OR length(bio) <= 500),
  ADD COLUMN banner_url TEXT,
  ADD COLUMN favorite_character_anilist_id INTEGER,
  ADD COLUMN profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private'));

-- Note: display_name length check added as requested.
ALTER TABLE profiles
  ADD CONSTRAINT profiles_display_name_check CHECK (display_name IS NULL OR length(display_name) <= 50);

-- Note: The username validation constraint (^[a-z0-9_-]{3,30}$) was NOT applied
-- because an audit found 6 existing usernames that violate it (e.g., due to uppercase or accents like 'Cauã').
-- This requires a dedicated normalization/migration step in the future.

-- 2. Create profile_favorites table
CREATE TABLE profile_favorites (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 10),
  PRIMARY KEY (profile_id, anime_id),
  UNIQUE (profile_id, position)
);

-- Indexes for profile_favorites
CREATE INDEX idx_profile_favorites_profile_id ON profile_favorites(profile_id);
-- The PRIMARY KEY and UNIQUE constraints automatically create their respective indexes,
-- but explicitly indexing profile_id is useful for reading a user's entire list efficiently.

-- 3. Create profile_pinned_anime table
CREATE TABLE profile_pinned_anime (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 6),
  PRIMARY KEY (profile_id, anime_id),
  UNIQUE (profile_id, position)
);

-- Indexes for profile_pinned_anime
CREATE INDEX idx_profile_pinned_anime_profile_id ON profile_pinned_anime(profile_id);

-- Enable RLS for new tables (to prepare for future Stages, no policies yet)
ALTER TABLE profile_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_pinned_anime ENABLE ROW LEVEL SECURITY;
