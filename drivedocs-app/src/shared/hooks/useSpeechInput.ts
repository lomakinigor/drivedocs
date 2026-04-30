import { useRef, useState } from 'react'

interface UseSpeechInputOptions {
  onResult: (text: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any

export function useSpeechInput({ onResult }: UseSpeechInputOptions) {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<AnyRecognition>(null)

  const SpeechAPI =
    typeof window !== 'undefined'
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null

  const supported = !!SpeechAPI

  const start = () => {
    if (!SpeechAPI || isListening) return
    setError(null)

    const rec: AnyRecognition = new SpeechAPI()
    rec.lang = 'ru-RU'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false

    rec.onstart = () => setIsListening(true)
    rec.onend = () => setIsListening(false)

    rec.onerror = (e: AnyRecognition) => {
      setIsListening(false)
      if (e.error === 'not-allowed') {
        setError('Нет доступа к микрофону')
      } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
        setError('Не удалось распознать речь')
      }
    }

    rec.onresult = (e: AnyRecognition) => {
      const transcript: string = e.results[0][0].transcript
      onResult(transcript)
    }

    recRef.current = rec
    rec.start()
  }

  const stop = () => {
    recRef.current?.stop()
    setIsListening(false)
  }

  return { isListening, start, stop, error, supported }
}
