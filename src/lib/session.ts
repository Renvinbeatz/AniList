import { createClient } from '@/utils/supabase/server'
import { supabaseServerClient } from '@/data/supabase'
import { cache } from 'react'

export const getSession = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return null

  // Procurar o profile pelo auth_user_id (Service Role é seguro aqui pois já temos a auth.getUser() válida)
  const { data: profile, error } = await supabaseServerClient
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (error || !profile) return null

  return { profileId: profile.id }
})
