import { Navigation } from '@/components/Navigation'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getCalendarAirings } from '@/data/airing'
import { CalendarClient } from './calendar-client'
export const metadata = {
  title: 'Calendário',
}

export default async function CalendarPage() {
  const session = await getSession()
  if (!session?.profileId) {
    redirect('/login')
  }

  // Para garantir que cobrimos os próximos 7 dias em qualquer fuso horário,
  // buscamos de Ontem até Hoje + 8 dias em UTC.
  const now = new Date()
  const startDate = new Date(now)
  startDate.setUTCDate(startDate.getUTCDate() - 1)
  
  const endDate = new Date(now)
  endDate.setUTCDate(endDate.getUTCDate() + 8)

  const airings = await getCalendarAirings(session.profileId, startDate, endDate)

  return (
    <>
      <Navigation />
      <main id="main-content" className="container mx-auto max-w-[1200px] pt-24 md:pt-32 pb-32 lg:pb-16 px-4 sm:px-6 md:px-8 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-320 ease-cinema">
        <header className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-h1 text-foreground tracking-tight">Calendário</h1>
            <p className="text-body text-muted-foreground">
              Próximos episódios dos animes que você acompanha.
            </p>
          </div>
        </header>

      <CalendarClient initialAirings={airings} />
    </main>
    </>
  )
}
