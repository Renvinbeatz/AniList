'use server'

import { supabaseServerClient } from '@/data/supabase'
import { getSession } from '@/lib/session'
import { LIBRARY_STATUS, LibraryStatus } from '@/lib/constants'
import { revalidatePath } from 'next/cache'

// Note: animeId is the UUID of the local 'anime' table, NOT the anilistId.
// We must get the UUID from the anime page before calling this.

export async function addAnimeToLibrary(animeId: string) {
  try {
    const session = await getSession()
    if (!session) {
      return { error: 'Usuário não autenticado.' }
    }

    const { error: insertError } = await supabaseServerClient
      .from('user_anime')
      .insert({
        profile_id: session.profileId,
        anime_id: animeId,
        status: LIBRARY_STATUS.PLANNED,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return { error: 'Este anime já está na sua biblioteca.' }
      }
      console.error('Insert UserAnime Error:', insertError)
      return { error: 'Não foi possível adicionar este anime.' }
    }

    revalidatePath(`/anime`)
    revalidatePath(`/library`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected addAnimeToLibrary Error:', error)
    return { error: 'Ocorreu um erro inesperado.' }
  }
}

export async function updateAnimeStatus(userAnimeId: string, newStatus: LibraryStatus) {
  try {
    const session = await getSession()
    if (!session) {
      return { error: 'Usuário não autenticado.' }
    }

    // Obter o registro atual
    const { data: currentRecord, error: fetchError } = await supabaseServerClient
      .from('user_anime')
      .select('*')
      .eq('id', userAnimeId)
      .eq('profile_id', session.profileId)
      .single()

    if (fetchError || !currentRecord) {
      return { error: 'Registro não encontrado ou sem permissão.' }
    }

    const updates: { status?: string, started_at?: string | null, completed_at?: string | null } = { status: newStatus }

    if (newStatus === LIBRARY_STATUS.WATCHING && !currentRecord.started_at) {
      updates.started_at = new Date().toISOString()
    }

    if (newStatus === LIBRARY_STATUS.COMPLETED) {
      updates.completed_at = new Date().toISOString()
    } else if (currentRecord.status === LIBRARY_STATUS.COMPLETED) {
      // Se saiu de completed, limpa a data
      updates.completed_at = null
    }

    const { error: updateError } = await supabaseServerClient
      .from('user_anime')
      .update(updates)
      .eq('id', userAnimeId)
      .eq('profile_id', session.profileId)

    if (updateError) {
      console.error('Update UserAnime Error:', updateError)
      return { error: 'Não foi possível atualizar o status.' }
    }

    revalidatePath(`/anime`)
    revalidatePath(`/library`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected updateAnimeStatus Error:', error)
    return { error: 'Ocorreu um erro inesperado.' }
  }
}

export async function removeAnimeFromLibrary(userAnimeId: string) {
  try {
    const session = await getSession()
    if (!session) {
      return { error: 'Usuário não autenticado.' }
    }

    const { error: deleteError } = await supabaseServerClient
      .from('user_anime')
      .delete()
      .eq('id', userAnimeId)
      .eq('profile_id', session.profileId)

    if (deleteError) {
      console.error('Delete UserAnime Error:', deleteError)
      return { error: 'Não foi possível remover este anime.' }
    }

    revalidatePath(`/anime`)
    revalidatePath(`/library`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected removeAnimeFromLibrary Error:', error)
    return { error: 'Ocorreu um erro inesperado.' }
  }
}

export async function getUserAnimeRelation(animeId: string) {
  try {
    const session = await getSession()
    if (!session) return { data: null }

    const { data } = await supabaseServerClient
      .from('user_anime')
      .select('*')
      .eq('anime_id', animeId)
      .eq('profile_id', session.profileId)
      .single()

    return { data: data || null }
  } catch {
    return { data: null }
  }
}

export async function getLibrary() {
  try {
    const session = await getSession()
    if (!session) {
      return { error: 'Usuário não autenticado.' }
    }

    const { data, error } = await supabaseServerClient
      .from('user_anime')
      .select(`
        *,
        anime (*)
      `)
      .eq('profile_id', session.profileId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Get Library Error:', error)
      return { error: 'Falha ao buscar biblioteca.' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected getLibrary Error:', error)
    return { error: 'Ocorreu um erro inesperado.' }
  }
}

export async function updateAnimeProgress(userAnimeId: string, newEpisode: number) {
  try {
    const session = await getSession()
    if (!session) {
      return { error: 'Usuário não autenticado.' }
    }

    if (!Number.isInteger(newEpisode) || newEpisode < 0) {
      return { error: 'Episódio inválido.' }
    }

    // Buscar registro atual e total de episódios do anime
    const { data: record, error: fetchError } = await supabaseServerClient
      .from('user_anime')
      .select('*, anime ( episodes )')
      .eq('id', userAnimeId)
      .eq('profile_id', session.profileId)
      .single()

    if (fetchError || !record) {
      return { error: 'Registro não encontrado ou sem permissão.' }
    }

    const totalEpisodes = record.anime 
      ? (record.anime as { episodes?: number | null }).episodes 
      : null

    if (totalEpisodes !== null && totalEpisodes !== undefined && newEpisode > totalEpisodes) {
      return { error: `Episódio máximo é ${totalEpisodes}.` }
    }

    const updates: {
      current_episode: number
      status?: string
      completed_at?: string | null
    } = {
      current_episode: newEpisode,
    }

    // Regras de Status baseadas no progresso
    const isCompleted = totalEpisodes !== null && totalEpisodes !== undefined && newEpisode === totalEpisodes

    if (isCompleted) {
      updates.status = LIBRARY_STATUS.COMPLETED
      updates.completed_at = new Date().toISOString()
    } else if (record.status === LIBRARY_STATUS.COMPLETED && newEpisode < record.current_episode) {
      // Se reduziu a partir do estado concluído
      updates.status = LIBRARY_STATUS.WATCHING
      updates.completed_at = null
    }

    const { error: updateError } = await supabaseServerClient
      .from('user_anime')
      .update(updates)
      .eq('id', userAnimeId)
      .eq('profile_id', session.profileId)

    if (updateError) {
      console.error('Update Anime Progress Error:', updateError)
      return { error: 'Não foi possível atualizar o progresso.' }
    }

    revalidatePath(`/anime`)
    revalidatePath(`/library`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected updateAnimeProgress Error:', error)
    return { error: 'Ocorreu um erro inesperado.' }
  }
}
