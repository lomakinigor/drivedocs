import { useEffect, useRef } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import type { EntityType } from '@/entities/types/domain'

interface InnStepProps {
  entityType: EntityType
  value: string
  onChange: (value: string) => void
}

const REQUIRED_LENGTH: Record<EntityType, number> = {
  IP: 12,
  OOO: 10,
}

function getValidationState(value: string, entityType: EntityType): 'empty' | 'valid' | 'invalid' {
  if (!value) return 'empty'
  const required = REQUIRED_LENGTH[entityType]
  if (/^\d+$/.test(value) && value.length === required) return 'valid'
  return 'invalid'
}

export function InnStep({ entityType, value, onChange }: InnStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const requiredLength = REQUIRED_LENGTH[entityType]
  const validation = getValidationState(value, entityType)

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleChange = (raw: string) => {
    // Allow only digits, limit to required length
    const digits = raw.replace(/\D/g, '').slice(0, requiredLength)
    onChange(digits)
  }

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={'0'.repeat(requiredLength)}
          maxLength={requiredLength}
          className={`w-full px-4 py-4 pr-12 text-xl font-mono tracking-widest text-slate-900 placeholder-slate-200 bg-white border-2 rounded-2xl outline-none transition-colors ${
            validation === 'valid'
              ? 'border-green-400'
              : validation === 'invalid'
              ? 'border-red-300'
              : 'border-slate-200 focus:border-blue-500'
          }`}
        />
        {validation !== 'empty' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {validation === 'valid' ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <AlertCircle size={20} className="text-red-400" />
            )}
          </div>
        )}
      </div>

      {/* Status hint */}
      <div className="px-1 space-y-1">
        {validation === 'invalid' && (
          <p className="text-xs text-red-500">
            ИНН {entityType === 'IP' ? 'ИП' : 'ООО'} должен содержать {requiredLength} цифр.
            Сейчас: {value.length}
          </p>
        )}
        {validation === 'empty' && (
          <p className="text-xs text-slate-500">
            {entityType === 'IP'
              ? 'ИНН физлица — 12 цифр. Есть в паспорте или на сайте ФНС.'
              : 'ИНН организации — 10 цифр. Указан в свидетельстве о регистрации.'}
          </p>
        )}
        {validation === 'valid' && (
          <p className="text-xs text-green-600">Формат верный</p>
        )}
      </div>

      {/* 2026-05-15 — подсказка «можно позже» убрана: ИНН обязателен для путевого
          и договоров, без него документы недействительны. */}
    </div>
  )
}
