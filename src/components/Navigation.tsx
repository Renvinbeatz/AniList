'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Library, Clock, User } from 'lucide-react'
import { useEffect, useState } from 'react'

const navItems = [
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
      {/* Desktop Top Navigation */}
      <nav className={`hidden md:flex fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ease-cinema ${scrolled ? 'bg-background/80 backdrop-blur-md border-b border-border/50' : 'bg-transparent'}`}>
        <div className="container mx-auto max-w-[1200px] px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-h3 tracking-tight">
            Tracker
          </Link>
          <div className="flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/profile' && pathname.startsWith('/profile')) || (item.href === '/library' && pathname.startsWith('/library'))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-small transition-colors duration-150 relative ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-foreground rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-surface-2/70 backdrop-blur-xl border border-border rounded-xl flex items-center justify-around px-2 py-3 shadow-lg">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/profile' && pathname.startsWith('/profile')) || (item.href === '/library' && pathname.startsWith('/library'))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] transition-colors duration-150 gap-1 ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
