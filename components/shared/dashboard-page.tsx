import type { Route } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
      <header className="glass-panel animate-in fade-in slide-in-from-top-6 rounded-[30px] px-6 py-6 sm:px-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">{role}</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{role} dashboard</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          {summary}
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Card
            key={section.href}
            className="glass-panel animate-in fade-in slide-in-from-bottom-8 rounded-[28px] border-white/10 bg-white/[0.04]"
          >
            <CardHeader className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">{role}</p>
              <CardTitle className="text-2xl tracking-tight">{section.title}</CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                {section.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="rounded-full">
                <Link href={section.href}>
                  Open module
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
