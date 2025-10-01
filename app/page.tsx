import SiteHeader from "../components/site-header"
import HealthCheck from "../components/health-check"

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <section className="space-y-4">
          <h1 className="text-pretty text-3xl font-semibold tracking-tight md:text-4xl">
            Next.js App Router Boilerplate
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            You now have a simple home page, a reusable header, a health API route, and a client component powered by
            SWR. Use this as a foundation for your app.
          </p>
        </section>

        <section className="mt-10">
          <HealthCheck />
        </section>
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted-foreground">
          <span className="sr-only">Footer</span>
          {"Built with Next.js App Router and Tailwind."}
        </div>
      </footer>
    </>
  )
}
