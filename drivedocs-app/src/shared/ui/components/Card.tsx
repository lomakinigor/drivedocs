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
      className={`bg-white rounded-2xl border border-slate-100/70 w-full text-left
        shadow-[0_2px_12px_oklch(22%_0.028_280/0.06),_0_1px_3px_oklch(22%_0.028_280/0.04)]
        ${onClick
          ? 'active:scale-[0.99] active:bg-slate-50/50 transition-all duration-150'
          : ''
        } ${className}`}
    >
      {children}
    </Tag>
  )
}
