import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata = { title: 'Entrar' }

export default async function LoginPage() {
  if (await getSession()) redirect('/dashboard')
  return <AuthForm key="login" mode="login" />
}
