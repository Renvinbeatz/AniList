'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileSettings } from '@/actions/profile'
import { AVATAR_PRESETS, AVATAR_EXPRESSIONS, resolveAvatarPreset, type AvatarPreset } from '@/lib/validations/profile'
import { Button } from '@/components/ui/button'
import { ProfileAvatar } from './ProfileAvatar'

export function ProfileAvatarEditor({ saved }: { saved: string | null }) {
  const router = useRouter()
  const [selected, setSelected] = useState<AvatarPreset | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const busy = useRef(false)
  const current = resolveAvatarPreset(saved).id
  async function save() {
    if (!selected || busy.current) return
    busy.current = true
    setPending(true)
    setMessage(null)
    try {
      const result = await updateProfileSettings({ avatar_preset: selected })
      if ('error' in result) {
        setMessage(result.code === 'UNAUTHORIZED' ? 'Sua sessão expirou. Entre novamente.' : 'Não foi possível salvar o avatar. Tente novamente.')
      } else {
        setSelected(null)
        setMessage('Avatar atualizado.')
        router.refresh()
      }
    } catch {
      setMessage('Não foi possível confirmar o salvamento. Recarregue para conferir e tente novamente.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return <section aria-labelledby="avatar-heading" className="space-y-4">
    <h2 id="avatar-heading" className="text-base font-medium">Foto de perfil</h2>
    <p className="text-sm text-muted-foreground">Seu gato em quatro expressões e seis cores de fundo.</p>
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-1 p-3">
      <ProfileAvatar preset={selected ?? current} className="h-16 w-16" />
      <div className="min-w-0 space-y-1 text-sm">
        <p className="text-muted-foreground">{selected && selected !== current ? 'Prévia da escolha' : 'Avatar atual'}</p>
        <p>{resolveAvatarPreset(selected ?? current).label}</p>
      </div>
    </div>
    <div role="group" aria-label="Avatares disponíveis" className="space-y-5">
      {AVATAR_EXPRESSIONS.map(expression => <fieldset key={expression.id} className="min-w-0 space-y-3">
        <legend className="mb-3 text-sm font-medium">{expression.label}</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {AVATAR_PRESETS.filter(avatar => avatar.expression === expression.id).map(avatar => <button key={avatar.id} type="button" disabled={pending}
            title={avatar.label} aria-label={`Escolher ${avatar.description.toLowerCase()}`} aria-pressed={(selected ?? current) === avatar.id}
            onClick={() => { setSelected(avatar.id); setMessage(null) }}
            className="min-w-0 space-y-2 rounded-2xl p-1.5 text-xs ring-offset-background aria-pressed:ring-2 aria-pressed:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
            <ProfileAvatar preset={avatar.id} className="aspect-square w-full" />
            <span className="block">{avatar.colorLabel}</span>
          </button>)}
        </div>
      </fieldset>)}
    </div>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    <Button type="button" disabled={pending || !selected || selected === current} onClick={save}>
      {pending ? 'Salvando avatar…' : 'Salvar avatar'}
    </Button>
  </section>
}
