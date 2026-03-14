import type { Route } from "next"
import Link from "next/link"

import { PlaceholderCard } from "@/components/shared/placeholder-card"

export type DashboardSection = {
  title: string
  description: string
  href: Route
}

type DashboardPageProps = {
  role: string
  summary: string
  sections: DashboardSection[]
}

export function DashboardPage({ role, summary, sections }: DashboardPageProps) {
  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(16,34,61,0.08)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">{role}</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">{role} dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{summary}</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <PlaceholderCard
            key={section.href}
            eyebrow={role}
            title={section.title}
            description={section.description}
          >
            <Link
              href={section.href}
              className="inline-flex rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
            >
              Open module
            </Link>
          </PlaceholderCard>
        ))}
      </div>
    </section>
  )
}
