"use client"

import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles } from "lucide-react"

import { GlobalSearch } from "@/components/shared/global-search"
import { LogoutButton } from "@/components/shared/logout-button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type NavbarProps = {
  navigation: Array<{
    href: Route
    label: string
  }>
  user: {
    name: string
    email: string
    role: string
    avatarUrl: string | null
  }
}

export function Navbar({ navigation, user }: NavbarProps) {
  const pathname = usePathname()
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="glass-panel animate-in fade-in slide-in-from-top-4 sticky top-4 z-40 rounded-[28px] px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <Link href="/" className="flex items-center gap-3 pr-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold tracking-tight">CloudLMS</p>
              <p className="text-xs text-muted-foreground">Workspace</p>
            </div>
          </Link>
          <nav className="flex flex-wrap gap-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 self-start rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 sm:self-auto">
          <GlobalSearch />
          <ThemeToggle />
          <Avatar className="h-10 w-10 ring-1 ring-white/10">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant="secondary" className="hidden rounded-full px-3 py-1 sm:inline-flex">
            {user.role}
          </Badge>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
