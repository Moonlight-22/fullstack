import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    const valid = (points || []).filter((p) => p?.[0] != null && p?.[1] != null)
    if (valid.length >= 2) {
      map.fitBounds(valid, { padding: [40, 40] })
    } else if (valid.length === 1) {
      map.setView(valid[0], 14)
    }
  }, [points, map])
  return null
}

export function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], map.getZoom())
    }
  }, [lat, lng, map])
  return null
}

export default function JobRouteMap({ clientLat, clientLng, workerLat, workerLng, clientLabel = 'Client', workerLabel = 'Worker' }) {
  const [route, setRoute] = useState(null)

  useEffect(() => {
    if (clientLat == null || clientLng == null || workerLat == null || workerLng == null) {
      setRoute(null)
      return
    }

    let cancelled = false
    const url = `https://router.project-osrm.org/route/v1/driving/${clientLng},${clientLat};${workerLng},${workerLat}?overview=full&geometries=geojson`

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const coords = data?.routes?.[0]?.geometry?.coordinates
        if (coords?.length) {
          setRoute(coords.map(([lng, lat]) => [lat, lng]))
        } else {
          setRoute([
            [clientLat, clientLng],
            [workerLat, workerLng],
          ])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoute([
            [clientLat, clientLng],
            [workerLat, workerLng],
          ])
        }
      })

    return () => {
      cancelled = true
    }
  }, [clientLat, clientLng, workerLat, workerLng])

  if (clientLat == null || clientLng == null || workerLat == null || workerLng == null) {
    return (
      <div className="surface-muted mt-4 rounded-xl p-4 text-sm text-muted">
        Share both locations to see the live route on the map.
      </div>
    )
  }

  const center = [(clientLat + workerLat) / 2, (clientLng + workerLng) / 2]

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-app" style={{ height: 240 }}>
      <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={[[clientLat, clientLng], [workerLat, workerLng]]} />
        <CircleMarker center={[clientLat, clientLng]} radius={9} pathOptions={{ color: '#059669', fillColor: '#10b981', fillOpacity: 0.9 }}>
          <Popup>{clientLabel}</Popup>
        </CircleMarker>
        <Marker position={[workerLat, workerLng]}>
          <Popup>{workerLabel}</Popup>
        </Marker>
        {route ? <Polyline positions={route} pathOptions={{ color: '#1d4ed8', weight: 4, opacity: 0.85 }} /> : null}
      </MapContainer>
    </div>
  )
}
