import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata = { title: 'Criar conta' }

export default async function SignupPage() {
  if (await getSession()) redirect('/dashboard')
  return <AuthForm key="signup" mode="signup" />
}
