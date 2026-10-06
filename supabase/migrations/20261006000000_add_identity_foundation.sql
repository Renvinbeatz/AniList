-- Add foreign key constraint to link profiles to auth.users safely
ALTER TABLE profiles
  ADD CONSTRAINT profiles_auth_user_id_fkey
  FOREIGN KEY (auth_user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Add unique constraint to ensure 1:1 mapping between auth.users and profiles
ALTER TABLE profiles
  ADD CONSTRAINT profiles_auth_user_id_key
  UNIQUE (auth_user_id);
