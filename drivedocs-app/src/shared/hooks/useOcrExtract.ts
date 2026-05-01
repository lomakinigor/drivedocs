import { useState } from 'react'
import type { ReceiptCategory } from '@/entities/types/domain'

export interface OcrReceiptResult {
  amount?: string
  date?: string
  description?: string
  category?: ReceiptCategory
}

export type OcrStatus = 'idle' | 'loading' | 'done' | 'bad_quality' | 'unavailable'

export interface UseOcrExtractReturn {
  extract: (base64: string) => Promise<void>
  result: OcrReceiptResult | null
  status: OcrStatus
  clear: () => void
}

// When backend proxy is ready, replace this stub with:
//   const res = await fetch('/api/ocr/receipt', { method: 'POST', body: JSON.stringify({ image: base64 }) })
//   return res.json() as Promise<OcrReceiptResult>
async function callOcrApi(_base64: string): Promise<OcrReceiptResult> {
  throw new Error('OCR_NOT_AVAILABLE')
}

export function useOcrExtract(): UseOcrExtractReturn {
  const [result, setResult] = useState<OcrReceiptResult | null>(null)
  const [status, setStatus] = useState<OcrStatus>('idle')

  const extract = async (base64: string) => {
    setStatus('loading')
    setResult(null)
    try {
      const data = await callOcrApi(base64)
      setResult(data)
      setStatus('done')
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'OCR_NOT_AVAILABLE') {
        setStatus('unavailable')
      } else if (msg === 'OCR_BAD_QUALITY') {
        setStatus('bad_quality')
      } else {
        setStatus('bad_quality')
      }
    }
  }

  const clear = () => {
    setResult(null)
    setStatus('idle')
  }

  return { extract, result, status, clear }
}
