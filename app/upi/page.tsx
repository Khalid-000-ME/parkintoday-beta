import PaymentCard from "@/components/payment-card"

export const dynamic = "force-static"

export default function UpiPaymentPage() {
  return (
    <main className="min-h-[calc(100dvh-0px)] px-4 py-10 md:py-16">
      <section className="mx-auto max-w-2xl">
        <div className="mx-auto w-full max-w-md">
          <PaymentCard />
        </div>
      </section>
    </main>
  )
}
