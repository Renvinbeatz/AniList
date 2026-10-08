'use client'

import { useActionState } from 'react'
import Link from 'next/link'

import { loginWithUsernameAction, signupWithUsernameAction } from '@/actions/auth-v3'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Loader2 } from 'lucide-react'

const initialState = {
  error: null as string | null,
}

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [stateV3Login, formActionV3Login, isPendingV3Login] = useActionState(loginWithUsernameAction, initialState)
  const [stateV3Signup, formActionV3Signup, isPendingV3Signup] = useActionState(signupWithUsernameAction, initialState)

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-background animate-in fade-in slide-in-from-bottom-2 duration-320 ease-cinema">
      <div className="w-full max-w-[360px] space-y-12 relative z-10">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">← Voltar para a Anicat</Link>
        <div className="space-y-4 text-center">
          <h1><BrandLogo hero /></h1>
          <p className="text-body text-muted-foreground">
            Community & Anime List
          </p>
          <div className="flex justify-center gap-2 mt-4 text-sm">
            <Link href="/login" aria-current={mode === 'login' ? 'page' : undefined} className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-muted-foreground hover:text-foreground aria-current:bg-surface-2 aria-current:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Já tenho conta</Link>
            <Link href="/signup" aria-current={mode === 'signup' ? 'page' : undefined} className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-muted-foreground hover:text-foreground aria-current:bg-surface-2 aria-current:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Quero criar conta</Link>
          </div>
        </div>

        {mode === 'login' && (
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
              <p role="alert" className="text-small text-destructive text-center">{stateV3Login.error}</p>
            )}

            <Button type="submit" className="w-full h-12 text-body font-medium" disabled={isPendingV3Login}>
              {isPendingV3Login ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar'}
            </Button>
          </form>
        )}

        {mode === 'signup' && (
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
              <p role="alert" className="text-small text-destructive text-center">{stateV3Signup.error}</p>
            )}

            <Button type="submit" className="w-full h-12 text-body font-medium" disabled={isPendingV3Signup}>
              {isPendingV3Signup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Criar conta'}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
