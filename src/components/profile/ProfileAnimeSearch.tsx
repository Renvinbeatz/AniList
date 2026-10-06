'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import { ImageIcon, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { animeCover, type ProfileAnimeOption } from '@/lib/profile-anime'
import { useProfileSearch } from './useProfileSearch'

export function CollectionCover({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false)
  const safeUrl = animeCover(url)
  return (
    <span className="relative flex h-16 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-3">
      {safeUrl && !failed
        ? <Image src={safeUrl} alt="" fill sizes="44px" className="object-cover" onError={() => setFailed(true)} />
        : <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
    </span>
  )
}

export function ProfileAnimeSearch({ label, selectedIds, disabled, onSelect }: {
  label: string
  selectedIds: number[]
  disabled: boolean
  onSelect: (anime: ProfileAnimeOption) => void
}) {
  const { query, setQuery, valid, current, retrySearch } = useProfileSearch<ProfileAnimeOption>('/api/profile/anime-search', disabled)
  const input = useRef<HTMLInputElement>(null)
  const inputId = useId()

  useEffect(() => { input.current?.focus() }, [])

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="text-sm font-medium">Buscar anime em {label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input ref={input} id={inputId} type="search" autoComplete="off" maxLength={100}
          placeholder="Digite o nome de um anime" value={query} className="pl-9" disabled={disabled}
          onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div aria-live="polite" aria-atomic="true" className="text-sm text-muted-foreground">
        {!valid && 'Digite pelo menos 2 caracteres para buscar.'}
        {valid && !current && <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Buscando animes…</span>}
        {current && 'results' in current && current.results.length === 0 && 'Nenhum anime encontrado. Tente outro nome.'}
      </div>
      {current && 'error' in current && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-destructive">{current.error}</p>
          <Button type="button" variant="outline" disabled={disabled} onClick={retrySearch}>Tentar busca novamente</Button>
        </div>
      )}
      {valid && current && 'results' in current && current.results.length > 0 && (
        <ul aria-label={`Resultados de busca em ${label}`} className="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
          {current.results.map((anime) => {
            const alreadySelected = selectedIds.includes(anime.anilist_id)
            return <li key={anime.anilist_id}>
              <button type="button" disabled={disabled || alreadySelected} onClick={() => onSelect(anime)}
                aria-label={`${alreadySelected ? 'Já adicionado' : 'Selecionar'}: ${anime.title}`}
                className="flex min-h-20 w-full items-center gap-3 rounded-md p-2 text-left outline-none transition-colors hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
                <CollectionCover key={anime.cover_image} url={anime.cover_image} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-snug">{anime.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{alreadySelected ? 'Já adicionado nesta coleção' : anime.year || 'Ano não informado'}</span>
                </span>
              </button>
            </li>
          })}
        </ul>
      )}
    </div>
  )
}
