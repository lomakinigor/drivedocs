export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'ru-RU,ru;q=0.9' } },
    )
    const data = await res.json()
    const a = data.address ?? {}
    const parts = [
      a.road || a.pedestrian || a.footway,
      a.suburb || a.neighbourhood || a.city_district,
      a.city || a.town || a.village || a.county,
    ].filter(Boolean)
    return (
      parts.slice(0, 2).join(', ') ||
      data.display_name?.split(',').slice(0, 2).join(',').trim() ||
      `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    )
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  }
}
