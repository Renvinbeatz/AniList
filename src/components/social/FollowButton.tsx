'use client'
import { useTransition, useState } from 'react'
import { followAction } from '@/actions/social'

export function FollowButton({ username, following }: { username: string; following: boolean }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return <div className="space-y-2">
    <button disabled={pending} className="min-h-11 rounded-full border border-border px-4 text-sm disabled:opacity-50" onClick={() => start(async () => {
      setError(null)
      try { const result = await followAction(username, !following); setError(result.error) }
      catch { setError('Não foi possível confirmar. Tente novamente.') }
    })}>{pending ? 'Salvando…' : following ? 'Deixar de seguir' : 'Seguir'}</button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>
}
