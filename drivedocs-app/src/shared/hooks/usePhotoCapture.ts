import { useRef, useState } from 'react'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

interface UsePhotoCaptureOptions {
  onCapture: (base64: string) => void
  maxSizeMb?: number
}

export function usePhotoCapture({ onCapture, maxSizeMb = 5 }: UsePhotoCaptureOptions) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const open = () => {
    setError(null)
    inputRef.current?.click()
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Файл слишком большой (максимум ${maxSizeMb} МБ)`)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const base64 = await fileToBase64(file)
      onCapture(base64)
    } catch {
      setError('Не удалось загрузить фото — попробуйте другой файл')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return { inputRef, open, handleChange, error, loading }
}
