'use server'

import { getSession } from '@/lib/session'
import { supabaseServerClient } from '@/data/supabase'
import { parseProfileSocialLinks } from '@/lib/profile-social-links'
import { revalidatePath } from 'next/cache'

export async function updateProfileSocialLinks(input: unknown) {
  try {
    const session = await getSession()
    if (!session) return { error: 'Sua sessão expirou. Entre novamente.', code: 'UNAUTHORIZED' }
    const result = parseProfileSocialLinks(input)
    if ('error' in result) return result
    const { data, error } = await supabaseServerClient.from('profiles')
      .update({ social_links: result.data }).eq('id', session.profileId).select('id').single()
    if (error || !data) return { error: 'Não foi possível salvar os links agora. Tente novamente.', code: 'INTERNAL_ERROR' }
    revalidatePath('/profile')
    revalidatePath('/profile/settings')
    revalidatePath('/user/[username]', 'page')
    return { success: true }
  } catch {
    return { error: 'Não foi possível confirmar o salvamento. Recarregue e tente novamente.', code: 'UNEXPECTED_ERROR' }
  }
}
