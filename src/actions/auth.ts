'use server'

import { supabaseServerClient } from '@/data/supabase'
import { setSession, deleteSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: { error: string | null }, formData: FormData) {
  const rawUsername = formData.get('username')
  
  if (!rawUsername || typeof rawUsername !== 'string') {
    return { error: 'Username inválido.' }
  }

  const username = rawUsername.trim()

  if (username.length < 3) {
    return { error: 'O username precisa ter pelo menos 3 caracteres.' }
  }

  if (username.length > 30) {
    return { error: 'O username pode ter no máximo 30 caracteres.' }
  }

  try {
    // 1. Tentar encontrar o perfil
    const { data: existingProfile, error: selectError } = await supabaseServerClient
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existingProfile) {
      // Perfil existe, cria a sessão e redireciona
      await setSession(existingProfile.id)
    } else if (selectError && selectError.code === 'PGRST116') {
      // PGRST116: Nenhum resultado retornado -> Criar novo perfil
      const { data: newProfile, error: insertError } = await supabaseServerClient
        .from('profiles')
        .insert({ username })
        .select('id')
        .single()

      if (insertError) {
        // Pode acontecer um erro de unicidade (23505) se duas requests simultâneas tentarem criar
        if (insertError.code === '23505') {
          // Tentamos buscar de novo
          const { data: retryProfile } = await supabaseServerClient
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single()
            
          if (retryProfile) {
            await setSession(retryProfile.id)
          } else {
             return { error: 'Erro de concorrência ao criar perfil. Tente novamente.' }
          }
        } else {
          console.error('Insert Error:', insertError)
          return { error: 'Não foi possível criar o perfil agora. Tente novamente.' }
        }
      } else if (newProfile) {
        await setSession(newProfile.id)
      }
    } else {
      console.error('Select Error:', selectError)
      return { error: 'Não foi possível buscar o perfil. Tente novamente.' }
    }
  } catch (error) {
    console.error('Unexpected Auth Error:', error)
    return { error: 'Ocorreu um erro inesperado. Tente novamente.' }
  }

  // Redirecionar fora do try-catch, pois redirect lança um erro que o Next.js captura
  redirect('/dashboard')
}

export async function logoutAction() {
  await deleteSession()
  redirect('/')
}
