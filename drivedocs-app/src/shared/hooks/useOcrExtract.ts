import { useState } from 'react'
import type { ReceiptCategory } from '@/entities/types/domain'

export interface OcrReceiptResult {
  amount?: string
  date?: string
  description?: string
  category?: ReceiptCategory
}

export interface UseOcrExtractReturn {
  extract: (base64: string) => Promise<void>
  result: OcrReceiptResult | null
  loading: boolean
  error: string | null
  clear: () => void
}

// When backend proxy is ready, replace this with:
//   POST /api/ocr/receipt { image: base64 } → OcrReceiptResult
async function callOcrApi(_base64: string): Promise<OcrReceiptResult> {
  throw new Error('OCR_NOT_AVAILABLE')
}

export function useOcrExtract(): UseOcrExtractReturn {
  const [result, setResult] = useState<OcrReceiptResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extract = async (base64: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await callOcrApi(base64)
      setResult(data)
    } catch (e) {
      const msg = e instanceof Error && e.message === 'OCR_NOT_AVAILABLE'
        ? 'Распознавание фото будет доступно в следующей версии'
        : 'Не удалось распознать фото — попробуйте снова'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setResult(null)
    setError(null)
  }

  return { extract, result, loading, error, clear }
}
