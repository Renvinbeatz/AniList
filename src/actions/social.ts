'use server'
import { getSession } from '@/lib/session'
import { supabaseServerClient } from '@/data/supabase'
import { validPublicUsername } from '@/lib/public-profile'
import { revalidatePath } from 'next/cache'

export async function followAction(username: string, selected: boolean) {
  const session = await getSession()
  if (!session) return { error: 'Entre na sua conta para seguir pessoas.' }
  if (!validPublicUsername(username) || typeof selected !== 'boolean') return { error: 'Dados inválidos.' }
  const { data, error } = await supabaseServerClient.rpc('social_follow', { p_actor: session.profileId, p_username: username, p_selected: selected })
  if (error || !data) return { error: 'Não foi possível alterar essa relação.' }
  revalidatePath('/people')
  revalidatePath('/user', 'layout')
  revalidatePath('/profile')
  return { error: null }
}
