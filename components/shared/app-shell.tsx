import type { Route } from "next"
import Link from "next/link"
import { ReactNode } from "react"

type AppShellProps = {
  title: string
  description: string
  children?: ReactNode
}

const navItems: Array<{ href: Route; label: string }> = [
  { href: "/admin", label: "Admin" },
  { href: "/instructor", label: "Instructor" },
  { href: "/learner", label: "Learner" },
  { href: "/login", label: "Login" }
]

export function AppShell({ title, description, children }: AppShellProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
      <header className="mb-10 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(16,34,61,0.08)] backdrop-blur">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800">
              Cloud LMS
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-medium text-slate-700">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 transition hover:border-brand-300 hover:text-brand-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{children}</section>
    </main>
  )
}
