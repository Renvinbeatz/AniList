import { ensureAnimeAction, AnimeRecord } from '@/actions/anime'
import { fetchAniList } from '@/lib/anilist/client'
import { GET_AIRING_SCHEDULE_QUERY } from '@/lib/anilist/queries'
import { normalizeAiringSchedule } from '@/lib/anilist/normalize'
import type { AniListAiringResponse } from '@/lib/anilist/types'
import { getLastAiringSyncAt, upsertAiringSchedule } from '@/data/airing'

/**
 * Sincronização de airing: AniList → normalização → Supabase (`airing_schedule`).
 *
 * Este módulo é propositalmente SEM `'use server'`: não é uma Server Action e, portanto,
 * não pode ser invocado pelo navegador. Só é chamado por código de servidor (páginas).
 */

/** Janela buscada: episódios recentes (para contexto) e próximos (para "próximo episódio"/calendário futuro). */
const WINDOW_PAST_DAYS = 14
const WINDOW_FUTURE_DAYS = 60
const PER_PAGE = 50

/** Só vale sincronizar animes que ainda podem ter lançamentos. */
const SYNCABLE_ANIME_STATUSES = new Set(['RELEASING', 'NOT_YET_RELEASED'])

/** Sem airing futuro, só ressincroniza se o último sync tiver mais que isso. */
export const AIRING_SYNC_TTL_MS = 60 * 60 * 1000

/**
 * Freio em memória (complementar, melhor esforço) contra tentativas repetidas em sequência,
 * inclusive quando a AniList falha ou não tem schedule — casos em que não existe marcador no banco.
 * O estado persistente continua sendo o Supabase.
 */
const ATTEMPT_COOLDOWN_MS = 10 * 60 * 1000
const lastAttemptByAnilistId = new Map<number, number>()

const DAY_MS = 24 * 60 * 60 * 1000

export type SyncAiringResult =
  | { ok: true; synced: number; skipped: number }
  | { ok: false; error: string }

/**
 * Sincroniza o airing de um anime já conhecido localmente.
 * Em qualquer falha (AniList indisponível, resposta inválida, banco) NADA é apagado ou sobrescrito:
 * a função só faz upsert de dados válidos, depois de validar a resposta inteira.
 */
export async function syncAiringForAnime(anime: Pick<AnimeRecord, 'id' | 'anilist_id'>): Promise<SyncAiringResult> {
  try {
    const nowSec = Math.floor(Date.now() / 1000)

    const response = await fetchAniList<AniListAiringResponse>(
      GET_AIRING_SCHEDULE_QUERY,
      {
        mediaId: anime.anilist_id,
        from: nowSec - Math.floor((WINDOW_PAST_DAYS * DAY_MS) / 1000),
        to: nowSec + Math.floor((WINDOW_FUTURE_DAYS * DAY_MS) / 1000),
        perPage: PER_PAGE,
      },
      { noStore: true }
    )

    const schedules = response.data?.Page?.airingSchedules
    if (!Array.isArray(schedules)) {
      return { ok: false, error: 'Resposta de airing inválida recebida da AniList.' }
    }

    // Lista vazia é um resultado legítimo (anime sem schedule), não um erro.
    const { valid, skipped } = normalizeAiringSchedule(schedules, anime.anilist_id)
    await upsertAiringSchedule(anime.id, valid)

    return { ok: true, synced: valid.length, skipped }
  } catch (error: unknown) {
    console.error('syncAiringForAnime error:', error)
    return { ok: false, error: 'Não foi possível sincronizar os lançamentos agora.' }
  }
}

/**
 * Sincronização explícita por AniList ID.
 * Reutiliza `ensureAnimeAction` para localizar (ou criar uma única vez) o anime local.
 */
export async function syncAnimeAiring(anilistId: number): Promise<SyncAiringResult> {
  const { data: anime, error } = await ensureAnimeAction(anilistId)
  if (!anime) {
    return { ok: false, error: error ?? 'Anime não encontrado.' }
  }
  return syncAiringForAnime(anime)
}

/**
 * Estratégia atual (sem cron/worker): sincroniza sob demanda, e somente quando:
 *  1. o anime ainda pode ter lançamentos (RELEASING / NOT_YET_RELEASED);
 *  2. não existe um próximo episódio local (o chamador já verificou `getNextAiring`);
 *  3. o último sync (maior `updated_at` do anime em `airing_schedule`) é mais velho que o TTL;
 *  4. não houve tentativa recente neste processo.
 *
 * Retorna `true` se uma sincronização bem-sucedida gravou/atualizou dados.
 */
export async function refreshAiringIfStale(
  anime: Pick<AnimeRecord, 'id' | 'anilist_id' | 'status'>
): Promise<boolean> {
  if (!anime.status || !SYNCABLE_ANIME_STATUSES.has(anime.status)) return false

  const now = Date.now()
  const lastAttempt = lastAttemptByAnilistId.get(anime.anilist_id)
  if (lastAttempt !== undefined && now - lastAttempt < ATTEMPT_COOLDOWN_MS) return false

  try {
    const lastSync = await getLastAiringSyncAt(anime.id)
    if (lastSync && now - lastSync.getTime() < AIRING_SYNC_TTL_MS) return false
  } catch (error: unknown) {
    console.error('refreshAiringIfStale error:', error)
    return false
  }

  lastAttemptByAnilistId.set(anime.anilist_id, now)
  const result = await syncAiringForAnime(anime)
  return result.ok && result.synced > 0
}
