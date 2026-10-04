-- Enable citext for case-insensitive username
CREATE EXTENSION IF NOT EXISTS citext;

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NULL,
    username CITEXT UNIQUE NOT NULL CHECK (length(username) >= 3 AND length(username) <= 30),
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 2. anime
CREATE TABLE anime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anilist_id INTEGER UNIQUE NOT NULL,
    title_romaji TEXT,
    title_english TEXT,
    title_native TEXT,
    description TEXT,
    cover_image TEXT,
    cover_color TEXT,
    banner_image TEXT,
    episodes INTEGER,
    duration INTEGER,
    status TEXT,
    season TEXT,
    season_year INTEGER,
    average_score INTEGER,
    genres TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_anime_updated_at
BEFORE UPDATE ON anime
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 3. user_anime
CREATE TABLE user_anime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('watching', 'planned', 'paused', 'completed', 'dropped')),
    current_episode INTEGER NOT NULL DEFAULT 0 CHECK (current_episode >= 0),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(profile_id, anime_id)
);

CREATE TRIGGER update_user_anime_updated_at
BEFORE UPDATE ON user_anime
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 4. airing_schedule
CREATE TABLE airing_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anime_id UUID NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
    anilist_airing_id INTEGER UNIQUE NOT NULL,
    episode INTEGER NOT NULL,
    airing_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_airing_schedule_updated_at
BEFORE UPDATE ON airing_schedule
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 5. platforms
CREATE TABLE platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    website_url TEXT
);

-- 6. user_anime_platforms
CREATE TABLE user_anime_platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_anime_id UUID NOT NULL REFERENCES user_anime(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
    UNIQUE(user_anime_id, platform_id)
);

-- RLS Configuration (No policies, just enable it)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE airing_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_anime_platforms ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_user_anime_profile_id ON user_anime(profile_id);
CREATE INDEX idx_user_anime_profile_status ON user_anime(profile_id, status);
CREATE INDEX idx_anime_anilist_id ON anime(anilist_id);
CREATE INDEX idx_airing_schedule_anime_id ON airing_schedule(anime_id);
CREATE INDEX idx_airing_schedule_airing_at ON airing_schedule(airing_at);
