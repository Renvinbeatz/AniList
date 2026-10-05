'use client'

import { useActionState } from 'react'
import { loginAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

const initialState = {
  error: null as string | null,
}

export default function Home() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-bg">
      {/* Subtle background static treatment */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] opacity-50" />
      </div>

      <div className="w-full max-w-md space-y-12 relative z-10">
        <div className="space-y-4 text-center">
          <h1 className="text-display text-foreground tracking-tight">AniList</h1>
          <p className="text-h3 text-muted-foreground font-normal">
            Esse é o seu lugar para acompanhar anime.
          </p>
        </div>

        <div className="bg-surface-1 border border-border p-8 rounded-2xl shadow-xl">
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-caption text-muted-foreground uppercase tracking-wider font-medium ml-1">
                Acesse seu perfil
              </label>
              <Input
                id="username"
                name="username"
                placeholder="Seu username"
                autoComplete="username"
                required
                minLength={3}
                maxLength={30}
                disabled={isPending}
                className="h-14 text-body px-4 bg-surface-2 border-border-strong rounded-xl focus-visible:ring-primary focus-visible:border-primary transition-colors duration-150 ease-cinema"
              />
            </div>

            {state?.error && (
              <p className="text-small font-medium text-destructive text-center bg-destructive/10 p-3 rounded-lg border border-destructive/20">{state.error}</p>
            )}

            <Button type="submit" className="w-full h-14 rounded-xl text-body font-medium transition-colors duration-150 ease-cinema" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
