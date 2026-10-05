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
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-background animate-in fade-in slide-in-from-bottom-2 duration-320 ease-cinema">
      <div className="w-full max-w-[360px] space-y-12 relative z-10">
        <div className="space-y-4 text-center">
          <h1 className="text-h1 text-foreground tracking-tight">AniList</h1>
          <p className="text-body text-muted-foreground">
            Acompanhe a sua coleção de obras.
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-small text-muted-foreground ml-1">
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
              aria-invalid={!!state?.error}
              aria-describedby={state?.error ? "login-error" : undefined}
              className="h-12 text-body px-4 bg-surface-1 border-border focus-visible:ring-1 focus-visible:ring-accent focus-visible:border-accent transition-colors duration-220 ease-cinema"
            />
          </div>

          {state?.error && (
            <p id="login-error" className="text-small text-destructive text-center">{state.error}</p>
          )}

          <Button type="submit" className="w-full h-12 text-body font-medium transition-colors duration-220 ease-cinema" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin opacity-70" />
                <span>Entrando...</span>
              </>
            ) : (
              'Continuar'
            )}
          </Button>
        </form>
      </div>
    </main>
  )
}
