'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateProfileSettings } from '@/actions/profile'
import type { FavoriteCharacterDisplay, ProfileCharacter } from '@/lib/profile-character'
import { CollectionCover } from './ProfileAnimeSearch'
import { useProfileSearch } from './useProfileSearch'

export function ProfileCharacterEditor({ favorite }: { favorite: FavoriteCharacterDisplay }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<ProfileCharacter | null>(null)
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const locked = useRef(false)

  const save = (id: number | null) => {
    if (locked.current || pending) return
    locked.current = true
    setFeedback(null)
    startTransition(async () => {
      try {
        const result = await updateProfileSettings({ favorite_character_anilist_id: id })
        if ('error' in result) {
          setFeedback({ error: true, message: result.code === 'UNAUTHORIZED' ? 'Sua sessão expirou. Entre novamente.' : result.error ?? 'Não foi possível atualizar o personagem agora.' })
        } else {
          setSelected(null); setEditing(false)
          setFeedback({ error: false, message: id === null ? 'Personagem favorito removido.' : 'Personagem favorito atualizado.' })
        }
      } catch {
        setFeedback({ error: true, message: 'Não foi possível confirmar a alteração. Atualize o personagem antes de tentar novamente.' })
      } finally {
        locked.current = false
      }
    })
  }
  const refresh = () => startTransition(() => { setFeedback(null); router.refresh() })

  return (
    <section aria-label="Personagem favorito" aria-busy={pending} className="space-y-4 border-t border-border pt-8">
      <div>
        <h2 className="text-lg font-medium">Personagem favorito</h2>
        <p className="mt-1 text-sm text-muted-foreground">Escolha por nome e imagem. A escolha é salva ao confirmar.</p>
      </div>
      {feedback && <p role={feedback.error ? 'alert' : 'status'} className={`text-sm ${feedback.error ? 'text-destructive' : 'text-foreground'}`}>{feedback.message}</p>}
      {pending && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Atualizando personagem…</p>}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/30 p-4">
        <CollectionCover key={`${favorite.id}-${favorite.character?.image}`} url={favorite.character?.image ?? null} />
        <p className="min-w-0 flex-1 break-words text-sm font-medium">
          {favorite.character?.name ?? (favorite.id === null ? 'Nenhum personagem escolhido.' : 'Personagem salvo')}
        </p>
      </div>
      {favorite.error && <div className="space-y-2">
        <p role="status" className="text-sm text-muted-foreground">{favorite.error}</p>
        <Button type="button" variant="outline" disabled={pending} onClick={refresh}>Tentar carregar personagem novamente</Button>
      </div>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => { setSelected(null); setEditing(true); setFeedback(null) }}>
          {favorite.id === null ? 'Escolher personagem' : 'Trocar personagem'}
        </Button>
        {favorite.id !== null && <Button type="button" variant="ghost" disabled={pending} onClick={() => save(null)}>Remover personagem</Button>}
      </div>
      {editing && <div className="space-y-4 rounded-xl border border-border-strong bg-surface-1 p-4">
        <CharacterSearch disabled={pending} savedId={favorite.id} onSelect={setSelected} />
        {selected && <div className="flex items-center gap-3 border-t border-border pt-4">
          <CollectionCover key={selected.image} url={selected.image} />
          <p className="min-w-0 flex-1 break-words text-sm">Selecionado: <strong>{selected.name}</strong></p>
        </div>}
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending || !selected || selected.anilist_id === favorite.id} onClick={() => selected && save(selected.anilist_id)}>Confirmar personagem</Button>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => { setSelected(null); setEditing(false) }}>Cancelar escolha</Button>
        </div>
      </div>}
      {feedback?.error && <Button type="button" variant="outline" disabled={pending} onClick={refresh}>Atualizar personagem</Button>}
    </section>
  )
}

function CharacterSearch({ disabled, savedId, onSelect }: {
  disabled: boolean; savedId: number | null; onSelect: (character: ProfileCharacter) => void
}) {
  const { query, setQuery, valid, current, retrySearch } = useProfileSearch<ProfileCharacter>('/api/profile/character-search', disabled)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()
  useEffect(() => { input.current?.focus() }, [])
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="text-sm font-medium">Buscar personagem por nome</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input ref={input} id={id} type="search" autoComplete="off" maxLength={100} placeholder="Digite o nome de um personagem"
          value={query} disabled={disabled} className="pl-9" onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div aria-live="polite" aria-atomic="true" className="text-sm text-muted-foreground">
        {!valid && 'Digite pelo menos 2 caracteres para buscar.'}
        {valid && !current && <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Buscando personagens…</span>}
        {current && 'results' in current && current.results.length === 0 && 'Nenhum personagem encontrado. Tente outro nome.'}
      </div>
      {current && 'error' in current && <div className="space-y-2">
        <p role="alert" className="text-sm text-destructive">{current.error}</p>
        <Button type="button" variant="outline" disabled={disabled} onClick={retrySearch}>Tentar busca novamente</Button>
      </div>}
      {valid && current && 'results' in current && current.results.length > 0 && <ul aria-label="Resultados de busca de personagens" className="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
        {current.results.map((character) => <li key={character.anilist_id}>
          <button type="button" disabled={disabled || character.anilist_id === savedId} onClick={() => onSelect(character)}
            aria-label={`${character.anilist_id === savedId ? 'Já selecionado' : 'Selecionar'}: ${character.name}`}
            className="flex min-h-20 w-full items-center gap-3 rounded-md p-2 text-left outline-none transition-colors hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
            <CollectionCover key={character.image} url={character.image} />
            <span className="min-w-0 flex-1 break-words text-sm font-medium">{character.name}
              {character.anilist_id === savedId && <span className="mt-1 block text-xs font-normal text-muted-foreground">Seu personagem favorito atual</span>}
            </span>
          </button>
        </li>)}
      </ul>}
    </div>
  )
}
