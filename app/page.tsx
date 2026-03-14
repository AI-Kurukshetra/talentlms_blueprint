import Link from "next/link"

import { AppShell } from "@/components/shared/app-shell"
import { PlaceholderCard } from "@/components/shared/placeholder-card"

const modules = [
  {
    eyebrow: "Foundation",
    title: "Supabase-first architecture",
    description:
      "Auth, Postgres, storage, and realtime are all wired around @supabase/ssr for App Router."
  },
  {
    eyebrow: "Roles",
    title: "Admin, instructor, learner",
    description:
      "Separate dashboard route groups are in place so each module can expand without cross-cutting rewrites."
  },
  {
    eyebrow: "MVP",
    title: "Employee onboarding focus",
    description:
      "The scaffold follows PRODUCT.md and leaves clean extension points for course, assessment, progress, and certificate modules."
  }
]

export default function HomePage() {
  return (
    <AppShell
      title="Cloud LMS foundation"
      description="Next.js 14, Tailwind CSS, and Supabase SSR are scaffolded and ready for the first product modules."
    >
      {modules.map((module) => (
        <PlaceholderCard key={module.title} {...module}>
          <Link
            href="/login"
            className="inline-flex rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Start with authentication
          </Link>
        </PlaceholderCard>
      ))}
    </AppShell>
  )
}
