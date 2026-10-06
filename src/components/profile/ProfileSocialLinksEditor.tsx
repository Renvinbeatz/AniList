'use client'

import { useRef, useState, useTransition } from 'react'
import { updateProfileSocialLinks } from '@/actions/profile-social-links'
import { parseProfileSocialLinks, SOCIAL_PLATFORMS, type ProfileSocialLinks } from '@/lib/profile-social-links'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export function ProfileSocialLinksEditor({ saved }: { saved: unknown }) {
  const parsed = parseProfileSocialLinks(saved)
  const initial = 'data' in parsed ? parsed.data ?? {} : {}
  const [baseline, setBaseline] = useState<ProfileSocialLinks>(initial)
  const [draft, setDraft] = useState<ProfileSocialLinks>(initial)
  const [pending, startTransition] = useTransition()
  const busy = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy.current) return
    setError(null); setSuccess(false)
    const result = parseProfileSocialLinks(draft)
    if ('error' in result) { setError(result.error); return }
    busy.current = true
    startTransition(async () => {
      try {
        const response = await updateProfileSocialLinks(result.data)
        if ('error' in response) setError(response.error ?? 'Não foi possível salvar os links agora.')
        else { setBaseline(result.data ?? {}); setDraft(result.data ?? {}); setSuccess(true) }
      } catch {
        setError('Não foi possível confirmar o salvamento. Recarregue e tente novamente.')
      } finally { busy.current = false }
    })
  }
  return <section aria-labelledby="social-links-title" className="space-y-5">
    <div><h2 id="social-links-title" className="text-base font-medium">Links sociais</h2>
      <p className="text-sm text-muted-foreground">Links opcionais para suas redes. Eles seguem a visibilidade do perfil. Deixe um campo vazio para removê-lo.</p></div>
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-border/40 bg-surface-2/30 p-5">
      <fieldset disabled={pending} className="space-y-4">
        <legend className="sr-only">Endereços das redes sociais</legend>
        {SOCIAL_PLATFORMS.map(platform => <div key={platform.id} className="space-y-2">
          <Label htmlFor={`social-${platform.id}`}>{platform.label}</Label>
          <Input id={`social-${platform.id}`} type="url" maxLength={2000}
            placeholder={`https://${platform.hosts[0]}/...`} value={draft[platform.id] ?? ''}
            onChange={event => { setDraft(current => ({ ...current, [platform.id]: event.target.value })); setSuccess(false); setError(null) }} />
        </div>)}
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="text-sm text-muted-foreground">Links sociais atualizados.</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="ghost" disabled={pending} onClick={() => { setDraft(baseline); setError(null); setSuccess(false) }}>Descartar links</Button>
        <Button type="submit" disabled={pending}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar links</Button>
      </div>
    </form>
  </section>
}
