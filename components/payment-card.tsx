"use client"

import { useMemo } from "react"

export default function PaymentCard() {
  const amount = "₹1.00"
  
  const upiUrl = useMemo(() => {
    // Generate unique transaction reference ID
    const txnRef = `ORDER${Date.now()}`
    
    // Replace these with your actual UPI details
    const upiId = process.env.NEXT_PUBLIC_UPI_ID // Your UPI ID
    const payeeName = process.env.NEXT_PUBLIC_PAYEE_NAME // Payee name
    const amount = "15"
    const note = "ParkinToday Test Payment"
    
    // Build URL according to NPCI specifications
    // Note: Spaces should be %20, order matters for some apps
    const url = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&tr=${encodeURIComponent(txnRef)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
    
    return url
  }, [])

  return (
    <div
      className="rounded-2xl border bg-card text-card-foreground shadow-sm ring-1 ring-border"
      role="region"
      aria-label="UPI payment"
    >
      <div className="h-1.5 w-full rounded-t-2xl bg-emerald-600" aria-hidden />
      <div className="p-6 md:p-8">
        <header className="mb-6 text-center">
          <h1 className="text-pretty font-serif text-2xl tracking-tight md:text-3xl">Complete Your Payment</h1>
          <p className="mt-2 text-sm text-muted-foreground">Secure UPI checkout. No extra fees.</p>
        </header>

        <div className="mb-6 flex items-center justify-center">
          <span className="inline-flex items-baseline gap-1 rounded-lg bg-secondary px-4 py-2 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="sr-only">Amount:</span>
            {amount}
          </span>
        </div>

        <div className="flex items-center justify-center">
          <a
            href={upiUrl}
            aria-label="Pay now via UPI"
            className="inline-flex min-w-[10rem] items-center justify-center rounded-full bg-emerald-600 px-6 py-3 font-semibold tracking-wide text-white shadow-sm transition-transform duration-150 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            Pay Now
          </a>
        </div>

        <footer className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">UPI requests open in your installed payments app.</p>
        </footer>
      </div>
    </div>
  )
}
