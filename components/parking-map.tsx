"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type Spot = {
  id: string
  name: string
  lat: number
  lng: number
  occupied: boolean
  temperatureC: number
  humidityPct: number
  distanceM: number
}

type Point = { xPct: number; yPct: number }

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371e3
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function projectToBox(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
): Point {
  const xPct = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100
  const yPct = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100
  return { xPct, yPct }
}

export function ParkingMap() {
  const router = useRouter()

  // Simulated user location (center of the map)
  const user = { lat: 37.7749, lng: -122.4194 } // San Francisco

  // View bounds around user (~1.5km each side)
  const bounds = useMemo(
    () => ({
      minLat: user.lat - 0.01,
      maxLat: user.lat + 0.01,
      minLng: user.lng - 0.01,
      maxLng: user.lng + 0.01,
    }),
    [user.lat, user.lng],
  )

  // Generate mock spots around the user
  const spots = useMemo<Spot[]>(() => {
    const names = [
      "Mission Garage",
      "Market St Lot",
      "Bayview Parking",
      "Union Square Deck",
      "Civic Center Lot",
      "Pier 39 Garage",
      "SoMa Station Lot",
      "Ferry Building Lot",
    ]
    return names.map((name, i) => {
      const lat = randomBetween(bounds.minLat, bounds.maxLat)
      const lng = randomBetween(bounds.minLng, bounds.maxLng)
      const distanceM = haversineMeters(user, { lat, lng })
      const occupied = Math.random() < 0.45
      const temperatureC = Math.round(randomBetween(18, 31))
      const humidityPct = Math.round(randomBetween(40, 80))
      return {
        id: `spot-${i}`,
        name,
        lat,
        lng,
        occupied,
        temperatureC,
        humidityPct,
        distanceM: Math.round(distanceM),
      }
    })
  }, [bounds.maxLat, bounds.maxLng, bounds.minLat, bounds.minLng, user])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [bestId, setBestId] = useState<string | null>(null)
  const selectedSpot = useMemo(() => spots.find((s) => s.id === selectedId) || null, [selectedId, spots])
  const bestSpot = useMemo(() => spots.find((s) => s.id === bestId) || null, [bestId, spots])

  function handleFindBest() {
    const available = spots.filter((s) => !s.occupied)
    if (!available.length) {
      setBestId(null)
      setSelectedId(null)
      return
    }
    const nearest = available.reduce((a, b) => (a.distanceM < b.distanceM ? a : b))
    setBestId(nearest.id)
    setSelectedId(nearest.id)
  }

  function handleConfirm() {
    router.push("/upi")
  }

  function spotPoint(spot: Spot): Point {
    return projectToBox(spot.lat, spot.lng, bounds)
  }

  const userPoint: Point = { xPct: 50, yPct: 50 } // center of map box
  const sortedSpots = useMemo(() => [...spots].sort((a, b) => a.distanceM - b.distanceM), [spots])

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-5">
      {/* Map */}
      <div className="relative col-span-3 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm md:col-span-3">
        {/* Controls */}
        <div className="z-10 flex items-center gap-2 p-3 sm:p-4">
          <button
            onClick={handleFindBest}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="Find best nearest parking space"
          >
            Find best
          </button>
          <button
            onClick={() => {
              setBestId(null)
              setSelectedId(null)
            }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-100 px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            aria-label="Reset selection"
          >
            Reset
          </button>
          <div className="ml-auto hidden items-center gap-2 text-xs text-zinc-600 sm:flex">
            <span className="inline-block h-3 w-3 rounded-full bg-emerald-600" aria-hidden />
            <span>Available</span>
            <span className="inline-block h-3 w-3 rounded-full bg-red-600" aria-hidden />
            <span>Occupied</span>
          </div>
        </div>

        {/* Map canvas (placeholder background) */}
        <div className="relative h-[70vh] w-full sm:h-[72vh]">
          <img
            src="/city-street-map-background.jpg"
            alt="Map showing nearby streets and parking locations"
            className="h-full w-full object-cover opacity-95"
          />

          {/* User marker (center) */}
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${userPoint.xPct}%`, top: `${userPoint.yPct}%` }}
            aria-hidden
          >
            <div className="h-4 w-4 rounded-full border-2 border-white bg-zinc-900 shadow" />
            <div className="absolute -inset-3 animate-ping rounded-full bg-zinc-900/20" />
          </div>

          {/* Route line if best selected */}
          {bestSpot && (
            <svg className="pointer-events-none absolute inset-0 z-0" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              {(() => {
                const p = spotPoint(bestSpot)
                const x1 = (userPoint.xPct / 100) * 100 + "%"
                const y1 = (userPoint.yPct / 100) * 100 + "%"
                const x2 = p.xPct + "%"
                const y2 = p.yPct + "%"
                return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10B981" strokeWidth="3" strokeDasharray="6 6" />
              })()}
            </svg>
          )}

          {/* Spot markers */}
          {spots.map((s) => {
            const p = spotPoint(s)
            const isSelected = selectedId === s.id
            const isBest = bestId === s.id
            const color = s.occupied ? "bg-red-600" : "bg-emerald-600"
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
                aria-label={`${s.name} - ${s.occupied ? "Occupied" : "Available"} - ${s.distanceM} meters away`}
              >
                <span
                  className={[
                    "block h-4 w-4 rounded-full border-2 border-white shadow",
                    color,
                    isSelected ? "ring-2 ring-zinc-900" : "",
                    isBest ? "ring-2 ring-emerald-400" : "",
                  ].join(" ")}
                />
              </button>
            )
          })}
        </div>

        {/* Bottom actions (mobile primary) */}
        <div className="flex items-center justify-between gap-2 border-t border-zinc-200 p-3 sm:hidden">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="inline-block h-3 w-3 rounded-full bg-emerald-600" aria-hidden />
            <span>Available</span>
            <span className="inline-block h-3 w-3 rounded-full bg-red-600" aria-hidden />
            <span>Occupied</span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!bestSpot}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>

      {/* Details panel */}
      <aside className="col-span-2 flex flex-col gap-3 md:col-span-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="font-serif mb-2 text-lg">Nearby spots</h2>
          <p className="text-sm text-zinc-600">Sorted by distance</p>
          <ul className="mt-3 divide-y divide-zinc-200">
            {sortedSpots.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setSelectedId(s.id)}
                  className={`flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    selectedId === s.id ? "bg-zinc-50" : ""
                  }`}
                  aria-label={`Select ${s.name}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          s.occupied ? "bg-red-600" : "bg-emerald-600"
                        }`}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-medium">{s.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">
                      <span>{s.distanceM} m</span>
                      <span className="mx-2 text-zinc-300">•</span>
                      <span>{s.temperatureC}°C</span>
                      <span className="mx-2 text-zinc-300">•</span>
                      <span>{s.humidityPct}% RH</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-xs">
                    {s.occupied ? (
                      <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">Occupied</span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Available</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleFindBest}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Find best
            </button>
            <button
              onClick={handleConfirm}
              disabled={!bestSpot}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white enabled:hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm
            </button>
          </div>

          {selectedSpot && (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
              <div className="mb-1 font-medium">{selectedSpot.name}</div>
              <div className="text-zinc-700">
                <span className="mr-2">{selectedSpot.distanceM} m away</span>
                <span className="mx-2 text-zinc-300">•</span>
                <span>{selectedSpot.temperatureC}°C</span>
                <span className="mx-2 text-zinc-300">•</span>
                <span>{selectedSpot.humidityPct}% RH</span>
              </div>
              <div className="mt-2">
                {selectedSpot.occupied ? (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                    Currently occupied
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                    Available
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h3 className="font-serif mb-2 text-base">Tip</h3>
          <p className="text-sm text-zinc-600">
            Tap “Find best” to highlight the nearest available spot and preview the route from your current position.
          </p>
        </div>
      </aside>
    </div>
  )
}
