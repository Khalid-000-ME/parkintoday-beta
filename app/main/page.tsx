import { ParkingMap } from "@/components/parking-map"

export const metadata = {
  title: "Find Parking | ParkInToday",
  description: "See nearby parking availability and navigate to the best spot.",
}

export default function MainPage() {
  return (
    <main className="min-h-dvh">
      <section className="mx-auto w-full max-w-6xl px-4 py-4 md:py-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="font-serif text-balance text-2xl md:text-3xl">Find Nearby Parking</h1>
        </header>
        <ParkingMap />
      </section>
    </main>
  )
}
