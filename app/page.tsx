import type { Metadata } from "next"
import Link from "next/link"
import {
  Bot,
  BrainCircuit,
  Certificate,
  Gauge,
  Github,
  Linkedin,
  PlayCircle,
  Rocket,
  Smartphone,
  Sparkles,
  Trophy,
  Twitter,
  Video,
  WandSparkles
} from "lucide-react"

import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Train Smarter with AI",
  description: "Create, deliver, monetize, and optimize learning programs with CloudLMS."
}

const features = [
  { icon: Bot, title: "AI Course Generation", description: "Generate polished lesson structures, assessments, and learning paths in minutes." },
  { icon: Gauge, title: "Smart Analytics", description: "Track completions, enrollments, revenue, and learner risk from one clean reporting layer." },
  { icon: Trophy, title: "Gamification", description: "Drive momentum with points, badges, leaderboards, and behavior-based nudges." },
  { icon: Video, title: "Live Sessions", description: "Blend async content with instructor-led delivery for launch, onboarding, and cohort learning." },
  { icon: Smartphone, title: "Mobile Learning", description: "Give learners a fast, touch-friendly experience across every core workflow." },
  { icon: Certificate, title: "Certificates", description: "Issue branded completion certificates automatically when learners reach the finish line." }
]

const steps = [
  { icon: WandSparkles, title: "Create", description: "Build content manually or generate structured course drafts with AI." },
  { icon: Rocket, title: "Deliver", description: "Enroll learners, monetize paid courses, and publish responsive learning experiences." },
  { icon: BrainCircuit, title: "Track", description: "Monitor engagement, completions, assessment outcomes, and revenue in real time." }
]

const pricing = [
  {
    name: "Free",
    price: "$0",
    description: "For fast proof-of-concept learning programs.",
    features: ["Up to 25 learners", "Core course builder", "Basic assessments", "Certificates"]
  },
  {
    name: "Pro",
    price: "$29/mo",
    description: "For growing teams shipping serious internal training.",
    features: ["Unlimited learners", "AI course generation", "Stripe payments", "Advanced analytics"]
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For scaled rollouts, multi-team visibility, and tailored controls.",
    features: ["Learning paths", "Custom workflows", "Priority support", "Deployment guidance"]
  }
]

const testimonials = [
  {
    name: "Avery Chen",
    role: "Head of Enablement",
    quote: "CloudLMS let us replace a scattered training stack with one system that actually feels modern."
  },
  {
    name: "Marcus Reed",
    role: "L&D Program Manager",
    quote: "The AI authoring and analytics are sharp enough that our team ships courses faster without losing quality."
  },
  {
    name: "Priya Nair",
    role: "Operations Director",
    quote: "We finally have a learner experience people want to use and reporting leadership can trust."
  }
]

const socials = [
  { label: "X", icon: Twitter },
  { label: "LinkedIn", icon: Linkedin },
  { label: "GitHub", icon: Github }
]

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 surface-grid opacity-20" />
      <div className="relative mx-auto max-w-7xl px-6 py-6 sm:px-8 lg:px-10">
        <header className="glass-panel sticky top-4 z-30 rounded-[30px] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">CloudLMS</p>
                <p className="text-sm text-muted-foreground">Learning infrastructure for modern teams</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button asChild variant="ghost" className="rounded-full">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="rounded-full px-5">
                <Link href="/register">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid min-h-[calc(100vh-5rem)] gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <Badge className="rounded-full border-primary/20 bg-primary/10 px-4 py-1 text-primary">
              Train Smarter with AI
            </Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Train Smarter with AI
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              CloudLMS combines AI course generation, learner engagement, payments, analytics, and certificates
              into one polished training platform for teams that move quickly.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/register">Start Free Trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href="#demo">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Watch Demo
                </Link>
              </Button>
            </div>
          </div>

          <div id="demo" className="glass-panel overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_30%),rgba(255,255,255,0.04)] p-5">
            <div className="rounded-[30px] border border-white/10 bg-background/80 p-4">
              <div className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-primary">Dashboard Preview</p>
                  <p className="mt-1 text-xl font-semibold">Operational learning at a glance</p>
                </div>
                <Badge className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary">Live</Badge>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Card className="rounded-[24px] border-white/10 bg-white/[0.04]">
                  <CardHeader>
                    <CardDescription>AI Generated Courses</CardDescription>
                    <CardTitle className="text-4xl tracking-tight">128</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="rounded-[24px] border-white/10 bg-white/[0.04]">
                  <CardHeader>
                    <CardDescription>Monthly Revenue</CardDescription>
                    <CardTitle className="text-4xl tracking-tight">$14.8k</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="rounded-[24px] border-white/10 bg-white/[0.04] md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-xl">Learner momentum</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-3">
                    {["Create", "Deliver", "Track"].map((label, index) => (
                      <div key={label} className="rounded-[20px] border border-white/10 bg-black/10 p-4">
                        <p className="text-sm text-muted-foreground">Step {index + 1}</p>
                        <p className="mt-2 text-lg font-semibold">{label}</p>
                        <div className="mt-4 h-2 rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${45 + index * 20}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.24em] text-primary">Features</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Everything needed to run modern learning operations</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
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

        <section className="py-16">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.24em] text-primary">How It Works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Create, deliver, and track from one workflow</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <Card key={step.title} className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">0{index + 1}</span>
                    </div>
                    <CardTitle className="pt-4 text-2xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section id="pricing" className="py-16">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.24em] text-primary">Pricing</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Plans for internal academies and customer education</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {pricing.map((tier, index) => (
              <Card key={tier.name} className={`glass-panel rounded-[30px] border-white/10 bg-white/[0.04] ${index === 1 ? "ring-1 ring-primary/20" : ""}`}>
                <CardHeader>
                  <CardDescription>{tier.name}</CardDescription>
                  <CardTitle className="text-4xl tracking-tight">{tier.price}</CardTitle>
                  <p className="text-sm leading-7 text-muted-foreground">{tier.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {tier.features.map((feature) => (
                      <div key={feature} className="rounded-[18px] border border-white/10 bg-black/10 px-4 py-3 text-sm">
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Button asChild className="w-full rounded-full">
                    <Link href="/register">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.24em] text-primary">Testimonials</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Teams use CloudLMS to simplify learning delivery</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.name} className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {testimonial.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <CardDescription>{testimonial.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-muted-foreground">“{testimonial.quote}”</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight">CloudLMS</p>
                  <p className="text-sm text-muted-foreground">Train smarter with AI.</p>
                </div>
              </div>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                A polished LMS for AI-assisted authoring, learner engagement, payments, certificates, and analytics.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              <div className="space-y-3">
                <p className="text-sm font-semibold">Product</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <Link href="#pricing" className="block transition hover:text-foreground">Pricing</Link>
                  <Link href="/register" className="block transition hover:text-foreground">Start Free Trial</Link>
                  <Link href="/login" className="block transition hover:text-foreground">Login</Link>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold">Resources</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <Link href="#demo" className="block transition hover:text-foreground">Watch Demo</Link>
                  <Link href="/register" className="block transition hover:text-foreground">Book a Tour</Link>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold">Social</p>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  {socials.map((item) => {
                    const Icon = item.icon
                    return (
                      <span
                        key={item.label}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]"
                        aria-label={item.label}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">© 2026 CloudLMS. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}
