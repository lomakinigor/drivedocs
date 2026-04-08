import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 w-full text-left ${
        onClick ? 'active:bg-slate-50 transition-colors' : ''
      } ${className}`}
    >
      {children}
    </Tag>
  )
}
