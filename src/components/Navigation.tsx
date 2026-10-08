'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Library, Clock, User, CalendarDays, Users, MessagesSquare, Bell } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'

const desktopMainItems = [
  { href: '/dashboard', label: 'Início' },
  { href: '/search', label: 'Explorar' },
  { href: '/library', label: 'Biblioteca' },
  { href: '/calendar', label: 'Calendário' },
  { href: '/today', label: 'Hoje' },
]

const mobileItems = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/search', label: 'Buscar', icon: Search },
  { href: '/library', label: 'Biblioteca', icon: Library },
  { href: '/today', label: 'Hoje', icon: Clock },
  { href: '/profile', label: 'Perfil', icon: User },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[100] bg-foreground text-background px-4 py-2 rounded-md font-medium shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Pular para o conteúdo principal
      </a>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-5 lg:gap-12">
            <Link href="/dashboard" aria-label="Anicat — Início" className="shrink-0 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <BrandLogo />
            </Link>
            <nav aria-label="Navegação Principal Desktop" className="hidden items-center gap-3 lg:flex lg:gap-6">
              {desktopMainItems.map((item) => {
                // For /anime/[id], we could highlight something, but prompt says: "Detalhe de anime não deve necessariamente criar um sexto item ativo."
                // I will just highlight the exact match for these.
                const isExactActive = pathname === item.href || (item.href === '/library' && pathname.startsWith('/library'))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isExactActive ? 'page' : undefined}
                    className={`inline-flex min-h-11 items-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isExactActive ? 'text-foreground font-medium' : 'text-text-3 hover:text-foreground'}`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-3">
            <Link href="/community" aria-label="Comunidade" className="flex h-11 w-11 items-center justify-center rounded-xl text-text-3 hover:bg-surface-2"><MessagesSquare className="h-5 w-5" aria-hidden="true" /></Link>
            <Link href="/notifications" aria-label="Notificações" className="flex h-11 w-11 items-center justify-center rounded-xl text-text-3 hover:bg-surface-2"><Bell className="h-5 w-5" aria-hidden="true" /></Link>
            <Link href="/people" aria-label="Encontrar pessoas" className="hidden h-11 w-11 items-center justify-center rounded-xl text-text-3 hover:bg-surface-2 sm:flex"><Users className="h-5 w-5" aria-hidden="true" /></Link>
            <Link
              href="/calendar"
              aria-current={pathname === '/calendar' ? 'page' : undefined}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-text-3 hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-current:bg-surface-2 aria-current:text-foreground lg:hidden"
              aria-label="Calendário"
            >
              <CalendarDays className="h-5 w-5 stroke-[1.5px]" aria-hidden="true" />
            </Link>
            <Link 
              href="/profile" 
              aria-current={pathname.startsWith('/profile') ? 'page' : undefined}
              className={`hidden h-11 w-11 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex ${pathname.startsWith('/profile') ? 'text-foreground bg-surface-2' : 'text-text-3 hover:text-foreground hover:bg-surface-1'}`}
              aria-label="Perfil"
            >
              <User className="w-5 h-5 stroke-[1.5px]" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav aria-label="Navegação Principal Mobile" className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 lg:hidden">
        <div className="flex items-center justify-around rounded-2xl border border-border-strong bg-surface-2/95 px-1 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {mobileItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/profile' && pathname.startsWith('/profile')) || (item.href === '/library' && pathname.startsWith('/library'))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-12 min-w-11 flex-col items-center justify-center gap-1.5 rounded-xl px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-surface-3 text-foreground' : 'text-text-3 hover:text-foreground/80'}`}
              >
                <Icon className={`w-5 h-5 stroke-[1.5px] ${isActive ? 'stroke-[2px]' : ''}`} aria-hidden="true" />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
