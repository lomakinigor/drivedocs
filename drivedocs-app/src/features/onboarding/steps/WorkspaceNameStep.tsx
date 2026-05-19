import { useEffect, useRef } from 'react'
import type { EntityType } from '@/entities/types/domain'

interface WorkspaceNameStepProps {
  entityType: EntityType
  value: string
  onChange: (value: string) => void
}

const PLACEHOLDER: Record<EntityType, string> = {
  IP: 'ИП Иванов Александр',
  OOO: 'ООО Альфа-Торг',
}

const HINT: Record<EntityType, string> = {
  IP: 'Обычно пишут «ИП» и фамилию — так удобнее различать предприятия в приложении.',
  OOO: 'Введите название без кавычек и организационно-правовой формы или сразу с ними — как вам удобнее.',
}

export function WorkspaceNameStep({ entityType, value, onChange }: WorkspaceNameStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER[entityType]}
          maxLength={80}
          className="w-full px-4 py-4 text-base font-medium text-slate-900 placeholder-slate-300 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-colors"
        />
        <p className="text-xs text-slate-500 px-1 leading-relaxed">{HINT[entityType]}</p>
      </div>
    </div>
  )
}
