"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { MessageSquareReply, SendHorizontal } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type DiscussionItem = {
  id: string
  courseId: string
  userId: string
  userName: string
  avatarUrl: string | null
  message: string
  parentId: string | null
  createdAt: string
}

type DiscussionForumProps = {
  courseId: string
  title?: string
  description?: string
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

function Thread({
  items,
  parentId,
  onReply
}: {
  items: DiscussionItem[]
  parentId: string | null
  onReply: (parentId: string | null, message: string) => void
}) {
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const branch = items.filter((item) => item.parentId === parentId)

  return (
    <div className="space-y-4">
      {branch.map((item) => {
        const initials = item.userName
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()

        return (
          <div key={item.id} className={parentId ? "ml-8 border-l border-white/10 pl-5" : ""}>
            <div className="rounded-[24px] border border-white/10 bg-black/10 p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 ring-1 ring-white/10">
                  {item.avatarUrl ? <AvatarImage src={item.avatarUrl} alt={item.userName} /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.userName}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">
                      {timeAgo(item.createdAt)}
                    </p>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {item.message}
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setReplyOpenFor((current) => (current === item.id ? null : item.id))}
                    >
                      <MessageSquareReply className="mr-2 h-4 w-4" />
                      Reply
                    </Button>
                  </div>
                  {replyOpenFor === item.id ? (
                    <div className="mt-4 space-y-3 rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                      <Textarea
                        value={replyMessage}
                        onChange={(event) => setReplyMessage(event.target.value)}
                        placeholder="Add your reply"
                        className="min-h-[110px]"
                      />
                      <div className="flex justify-end">
                        <Button
                          className="rounded-full"
                          disabled={isPending || !replyMessage.trim()}
                          onClick={() =>
                            startTransition(async () => {
                              await onReply(item.id, replyMessage)
                              setReplyMessage("")
                              setReplyOpenFor(null)
                            })
                          }
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Thread items={items} parentId={item.id} onReply={onReply} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DiscussionForum({
  courseId,
  title = "Course discussion",
  description = "Ask questions, share context, and keep the learning conversation moving."
}: DiscussionForumProps) {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [threads, setThreads] = useState<DiscussionItem[]>([])
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let active = true

    async function loadThreads() {
      const response = await fetch(`/api/discussions?courseId=${courseId}`)
      const result = await response.json()
      if (!response.ok || !active) return
      setThreads(result.discussions ?? [])
    }

    loadThreads()

    const channel = supabase
      .channel(`course-discussion:${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "discussions",
          filter: `course_id=eq.${courseId}`
        },
        () => loadThreads()
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [courseId, supabase])

  async function postMessage(parentId: string | null, nextMessage: string) {
    const response = await fetch("/api/discussions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        courseId,
        message: nextMessage,
        parentId
      })
    })
    const result = await response.json()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "Unable to post",
        description: result.error ?? "Please try again."
      })
      return
    }

    if (!parentId) {
      setMessage("")
    }
  }

  return (
    <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
      <CardHeader>
        <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
        <CardDescription className="text-sm leading-7 text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 rounded-[24px] border border-white/10 bg-black/10 p-4">
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Start a conversation for this course"
            className="min-h-[120px]"
          />
          <div className="flex justify-end">
            <Button
              className="rounded-full"
              disabled={isPending || !message.trim()}
              onClick={() => startTransition(async () => postMessage(null, message))}
            >
              <SendHorizontal className="mr-2 h-4 w-4" />
              Post
            </Button>
          </div>
        </div>

        {threads.length > 0 ? (
          <Thread items={threads} parentId={null} onReply={postMessage} />
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 p-6 text-sm text-muted-foreground">
            No discussion posts yet. Be the first to ask a question or share a takeaway.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
