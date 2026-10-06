'use server'

import { supabaseServerClient } from '@/data/supabase'
import { createClient } from '@/utils/supabase/server'
import { generateGhostEmail } from '@/lib/identity'
import { redirect } from 'next/navigation'

export async function signupWithUsernameAction(prevState: unknown, formData: FormData) {
  const rawUsername = formData.get('username')
  const rawPassword = formData.get('password')

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

  if (!rawPassword || typeof rawPassword !== 'string') {
    return { error: 'Senha inválida.' }
  }

  if (rawPassword.length < 6) {
    return { error: 'A senha precisa ter pelo menos 6 caracteres.' }
  }

  if (rawPassword.length > 72) {
    return { error: 'A senha pode ter no máximo 72 caracteres.' }
  }

  try {
    // 1. Check if username exists
    const { data: existingProfile } = await supabaseServerClient
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existingProfile) {
      return { error: 'Username já está em uso.' }
    }

    // 2. Generate Ghost Email
    const ghostEmail = generateGhostEmail()

    // 3. Create Supabase Auth User
    const { data: authData, error: authError } = await supabaseServerClient.auth.admin.createUser({
      email: ghostEmail,
      password: rawPassword,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error('Supabase Auth Error:', authError)
      return { error: 'Não foi possível concluir o cadastro.' }
    }

    const authUserId = authData.user.id

    // 4. Create Profile
    const { data: newProfile, error: profileError } = await supabaseServerClient
      .from('profiles')
      .insert({
        username,
        auth_user_id: authUserId,
      })
      .select('id')
      .single()

    if (profileError || !newProfile) {
      console.error('Profile creation failed:', profileError)

      // Rollback the explicitly created Auth user for this request
      await supabaseServerClient.auth.admin.deleteUser(authUserId)

      if (profileError?.code === '23505') {
        return { error: 'Username já está em uso.' }
      }

      return { error: 'Não foi possível concluir o cadastro.' }
    }

    // 5. Sign In the user automatically
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: ghostEmail,
      password: rawPassword,
    })

    if (signInError) {
      console.error('Auto sign-in failed:', signInError)
      return { error: 'Conta criada, mas ocorreu um erro ao entrar.' }
    }

    // Compatibilidade com legado removida

  } catch (error) {
    console.error('Unexpected Signup Error:', error)
    return { error: 'Ocorreu um erro inesperado. Tente novamente.' }
  }

  redirect('/dashboard')
}

export async function loginWithUsernameAction(prevState: unknown, formData: FormData) {
  const rawUsername = formData.get('username')
  const rawPassword = formData.get('password')

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

  if (!rawPassword || typeof rawPassword !== 'string') {
    return { error: 'Senha inválida.' }
  }

  if (rawPassword.length < 6) {
    return { error: 'A senha precisa ter pelo menos 6 caracteres.' }
  }

  if (rawPassword.length > 72) {
    return { error: 'A senha pode ter no máximo 72 caracteres.' }
  }

  try {
    // 1. Lookup profile
    const { data: profile, error: profileError } = await supabaseServerClient
      .from('profiles')
      .select('id, auth_user_id')
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      // Return generic error to prevent username enumeration if needed,
      // but AniList tracker has public usernames anyway.
      return { error: 'Credenciais inválidas.' }
    }

    if (!profile.auth_user_id) {
      return { error: 'Esta conta ainda não está habilitada para o novo sistema de login.' }
    }

    // 2. Resolve technical email
    const { data: userData, error: userError } = await supabaseServerClient.auth.admin.getUserById(profile.auth_user_id)

    if (userError || !userData.user || !userData.user.email) {
      console.error('Auth User Resolution Error:', userError)
      return { error: 'Ocorreu um erro ao resolver a identidade.' }
    }

    const technicalEmail = userData.user.email

    // 3. Sign In
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: technicalEmail,
      password: rawPassword,
    })

    if (signInError) {
      // Generic message to not expose if password was wrong vs email disabled.
      return { error: 'Credenciais inválidas.' }
    }

    // Compatibilidade com legado removida

  } catch (error) {
    console.error('Unexpected Login Error:', error)
    return { error: 'Ocorreu um erro inesperado. Tente novamente.' }
  }

  redirect('/dashboard')
}
