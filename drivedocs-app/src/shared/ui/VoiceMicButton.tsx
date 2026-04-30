import { Mic, MicOff } from 'lucide-react'
import { useSpeechInput } from '@/shared/hooks/useSpeechInput'

interface VoiceMicButtonProps {
  onResult: (text: string) => void
  className?: string
}

export function VoiceMicButton({ onResult, className = '' }: VoiceMicButtonProps) {
  const { isListening, start, stop, error, supported } = useSpeechInput({ onResult })

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={isListening ? stop : start}
      title={error ?? (isListening ? 'Нажмите, чтобы остановить' : 'Голосовой ввод')}
      aria-label={isListening ? 'Остановить запись' : 'Голосовой ввод'}
      className={`shrink-0 p-2 rounded-xl transition-colors ${
        isListening
          ? 'text-red-500 bg-red-50 active:bg-red-100'
          : error
            ? 'text-slate-300'
            : 'text-slate-400 active:bg-slate-100'
      } ${className}`}
    >
      {isListening ? (
        <MicOff size={17} className="animate-pulse" />
      ) : (
        <Mic size={17} />
      )}
    </button>
  )
}
