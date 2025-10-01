import { NextResponse } from "next/server"

export async function GET() {
  const payload = {
    status: "ok",
    time: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0,
  }
  return NextResponse.json(payload, { status: 200 })
}
