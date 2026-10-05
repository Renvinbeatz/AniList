import React from 'react'
import { cn } from 'cn'

export interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("py-16 md:py-24 flex flex-col items-center justify-center text-center space-y-4", className)}>
      {icon && (
        <div className="text-muted-foreground/50 mb-2">
          {icon}
        </div>
      )}
      
      <div className="space-y-1">
        {title && <h3 className="text-h3 text-foreground font-medium">{title}</h3>}
        {description && <p className="text-muted-foreground text-small max-w-md mx-auto">{description}</p>}
      </div>
      
      {action && (
        <div className="pt-4">
          {action}
        </div>
      )}
    </div>
  )
}
