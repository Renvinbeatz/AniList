'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Library, Clock, User } from 'lucide-react'
import { useEffect, useState } from 'react'

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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[100] bg-foreground text-background px-4 py-2 rounded-md font-medium shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Pular para o conteúdo principal
      </a>
      {/* Desktop Top Navigation */}
      <nav aria-label="Navegação Principal Desktop" className={`hidden md:flex fixed top-0 left-0 right-0 z-50 transition-colors duration-320 ease-cinema ${scrolled ? 'bg-background/80 backdrop-blur-md border-b border-border/50' : 'bg-transparent'}`}>
        <div className="container mx-auto max-w-[1200px] px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-semibold text-h3 tracking-tight hover:opacity-80 transition-opacity">
              Tracker
            </Link>
            <div className="hidden lg:flex items-center gap-6 ml-4">
              {desktopMainItems.map((item) => {
                // For /anime/[id], we could highlight something, but prompt says: "Detalhe de anime não deve necessariamente criar um sexto item ativo."
                // I will just highlight the exact match for these.
                const isExactActive = pathname === item.href || (item.href === '/library' && pathname.startsWith('/library'))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isExactActive ? 'page' : undefined}
                    className={`text-small transition-colors duration-150 relative ${isExactActive ? 'text-foreground font-medium' : 'text-text-3 hover:text-foreground'}`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/search" 
              className={`p-2 rounded-full transition-colors duration-150 ${pathname === '/search' ? 'text-foreground bg-surface-2' : 'text-text-3 hover:text-foreground hover:bg-surface-1'}`}
              aria-label="Buscar"
            >
              <Search className="w-5 h-5 stroke-[1.5px]" />
            </Link>
            <Link 
              href="/profile" 
              aria-current={pathname.startsWith('/profile') ? 'page' : undefined}
              className={`p-2 rounded-full transition-colors duration-150 ${pathname.startsWith('/profile') ? 'text-foreground bg-surface-2' : 'text-text-3 hover:text-foreground hover:bg-surface-1'}`}
              aria-label="Perfil"
            >
              <User className="w-5 h-5 stroke-[1.5px]" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav aria-label="Navegação Principal Mobile" className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-surface-2/90 backdrop-blur-xl border border-border-strong rounded-2xl flex items-center justify-around px-2 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {mobileItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/profile' && pathname.startsWith('/profile')) || (item.href === '/library' && pathname.startsWith('/library'))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] transition-colors duration-150 gap-1.5 ${isActive ? 'text-foreground' : 'text-text-3 hover:text-foreground/80'}`}
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
