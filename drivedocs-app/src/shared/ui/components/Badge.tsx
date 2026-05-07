type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'slate' | 'violet'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  blue:   'bg-blue-100 text-blue-700 border border-blue-200/50',
  green:  'bg-emerald-100 text-emerald-700 border border-emerald-200/50',
  yellow: 'bg-amber-100 text-amber-700 border border-amber-200/50',
  red:    'bg-red-100 text-red-700 border border-red-200/50',
  slate:  'bg-slate-100 text-slate-600 border border-slate-200/50',
  violet: 'bg-violet-100 text-violet-700 border border-violet-200/50',
}

export function Badge({ children, variant = 'slate' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}
