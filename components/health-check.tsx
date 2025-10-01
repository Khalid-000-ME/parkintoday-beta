"use client"

import useSWR from "swr"

type HealthResponse = {
  status: string
  time: string
  uptime: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function HealthCheck() {
  const { data, error, isLoading } = useSWR<HealthResponse>("/api/health", fetcher, {
    refreshInterval: 15000,
  })

  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-lg font-medium">API Health</h2>
      <div className="mt-2 text-sm text-muted-foreground">
        {isLoading && <span>Checking health...</span>}
        {error && <span>Could not reach API.</span>}
        {!isLoading && !error && data && (
          <ul className="list-inside list-disc space-y-1 text-foreground">
            <li>
              <span className="font-medium">Status:</span> {data.status}
            </li>
            <li>
              <span className="font-medium">Time:</span> {new Date(data.time).toLocaleString()}
            </li>
            <li>
              <span className="font-medium">Uptime:</span> {Math.floor(data.uptime)}s
            </li>
          </ul>
        )}
      </div>
    </div>
  )
}
