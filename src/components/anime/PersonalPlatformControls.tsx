'use client'

import { useOptimistic, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { deletePersonalPlatformAction, savePersonalPlatformAction, setPersonalPlatformAction } from '@/actions/personal-platforms'
import { validatePersonalPlatform, type PersonalPlatform } from '@/lib/platforms'
import { ExternalLink, Loader2 } from 'lucide-react'

export function PersonalPlatformControls({ anilistId, platforms, selectedIds }: { anilistId: number; platforms: PersonalPlatform[]; selectedIds: string[] }) {
  const [pending, startTransition] = useTransition(), busy = useRef(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false), [name, setName] = useState(''), [url, setUrl] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null), [message, setMessage] = useState<string | null>(null)
  const [selections, selectOptimistically] = useOptimistic(selectedIds, (current, change: { id: string; selected: boolean }) =>
    change.selected ? [...new Set([...current, change.id])] : current.filter(id => id !== change.id))
  function run(action: () => Promise<{ error: string | null }>, success: string, after?: () => void, before?: () => void) {
    if (busy.current) return
    busy.current = true
    setError(null); setMessage(null)
    startTransition(async () => {
      before?.()
      try { const result = await action(); if (result.error) setError(result.error); else { setMessage(success); after?.() } }
      catch { setError('Não foi possível confirmar a alteração. Confira suas plataformas antes de tentar novamente.') }
      finally { busy.current = false }
    })
  }
  function edit(platform?: PersonalPlatform) {
    setEditingId(platform?.id ?? null); setName(platform?.name ?? ''); setUrl(platform?.website_url ?? '')
    setFormOpen(true); setError(null); setMessage(null); setDeleteId(null)
  }
  return <section aria-label="Plataformas particulares" className="space-y-4 border-t border-border/50 pt-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h4 className="font-medium">Plataformas particulares</h4>
      <Button type="button" variant="outline" disabled={pending} onClick={() => edit()}>Criar plataforma</Button></div>
    <p className="text-sm text-muted-foreground">Salvas na sua conta e visíveis só para você. Marque onde assiste a este anime.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    {pending && <span role="status" className="inline-flex items-center gap-2 text-sm"><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />Salvando…</span>}
    {platforms.length === 0 && <p className="text-sm text-muted-foreground">Você ainda não criou plataformas particulares.</p>}
    <ul className="space-y-3">{platforms.map(platform => <li key={platform.id} className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 shrink-0 accent-white" checked={selections.includes(platform.id)} disabled={pending}
          onChange={event => {
            const selected = event.target.checked
            run(() => setPersonalPlatformAction(anilistId, platform.id, selected), 'Escolha de plataforma atualizada.', undefined, () => selectOptimistically({ id: platform.id, selected }))
          }} /><span className="break-all">{platform.name}</span></label>
        <div className="flex flex-wrap items-center gap-2">
          {platform.website_url && <a href={platform.website_url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${platform.name} (abre em nova aba)`} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-muted"><ExternalLink aria-hidden="true" className="h-4 w-4" /></a>}
          <Button type="button" variant="ghost" disabled={pending} onClick={() => edit(platform)} aria-label={`Editar ${platform.name}`}>Editar</Button>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => { setDeleteId(platform.id); setError(null); setMessage(null) }} aria-label={`Excluir ${platform.name}`}>Excluir</Button>
        </div>
      </div>
      {deleteId === platform.id && <div className="space-y-3 border-t border-border pt-3 text-sm">
        <p>Excluir “{platform.name}” da sua conta? Ela será removida de todos os seus animes.</p>
        <div className="flex flex-wrap gap-2"><Button type="button" disabled={pending} variant="destructive" onClick={() => run(() => deletePersonalPlatformAction(platform.id), 'Plataforma excluída.', () => { setDeleteId(null); if (editingId === platform.id) setFormOpen(false) })}>Confirmar exclusão</Button><Button type="button" variant="outline" disabled={pending} onClick={() => setDeleteId(null)}>Cancelar exclusão</Button></div>
      </div>}
    </li>)}</ul>
    {formOpen && <form aria-label={editingId ? 'Editar plataforma particular' : 'Criar plataforma particular'} className="space-y-4 rounded-lg border border-border p-4" onSubmit={event => {
      event.preventDefault()
      const parsed = validatePersonalPlatform({ name, website_url: url })
      if (!parsed.data) { setError(parsed.error); return }
      run(() => savePersonalPlatformAction(parsed.data, editingId ?? undefined), 'Plataforma salva.', () => { setFormOpen(false); setEditingId(null); setName(''); setUrl('') })
    }}>
      <div className="space-y-2"><Label htmlFor="personal-platform-name">Nome da plataforma</Label><Input id="personal-platform-name" value={name} onChange={event => setName(event.target.value)} required disabled={pending} autoFocus /></div>
      <div className="space-y-2"><Label htmlFor="personal-platform-url">Link da plataforma (opcional)</Label><Input id="personal-platform-url" type="url" placeholder="https://..." value={url} onChange={event => setUrl(event.target.value)} disabled={pending} maxLength={2000} /></div>
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={pending}>Salvar plataforma</Button><Button type="button" variant="outline" disabled={pending} onClick={() => { setFormOpen(false); setError(null) }}>Cancelar edição</Button></div>
    </form>}
  </section>
}
