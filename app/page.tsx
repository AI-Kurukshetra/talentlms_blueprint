import Link from "next/link"
import {
  ChartNoAxesCombined,
  GraduationCap,
  LibraryBig,
  ShieldCheck,
  Sparkles
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: LibraryBig,
    title: "Course authoring for modern teams",
    description:
      "Create onboarding academies, compliance programs, and internal certification paths from one clean workspace."
  },
  {
    icon: ChartNoAxesCombined,
    title: "Role-based analytics",
    description:
      "Give admins, instructors, and learners tailored views with progress visibility and operational reporting."
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description:
      "Supabase Auth, row-level security, and storage-backed content delivery keep sensitive training data controlled."
  },
  {
    icon: GraduationCap,
    title: "Learner experience that scales",
    description:
      "Support self-paced learning, assessments, certifications, and mobile-ready training journeys."
  }
]

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 surface-grid opacity-30" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="glass-panel animate-in fade-in slide-in-from-top-4 duration-700 rounded-[28px] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 ring-1 ring-white/15">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">CloudLMS</p>
                <p className="text-sm text-muted-foreground">
                  Learning infrastructure for distributed organizations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" className="rounded-full">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="rounded-full px-5">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="flex flex-1 items-center py-16 sm:py-20">
          <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <Badge className="rounded-full border-primary/30 bg-primary/10 px-4 py-1 text-primary">
                Phase 2 Authentication
              </Badge>
              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-7xl">
                Cloud learning that feels as sharp as the software your team already uses.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Launch onboarding, compliance, and upskilling programs with a modern LMS built
                for admins, instructors, and learners across every device.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-6">
                  <Link href="/register">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            </div>

            <Card className="glass-panel animate-in fade-in zoom-in-95 duration-700 rounded-[32px] border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-2xl">Built for the full training lifecycle</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Structured content delivery, progress intelligence, and role-based operations in
                  one product.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-background/50 p-5">
                  <p className="text-sm text-muted-foreground">Completion uplift</p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight">+38%</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cleaner delivery and visibility across every learner journey.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-background/40 p-5">
                    <p className="text-sm text-muted-foreground">Roles supported</p>
                    <p className="mt-2 text-2xl font-semibold">3 core personas</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-background/40 p-5">
                    <p className="text-sm text-muted-foreground">Backend</p>
                    <p className="mt-2 text-2xl font-semibold">Supabase-first</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pb-16">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
                Key Features
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">A production-ready LMS foundation</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Clean architecture, responsive UX, and role-aware navigation designed for the Phase
              2 authentication milestone.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className="glass-panel animate-in fade-in slide-in-from-bottom-8 rounded-[28px]"
                  style={{ animationDelay: `${index * 120}ms` }}
                >
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="pt-4 text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <footer className="border-t border-white/10 py-6 text-sm text-muted-foreground">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>CloudLMS. Modern training operations for fast-moving organizations.</p>
            <div className="flex items-center gap-4">
              <Link href="/register" className="transition hover:text-foreground">
                Get Started
              </Link>
              <Link href="/login" className="transition hover:text-foreground">
                Login
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
