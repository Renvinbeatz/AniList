'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addCollectionAnime } from '@/actions/profile-collections'
import { removeProfileFavorite, removeProfilePinnedAnime, reorderProfileFavorite, reorderProfilePinnedAnime } from '@/actions/profile'
import { animeTitle, type ProfileAnimeOption } from '@/lib/profile-anime'
import type { ProfileCollectionItem, ProfileCollectionKind, ProfileCollectionResult, ProfileCollectionsResult } from '@/lib/profile-collections'
import { CollectionCover, ProfileAnimeSearch } from './ProfileAnimeSearch'

type Mutation = (operation: () => Promise<ProfileCollectionResult>, message: string, onSuccess?: () => void) => void
const selectClass = 'min-h-11 rounded-lg border border-input bg-surface-2 px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'

export function ProfileCollectionsEditor({ collections }: { collections: ProfileCollectionsResult }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const locked = useRef(false)
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null)
  const mutate: Mutation = (operation, message, onSuccess) => {
    // Ref closes the gap before React paints disabled controls (double clicks).
    if (locked.current || pending) return
    locked.current = true
    setFeedback(null)
    startTransition(async () => {
      try {
        const result = await operation()
        if ('error' in result) {
          setFeedback({ error: true, message: result.code === 'UNAUTHORIZED' ? 'Sua sessão expirou. Entre novamente.' : result.error })
        } else {
          setFeedback({ error: false, message }); onSuccess?.()
        }
      } catch {
        setFeedback({ error: true, message: 'Não foi possível confirmar a alteração. Atualize as coleções antes de tentar novamente.' })
      } finally {
        locked.current = false
      }
    })
  }
  const refresh = () => startTransition(() => { setFeedback(null); router.refresh() })

  return (
    <section aria-label="Coleções do perfil" aria-busy={pending} className="space-y-6 border-t border-border pt-10">
      <div>
        <h2 className="text-lg font-medium">Coleções do perfil</h2>
        <p className="mt-1 text-sm text-muted-foreground">Escolha seus favoritos e os animes que quer destacar. Cada alteração é salva na hora.</p>
      </div>
      {pending && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Atualizando coleções…</p>}
      {feedback && <p role={feedback.error ? 'alert' : 'status'} className={`text-sm ${feedback.error ? 'text-destructive' : 'text-foreground'}`}>{feedback.message}</p>}
      {'error' in collections ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-destructive">{collections.error}</p>
          <Button type="button" variant="outline" disabled={pending} onClick={refresh}>Tentar carregar coleções novamente</Button>
        </div>
      ) : (
        <fieldset disabled={pending} className="min-w-0 space-y-8">
          <legend className="sr-only">Editar favoritos e fixados</legend>
          <CollectionPanel kind="favorites" items={collections.data.favorites} pending={pending} mutate={mutate} />
          <CollectionPanel kind="pinned" items={collections.data.pinned} pending={pending} mutate={mutate} />
        </fieldset>
      )}
      {feedback?.error && <Button type="button" variant="outline" disabled={pending} onClick={refresh}>Atualizar coleções</Button>}
    </section>
  )
}

function CollectionPanel({ kind, items, pending, mutate }: {
  kind: ProfileCollectionKind; items: ProfileCollectionItem[]; pending: boolean; mutate: Mutation
}) {
  const favorites = kind === 'favorites'
  const limit = favorites ? 10 : 6
  const label = favorites ? 'Favoritos' : 'Animes fixados'
  const [addingAt, setAddingAt] = useState<number | null>(null)
  const [selected, setSelected] = useState<ProfileAnimeOption | null>(null)
  const slots = Array.from({ length: limit }, (_, index) => index + 1)
  const free = slots.filter((position) => !items.some((item) => item.position === position))
  const remove = favorites ? removeProfileFavorite : removeProfilePinnedAnime
  const reorder = favorites ? reorderProfileFavorite : reorderProfilePinnedAnime
  const open = (position: number) => { setSelected(null); setAddingAt(position) }
  const close = () => { setAddingAt(null); setSelected(null) }

  return (
    <section aria-label={label} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{label} <span className="ml-1 text-sm font-normal text-muted-foreground">{items.length}/{limit}</span></h3>
          <p className="mt-1 text-xs text-muted-foreground">{free.length === 0 ? 'Coleção completa. Remova um anime para liberar uma vaga.' : `${free.length} ${free.length === 1 ? 'vaga disponível' : 'vagas disponíveis'}.`}</p>
        </div>
        <Button type="button" variant="outline" disabled={pending || free.length === 0} onClick={() => open(free[0])}>
          <Plus aria-hidden="true" />Adicionar em {label.toLowerCase()}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Escolher uma posição ocupada troca os dois animes. Remover deixa a vaga livre.</p>
      <ol className="space-y-2" aria-label={`Posições de ${label}`}>
        {slots.map((position) => {
          const item = items.find((entry) => entry.position === position)
          const title = item ? animeTitle(item.anime) : ''
          return <li key={position} data-position={position} className={`flex min-h-20 items-center gap-3 rounded-xl border p-3 ${item ? 'border-border bg-surface-2/30' : 'border-dashed border-border'}`}>
            <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground">{position}</span>
            {item ? <>
              <CollectionCover key={`${item.anime_id}-${item.anime.cover_image}`} url={item.anime.cover_image} />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium leading-snug">{title}</p>
                <label className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  Posição
                  <select aria-label={`Mover ${title} para posição em ${label}`} value={position} disabled={pending} className={selectClass}
                    onChange={(event) => mutate(() => reorder(item.anime_id, Number(event.target.value)), 'Posição atualizada.')}>
                    {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </label>
              </div>
              <Button type="button" variant="ghost" className="h-11 w-11 shrink-0 px-0" disabled={pending}
                aria-label={`Remover ${title} de ${label}`} onClick={() => mutate(() => remove(item.anime_id), 'Anime removido.')}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </> : <button type="button" disabled={pending} onClick={() => open(position)}
              aria-label={`Adicionar anime na posição ${position} de ${label}`}
              className="flex min-h-11 flex-1 items-center gap-2 rounded-md text-left text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              <Plus className="h-4 w-4" aria-hidden="true" />Vaga livre
            </button>}
          </li>
        })}
      </ol>
      {addingAt !== null && <div className="space-y-4 rounded-xl border border-border-strong bg-surface-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium">Adicionar em {label.toLowerCase()}</h4>
          <Button type="button" variant="ghost" disabled={pending} onClick={close}>Cancelar</Button>
        </div>
        <ProfileAnimeSearch label={label} disabled={pending} selectedIds={items.map((item) => item.anime.anilist_id)} onSelect={setSelected} />
        {selected && <div className="space-y-3 border-t border-border pt-4">
          <p className="text-sm">Selecionado: <strong>{selected.title}</strong></p>
          <label className="flex items-center gap-3 text-sm">
            Salvar na posição
            <select aria-label={`Posição para adicionar em ${label}`} className={selectClass} value={addingAt} disabled={pending}
              onChange={(event) => setAddingAt(Number(event.target.value))}>
              {!free.includes(addingAt) && <option value={addingAt} disabled>{addingAt} (ocupada)</option>}
              {free.map((position) => <option key={position} value={position}>{position}</option>)}
            </select>
          </label>
          <Button type="button" className="min-h-11" disabled={pending || !free.includes(addingAt) || items.some((item) => item.anime.anilist_id === selected.anilist_id)}
            onClick={() => mutate(() => addCollectionAnime(kind, selected.anilist_id, addingAt), 'Anime adicionado.', close)}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Confirmar em {label.toLowerCase()}
          </Button>
        </div>}
      </div>}
    </section>
  )
}
