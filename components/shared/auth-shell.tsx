import Link from "next/link"
import { ReactNode } from "react"
import { LockKeyhole, Orbit, ShieldCheck, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"

const highlights = [
  {
    icon: ShieldCheck,
    title: "Role-aware access",
    description: "Admins, instructors, and learners land exactly where they should."
  },
  {
    icon: LockKeyhole,
    title: "Supabase-secured",
    description: "Authentication, sessions, and profile-backed routing stay in one system."
  },
  {
    icon: Orbit,
    title: "Built for distributed teams",
    description: "Responsive training experiences with a clean dashboard-first interface."
  }
]

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 surface-grid opacity-25" />
      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[36px] border border-white/10 bg-black/20 shadow-[0_40px_120px_rgba(2,6,23,0.55)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden px-8 py-10 lg:flex lg:flex-col lg:justify-between xl:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.26),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_26%)]" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">CloudLMS</p>
                <p className="text-sm text-muted-foreground">Modern cloud learning operations</p>
              </div>
            </Link>
            <Badge className="mt-12 rounded-full px-4 py-1">Authentication</Badge>
            <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-[-0.05em]">
              Training access that feels polished from the first screen.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground">
              Production-grade onboarding for learners, instructors, and admins with fast role
              resolution and a dashboard experience inspired by Linear and Vercel.
            </p>
          </div>

          <div className="relative grid gap-4">
            {highlights.map((highlight, index) => {
              const Icon = highlight.icon
              return (
                <div
                  key={highlight.title}
                  className="glass-panel animate-in fade-in slide-in-from-left-8 grid gap-3 rounded-[28px] p-5"
                  style={{ animationDelay: `${index * 140}ms` }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{highlight.title}</h2>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10 xl:px-12">
          <div className="w-full max-w-xl">{children}</div>
        </section>
      </div>
    </main>
  )
}
