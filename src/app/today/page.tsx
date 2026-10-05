import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getCalendarAirings } from '@/data/airing'
import { TodayClient } from './today-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

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
    <main className="container mx-auto max-w-[1200px] pt-24 md:pt-32 pb-32 md:pb-16 px-4 sm:px-6 md:px-8 space-y-12">
      {/* HEADER NAVEGAÇÃO PONTUAL */}
      <nav>
        <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground -ml-4 min-h-[44px] min-w-[44px] px-3">
          <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Dashboard</Link>
        </Button>
      </nav>

      <div className="space-y-4 max-w-3xl mx-auto text-center mt-4 mb-12">
        <h1 className="text-display text-foreground tracking-tight">Hoje</h1>
        <p className="text-h3 text-muted-foreground font-normal opacity-70">
          Acompanhe os lançamentos do dia.
        </p>
      </div>

      <TodayClient initialAirings={airings} />
    </main>
  )
}
