'use client'

import { useActionState, useState } from 'react'

import { loginWithUsernameAction, signupWithUsernameAction } from '@/actions/auth-v3'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

const initialState = {
  error: null as string | null,
}

export default function Home() {
  const [mode, setMode] = useState<'v3-login' | 'v3-signup'>('v3-login')
  const [stateV3Login, formActionV3Login, isPendingV3Login] = useActionState(loginWithUsernameAction, initialState)
  const [stateV3Signup, formActionV3Signup, isPendingV3Signup] = useActionState(signupWithUsernameAction, initialState)

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-background animate-in fade-in slide-in-from-bottom-2 duration-320 ease-cinema">
      <div className="w-full max-w-[360px] space-y-12 relative z-10">
        <div className="space-y-4 text-center">
          <h1 className="text-h1 text-foreground tracking-tight">AniList</h1>
          <p className="text-body text-muted-foreground">
            Acompanhe a sua coleção de obras.
          </p>
          <div className="flex justify-center gap-2 mt-4 text-xs">
            <button type="button" onClick={() => setMode('v3-login')} className={mode === 'v3-login' ? 'font-bold underline' : ''}>V3 Login</button>
            <button type="button" onClick={() => setMode('v3-signup')} className={mode === 'v3-signup' ? 'font-bold underline' : ''}>V3 Signup</button>
          </div>
        </div>

        {mode === 'v3-login' && (
          <form action={formActionV3Login} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username-v3-login" className="text-small text-muted-foreground ml-1">
                  Username
                </label>
                <Input
                  id="username-v3-login"
                  name="username"
                  placeholder="Seu username"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={30}
                  disabled={isPendingV3Login}
                  className="h-12 text-body px-4 bg-surface-1 border-border"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password-v3-login" className="text-small text-muted-foreground ml-1">
                  Senha
                </label>
                <Input
                  id="password-v3-login"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  disabled={isPendingV3Login}
                  className="h-12 text-body px-4 bg-surface-1 border-border"
                />
              </div>
            </div>

            {stateV3Login?.error && (
              <p className="text-small text-destructive text-center">{stateV3Login.error}</p>
            )}

            <Button type="submit" className="w-full h-12 text-body font-medium" disabled={isPendingV3Login}>
              {isPendingV3Login ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar V3'}
            </Button>
          </form>
        )}

        {mode === 'v3-signup' && (
          <form action={formActionV3Signup} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username-v3-signup" className="text-small text-muted-foreground ml-1">
                  Criar Username
                </label>
                <Input
                  id="username-v3-signup"
                  name="username"
                  placeholder="Novo username"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={30}
                  disabled={isPendingV3Signup}
                  className="h-12 text-body px-4 bg-surface-1 border-border"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password-v3-signup" className="text-small text-muted-foreground ml-1">
                  Criar Senha
                </label>
                <Input
                  id="password-v3-signup"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  disabled={isPendingV3Signup}
                  className="h-12 text-body px-4 bg-surface-1 border-border"
                />
              </div>
            </div>

            {stateV3Signup?.error && (
              <p className="text-small text-destructive text-center">{stateV3Signup.error}</p>
            )}

            <Button type="submit" className="w-full h-12 text-body font-medium" disabled={isPendingV3Signup}>
              {isPendingV3Signup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Cadastrar V3'}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
