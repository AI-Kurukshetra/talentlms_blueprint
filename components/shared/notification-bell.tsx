"use client"

import type { Route } from "next"
import { useEffect, useMemo, useRef, useState } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

type NotificationItem = {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
}

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const seenBadgeNotifications = useRef<Set<string>>(new Set())

  const notificationsPath = useMemo(() => {
    if (pathname.startsWith("/admin")) return "/admin/notifications" as Route
    if (pathname.startsWith("/instructor")) return "/instructor/notifications" as Route
    return "/learner/notifications" as Route
  }, [pathname])

  useEffect(() => {
    let active = true

    async function loadNotifications() {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user || !active) return

      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (!active) return

      const nextNotifications = (data ?? []) as NotificationItem[]
      setNotifications(nextNotifications)
      setUnreadCount(count ?? 0)

      nextNotifications.forEach((notification) => {
        if (
          !notification.read &&
          notification.title.startsWith("Badge unlocked:") &&
          !seenBadgeNotifications.current.has(notification.id)
        ) {
          seenBadgeNotifications.current.add(notification.id)
          toast({
            title: "Badge unlocked",
            description: notification.title.replace("Badge unlocked:", "").trim()
          })
        }
      })
    }

    const loginKey = `cloudlms-login-awarded:${new Date().toISOString().slice(0, 10)}`
    if (!sessionStorage.getItem(loginKey)) {
      fetch("/api/engagement/login", { method: "POST" })
        .then((response) => response.json())
        .then((payload) => {
          sessionStorage.setItem(loginKey, "1")
          for (const badge of payload.earnedBadges ?? []) {
            toast({
              title: "Badge unlocked",
              description: badge
            })
          }
        })
        .catch(() => undefined)
    }

    loadNotifications()

    const channel = supabase
      .channel(`notifications:${pathname}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [pathname, supabase, toast])

  async function markAllAsRead() {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)

    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))
    setUnreadCount(0)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
          ) : null}
          <span className="sr-only">Open notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-2">
        <div className="flex items-center justify-between px-3 py-2">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          </div>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
        <div className="space-y-1">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex-col items-start gap-1 rounded-2xl p-3"
                onSelect={async () => {
                  if (!notification.read) {
                    await supabase.from("notifications").update({ read: true }).eq("id", notification.id)
                    setNotifications((current) =>
                      current.map((item) =>
                        item.id === notification.id ? { ...item, read: true } : item
                      )
                    )
                    setUnreadCount((current) => Math.max(0, current - 1))
                  }
                }}
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <p className="text-sm font-medium">{notification.title}</p>
                  {!notification.read ? (
                    <Badge className="rounded-full border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300">
                      New
                    </Badge>
                  ) : null}
                </div>
                <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">
                  {notification.message}
                </p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary">
                  {timeAgo(notification.created_at)}
                </p>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2 py-3">
              <EmptyState
                icon={Bell}
                title="No notifications yet"
                description="Activity updates, certificates, and reminders will show up here."
              />
            </div>
          )}
        </div>
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full rounded-full"
            onClick={() => router.push(notificationsPath)}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
