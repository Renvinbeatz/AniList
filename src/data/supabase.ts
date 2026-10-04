import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable SUPABASE_URL')
}

if (!supabaseServiceKey) {
  throw new Error('Missing environment variable SUPABASE_SECRET_KEY')
}

/**
 * Server-only Supabase client.
 * Uses the service role key to bypass RLS, since the application
 * handles authorization via session cookies.
 * 
 * MUST NEVER BE EXPOSED TO THE CLIENT.
 */
export const supabaseServerClient = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)
