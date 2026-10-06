'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileSettings } from '@/actions/profile'
import { AVATAR_PRESETS, type AvatarPreset } from '@/lib/validations/profile'
import { Button } from '@/components/ui/button'
import { ProfileAvatar } from './ProfileAvatar'

export function ProfileAvatarEditor({ saved }: { saved: string | null }) {
  const router = useRouter()
  const [selected, setSelected] = useState<AvatarPreset | null>(null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const busy = useRef(false)
  const current = saved ?? 'black'
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
    <p className="text-sm text-muted-foreground">Escolha um avatar. Estas cores são opções temporárias do catálogo.</p>
    <div role="group" aria-label="Avatares disponíveis" className="flex flex-wrap gap-4">
      {AVATAR_PRESETS.map(avatar => <button key={avatar.id} type="button" disabled={pending}
        aria-label={`Escolher avatar ${avatar.label.toLowerCase()}`} aria-pressed={(selected ?? current) === avatar.id}
        onClick={() => { setSelected(avatar.id); setMessage(null) }}
        className="space-y-2 rounded-xl p-2 text-sm ring-offset-background aria-pressed:ring-2 aria-pressed:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
        <ProfileAvatar preset={avatar.id} className="h-16 w-16" />
        <span className="block">{avatar.label}{current === avatar.id ? ' · Atual' : ''}</span>
      </button>)}
    </div>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    <Button type="button" disabled={pending || !selected || selected === current} onClick={save}>
      {pending ? 'Salvando avatar…' : 'Salvar avatar'}
    </Button>
  </section>
}
