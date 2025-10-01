import Link from "next/link"

export default function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold">
          Next Boilerplate
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-foreground/80 hover:text-foreground">
            Home
          </Link>
          <a
            href="https://nextjs.org/docs/app"
            target="_blank"
            rel="noreferrer"
            className="text-foreground/80 hover:text-foreground"
          >
            Docs
          </a>
        </nav>
      </div>
    </header>
  )
}
