import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function Home() {
  if (await getSession()) redirect('/dashboard')
  return <LandingPage />
}
