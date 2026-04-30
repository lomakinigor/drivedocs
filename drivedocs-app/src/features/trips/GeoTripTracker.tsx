import { Navigation, Square } from 'lucide-react'
import { useGeoTrip, type GeoTripResult } from './GeoTripContext'

interface GeoTripTrackerProps {
  onFinished: (result: GeoTripResult) => void
}

export function GeoTripTracker({ onFinished }: GeoTripTrackerProps) {
  const { isTracking, distanceKm, elapsedMs, finishTrip, cancelTrip } = useGeoTrip()

  if (!isTracking) return null

  const minutes = Math.floor(elapsedMs / 60_000)
  const seconds = Math.floor((elapsedMs % 60_000) / 1000)
  const timeLabel =
    minutes > 0 ? `${minutes} мин` : seconds > 0 ? `${seconds} сек` : '...'

  const handleFinish = async () => {
    const result = await finishTrip()
    onFinished(result)
  }

  return (
    <div className="fixed bottom-[76px] left-4 right-4 z-40">
      <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
        <div className="p-2 bg-blue-500 rounded-xl shrink-0">
          <Navigation size={18} className="animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">
            {distanceKm.toFixed(1)} км
          </p>
          <p className="text-xs text-blue-200 mt-0.5">{timeLabel} в пути</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={cancelTrip}
            className="text-xs text-blue-200 font-medium px-2 py-1 active:text-white"
          >
            Отмена
          </button>
          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 bg-white text-blue-700 text-sm font-bold px-3 py-2 rounded-xl active:bg-blue-50"
          >
            <Square size={13} fill="currentColor" />
            Завершить
          </button>
        </div>
      </div>
    </div>
  )
}
