import { Navigation } from '@/components/Navigation'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getCalendarAirings } from '@/data/airing'
import { TodayClient } from './today-client'

export const metadata = {
  title: 'Hoje',
}

export default async function TodayPage() {
  const session = await getSession()
  if (!session?.profileId) {
    redirect('/')
  }

  // Buscar uma janela segura em UTC para que o cliente
  // possa filtrar precisamente o dia "Hoje" local.
  // 1 dia antes e 1 dia depois.
  const now = new Date()
  const startDate = new Date(now)
  startDate.setUTCDate(startDate.getUTCDate() - 1)
  
  const endDate = new Date(now)
  endDate.setUTCDate(endDate.getUTCDate() + 1)

  const airings = await getCalendarAirings(session.profileId, startDate, endDate)

  return (
    <>
      <Navigation />
      <main id="main-content" className="container mx-auto max-w-[1200px] min-h-screen pt-24 md:pt-32 pb-32 md:pb-16 px-4 sm:px-6 md:px-8 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-320 ease-cinema">
        <header className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-h1 text-foreground tracking-tight">Hoje</h1>
            <p className="text-body text-muted-foreground">
              Acompanhe os lançamentos do dia.
            </p>
          </div>
        </header>

        <TodayClient initialAirings={airings} />
      </main>
    </>
  )
}
