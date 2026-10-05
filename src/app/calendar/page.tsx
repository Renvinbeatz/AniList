import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getCalendarAirings } from '@/data/airing'
import { CalendarClient } from './calendar-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Calendário',
}

export default async function CalendarPage() {
  const session = await getSession()
  if (!session?.profileId) {
    redirect('/')
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
    <main className="container mx-auto max-w-[1200px] pt-24 md:pt-32 pb-32 md:pb-16 px-4 sm:px-6 md:px-8 space-y-12">
      {/* HEADER NAVEGAÇÃO PONTUAL */}
      <nav>
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground -ml-4 min-h-[44px] min-w-[44px] px-3">
          <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Dashboard</Link>
        </Button>
      </nav>

      <div className="space-y-4 max-w-3xl mx-auto text-center mt-4 mb-12">
        <h1 className="text-display text-foreground tracking-tight">Calendário</h1>
        <p className="text-h3 text-muted-foreground font-normal opacity-70">
          Próximos episódios dos animes que você acompanha.
        </p>
      </div>

      <CalendarClient initialAirings={airings} />
    </main>
  )
}
