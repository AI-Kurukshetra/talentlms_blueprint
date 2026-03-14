"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, CheckCheck } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type NotificationItem = {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
}

type NotificationsCenterProps = {
  roleLabel: string
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

export function NotificationsCenter({ roleLabel }: NotificationsCenterProps) {
  const supabase = useMemo(() => createClient(), [])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    let active = true

    async function loadNotifications() {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user || !active) return

      let query = supabase
        .from("notifications")
        .select("id, title, message, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (filter === "unread") {
        query = query.eq("read", false)
      }

      const { data } = await query
      if (!active) return
      setNotifications((data ?? []) as NotificationItem[])
    }

    loadNotifications()
    const channel = supabase
      .channel(`notifications-center:${filter}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => loadNotifications()
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [filter, supabase])

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
  }

  async function markOneAsRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id)
    setNotifications((current) =>
      current.map((notification) => (notification.id === id ? { ...notification, read: true } : notification))
    )
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-primary">Notifications</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">{roleLabel} notification feed</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Review recent alerts, announcements, and automation updates across your workspace.
        </p>
      </section>

      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="text-2xl tracking-tight">All notifications</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Click an unread item to mark it as read or clear the whole queue.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="rounded-full" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className="w-full rounded-[26px] border border-white/10 bg-black/10 p-5 text-left transition hover:border-primary/20 hover:bg-white/[0.05]"
                onClick={() => markOneAsRead(notification.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{notification.title}</p>
                        {!notification.read ? (
                          <Badge className="rounded-full border-red-500/20 bg-red-500/10 px-3 py-1 text-red-300">
                            Unread
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-primary">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <EmptyState
              icon={Bell}
              title="No notifications yet"
              description="When reminders, completions, or announcements arrive, they will show up here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
