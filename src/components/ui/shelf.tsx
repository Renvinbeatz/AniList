import React from 'react'
import { cn } from 'cn'

export interface ShelfProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  headerClassName?: string
  scrollContainerClassName?: string
}

export function Shelf({ 
  title, 
  subtitle,
  children, 
  className,
  headerClassName,
  scrollContainerClassName
}: ShelfProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className={cn("flex flex-col gap-1 px-4 sm:px-0", headerClassName)}>
        <h3 className="text-h3 text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-muted-foreground text-small">{subtitle}</p>
        )}
      </div>
      
      <div className={cn(
        "flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 md:gap-6 pb-8 px-4 sm:px-0 -mx-4 sm:mx-0",
        scrollContainerClassName
      )}>
        {children}
      </div>
    </section>
  )
}
