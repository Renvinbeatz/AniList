'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from 'cn'

export interface PosterCardProps {
  href: string
  imageUrl?: string | null
  altText?: string
  title?: string | null
  subtitle?: React.ReactNode
  
  /** Valor de 0 a 100 para exibir barra de progresso */
  progressPercent?: number
  
  /** Badge no canto superior esquerdo (ex: ícone de status) */
  topBadgeIcon?: React.ReactNode
  
  /** Diminui a opacidade inicial (útil para shelves de 'concluídos') */
  dimmed?: boolean
  
  /** Classes extras para o wrapper principal */
  className?: string
  
  /** Classes extras para ajustar o aspect ratio e layout do poster */
  posterClassName?: string
  
  /** Elementos extras para renderizar sobre o poster (ex: badges no canto superior direito) */
  children?: React.ReactNode
}

export function PosterCard({
  href,
  imageUrl,
  altText = 'Capa',
  title,
  subtitle,
  progressPercent,
  topBadgeIcon,
  dimmed = false,
  className,
  posterClassName,
  children,
}: PosterCardProps) {
  return (
    <Link 
      href={href} 
      className={cn(
        "group flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md",
        className
      )}
    >
      <div className={cn(
        "w-full aspect-[2/3] relative rounded-md overflow-hidden bg-surface-2",
        dimmed && "opacity-80 group-hover:opacity-100 transition-opacity duration-220 ease-cinema",
        posterClassName
      )}>
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={altText} 
            fill 
            sizes="(max-width: 768px) 33vw, 20vw" 
            className="object-cover transition-transform duration-220 ease-cinema group-hover:scale-[1.02]" 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-caption">
            Sem capa
          </div>
        )}
        
        {/* Dark overlay no hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-220" />
        
        {/* Badge de status opcional */}
        {topBadgeIcon && (
          <div className="absolute top-2 left-2 flex items-center justify-center bg-black/40 backdrop-blur-md p-1.5 rounded text-[10px] text-white shadow-sm border border-white/10">
            {topBadgeIcon}
          </div>
        )}
        
        {/* Render extra elements on top of the poster */}
        {children}
      </div>

      {/* Metadados */}
      {(title || subtitle || typeof progressPercent === 'number') && (
        <div className="flex flex-col gap-1.5">
          {title && (
            <h4 className="font-medium text-small leading-tight line-clamp-2 text-foreground group-hover:text-foreground/80 transition-opacity duration-150">
              {title}
            </h4>
          )}
          {subtitle && (
            <div className="flex justify-between items-center text-caption text-muted-foreground normal-case capitalize">
              {subtitle}
            </div>
          )}
          {typeof progressPercent === 'number' && (
            <div className="h-1 w-full bg-border rounded-full overflow-hidden mt-0.5">
              <div 
                className="h-full bg-accent" 
                style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} 
              />
            </div>
          )}
        </div>
      )}
    </Link>
  )
}
