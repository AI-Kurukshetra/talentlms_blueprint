import type { Route } from "next"
import Link from "next/link"
import { ReactNode } from "react"

const dashboardLinks: Array<{ href: Route; label: string }> = [
  { href: "/admin", label: "Admin" },
  { href: "/instructor", label: "Instructor" },
  { href: "/learner", label: "Learner" }
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row">
        <aside className="lg:w-72">
          <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_rgba(16,34,61,0.08)] backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Dashboards
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Cloud LMS</h2>
            <nav className="mt-6 flex flex-col gap-3">
              {dashboardLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
