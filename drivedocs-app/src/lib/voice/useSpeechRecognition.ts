import { useCallback, useEffect, useRef, useState } from 'react'

// Web Speech API (распознавание речи в браузере).
// Работает в Chrome / Edge / Safari iOS 14.5+. На остальных — supported=false,
// UI скрывает кнопку микрофона.

interface SpeechRecognitionResult {
  transcript: string
  isFinal: boolean
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: ArrayLike<ArrayLike<SpeechRecognitionResult>>
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface UseSpeechRecognitionResult {
  supported: boolean
  listening: boolean
  start: () => void
  stop: () => void
  error: string | null
}

export function useSpeechRecognition(options: {
  lang?: string
  onTranscript: (text: string, isFinal: boolean) => void
}): UseSpeechRecognitionResult {
  const { lang = 'ru-RU', onTranscript } = options
  const [supported] = useState(() => getRecognitionCtor() !== null)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    setError(null)
    try {
      const rec = new Ctor()
      rec.lang = lang
      rec.continuous = true
      rec.interimResults = true
      rec.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i][0]
          onTranscriptRef.current(result.transcript, e.results[i].length > 0 && (e.results[i] as unknown as { isFinal: boolean }).isFinal)
        }
      }
      rec.onerror = (e) => {
        // not-allowed = пользователь отказал, no-speech = тишина — оба не критичны
        if (e.error === 'no-speech' || e.error === 'aborted') return
        setError(e.error === 'not-allowed' ? 'Доступ к микрофону запрещён' : `Ошибка: ${e.error}`)
        setListening(false)
      }
      rec.onend = () => {
        setListening(false)
      }
      rec.start()
      recognitionRef.current = rec
      setListening(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось запустить распознавание')
      setListening(false)
    }
  }, [lang])

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      /* ignore */
    }
    setListening(false)
  }, [])

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return { supported, listening, start, stop, error }
}
