import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { reverseGeocode } from '@/shared/lib/reverseGeocode'

// ─── Haversine ────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeoTripResult {
  startAddress: string
  endAddress: string
  distanceKm: number
  startedAt: Date
}

interface GeoTripContextValue {
  isTracking: boolean
  distanceKm: number
  elapsedMs: number
  startTrip: () => Promise<void>
  finishTrip: () => Promise<GeoTripResult>
  cancelTrip: () => void
  error: string | null
}

const GeoTripContext = createContext<GeoTripContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GeoTripProvider({ children }: { children: React.ReactNode }) {
  const [isTracking, setIsTracking] = useState(false)
  const [distanceKm, setDistanceKm] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Mutable refs — safe to read inside watchPosition callbacks
  const watchIdRef = useRef<number | null>(null)
  const lastCoordsRef = useRef<{ lat: number; lon: number } | null>(null)
  const accDistRef = useRef(0)
  const startTimeRef = useRef<Date | null>(null)
  const startAddrRef = useRef('')
  const lastCoordsForFinishRef = useRef<{ lat: number; lon: number } | null>(null)

  // UI refresh timer while tracking
  useEffect(() => {
    if (!isTracking) return
    const id = setInterval(() => {
      setDistanceKm(Math.round(accDistRef.current * 10) / 10)
      setElapsedMs(Date.now() - (startTimeRef.current?.getTime() ?? Date.now()))
    }, 3000)
    return () => clearInterval(id)
  }, [isTracking])

  const startTrip = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setError('Геолокация не поддерживается браузером')
        reject(new Error('no-geolocation'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords
          lastCoordsRef.current = { lat, lon }
          lastCoordsForFinishRef.current = { lat, lon }
          accDistRef.current = 0
          startTimeRef.current = new Date()
          startAddrRef.current = await reverseGeocode(lat, lon)

          watchIdRef.current = navigator.geolocation.watchPosition(
            (p) => {
              const { latitude: nlat, longitude: nlon } = p.coords
              const last = lastCoordsRef.current
              if (last) {
                const delta = haversineKm(last.lat, last.lon, nlat, nlon)
                // Ignore jitter < 10 m
                if (delta > 0.01) {
                  accDistRef.current += delta
                  lastCoordsRef.current = { lat: nlat, lon: nlon }
                  lastCoordsForFinishRef.current = { lat: nlat, lon: nlon }
                }
              }
            },
            () => {},
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
          )

          setIsTracking(true)
          setDistanceKm(0)
          setElapsedMs(0)
          setError(null)
          resolve()
        },
        (err) => {
          const msg =
            err.code === 1
              ? 'Нет доступа к геолокации — разрешите в настройках браузера'
              : 'Не удалось определить местоположение'
          setError(msg)
          reject(new Error(msg))
        },
        { enableHighAccuracy: true, timeout: 15000 },
      )
    })

  const finishTrip = async (): Promise<GeoTripResult> => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    const endCoords = lastCoordsForFinishRef.current
    const endAddress = endCoords
      ? await reverseGeocode(endCoords.lat, endCoords.lon)
      : ''

    const result: GeoTripResult = {
      startAddress: startAddrRef.current,
      endAddress,
      distanceKm: Math.round(accDistRef.current * 10) / 10,
      startedAt: startTimeRef.current ?? new Date(),
    }

    setIsTracking(false)
    setDistanceKm(0)
    setElapsedMs(0)
    return result
  }

  const cancelTrip = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
    setDistanceKm(0)
    setElapsedMs(0)
  }

  return (
    <GeoTripContext.Provider
      value={{ isTracking, distanceKm, elapsedMs, startTrip, finishTrip, cancelTrip, error }}
    >
      {children}
    </GeoTripContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGeoTrip() {
  const ctx = useContext(GeoTripContext)
  if (!ctx) throw new Error('useGeoTrip must be used inside GeoTripProvider')
  return ctx
}
