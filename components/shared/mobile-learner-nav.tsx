"use client"

import type { Route } from "next"
import Link from "next/link"
import { Award, BookOpen, Compass, LayoutDashboard, TrendingUp } from "lucide-react"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const items: Array<{ href: Route; label: string; icon: typeof LayoutDashboard }> = [
  { href: "/learner", label: "Home", icon: LayoutDashboard },
  { href: "/learner/browse", label: "Browse", icon: Compass },
  { href: "/learner/my-courses", label: "Courses", icon: BookOpen },
  { href: "/learner/progress", label: "Progress", icon: TrendingUp },
  { href: "/learner/certificates", label: "Awards", icon: Award }
]

export function MobileLearnerNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[28px] border border-white/10 bg-background/90 p-2 shadow-[0_24px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl lg:hidden">
      {items.map((item) => {
        const Icon = item.icon
        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          (item.href === "/learner/my-courses" && pathname.startsWith("/learner/courses/"))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-[20px] px-2 py-2 text-[11px] font-medium transition",
              isActive ? "bg-primary/15 text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
