"use client"

import type { Route } from "next"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import Link from "next/link"
import {
  BookOpenText,
  FolderKanban,
  LayoutDashboard,
  Menu,
  PlusSquare,
  Settings,
  Sparkles,
  Users
} from "lucide-react"
import { usePathname } from "next/navigation"

import { LogoutButton } from "@/components/shared/logout-button"
import { NotificationBell } from "@/components/shared/notification-bell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type InstructorNavItem = {
  href: Route
  label: string
  icon: LucideIcon
}

const navigation: InstructorNavItem[] = [
  { href: "/instructor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/instructor/courses", label: "My Courses", icon: FolderKanban },
  { href: "/instructor/courses/new", label: "Create Course", icon: PlusSquare },
  { href: "/instructor/assessments", label: "Assessments", icon: BookOpenText },
  { href: "/instructor/students", label: "Students", icon: Users },
  { href: "/instructor/settings", label: "Settings", icon: Settings }
]

type InstructorShellProps = {
  user: {
    name: string
    email: string
    avatarUrl: string | null
  }
  children: ReactNode
}

function Sidebar({
  navigation,
  pathname
}: {
  navigation: InstructorNavItem[]
  pathname: string
}) {
  return (
    <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/20">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold tracking-tight">CloudLMS</p>
          <p className="text-xs text-muted-foreground">Instructor workspace</p>
        </div>
      </div>
      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform", !isActive && "group-hover:scale-110")} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
        <p className="text-sm font-medium">Course Studio</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Build structured learning paths, ship lessons fast, and monitor learner momentum without leaving the workspace.
        </p>
      </div>
    </div>
  )
}

export function InstructorShell({ user, children }: InstructorShellProps) {
  const pathname = usePathname()
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="grid min-h-screen gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-4 h-[calc(100vh-2rem)]">
          <Sidebar navigation={navigation} pathname={pathname} />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="glass-panel sticky top-4 z-30 mb-4 rounded-[28px] px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-2xl lg:hidden">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Open sidebar</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="p-3">
                  <Sidebar navigation={navigation} pathname={pathname} />
                </SheetContent>
              </Sheet>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-primary">Instructor</p>
                <h1 className="text-lg font-semibold tracking-tight">Course builder workspace</h1>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              <NotificationBell />
              <Avatar className="h-10 w-10 ring-1 ring-white/10">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Badge className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                Instructor
              </Badge>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="pb-6">{children}</div>
      </div>
    </div>
  )
}
