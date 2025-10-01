import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk, Instrument_Serif } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" })
const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-instrument-serif" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${instrumentSerif.variable} antialiased`}>
      <body className="font-sans">
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
