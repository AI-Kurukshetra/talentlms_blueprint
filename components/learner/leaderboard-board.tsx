"use client"

import { useState } from "react"
import { Crown, Medal, Sparkles } from "lucide-react"

import type { LearnerLeaderboardEntry } from "@/lib/learner/data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type LeaderboardBoardProps = {
  viewerId: string
  allTime: LearnerLeaderboardEntry[]
  weekly: LearnerLeaderboardEntry[]
  allTimeRank: number | null
  weeklyRank: number | null
}

export function LeaderboardBoard({
  viewerId,
  allTime,
  weekly,
  allTimeRank,
  weeklyRank
}: LeaderboardBoardProps) {
  const [mode, setMode] = useState<"weekly" | "all-time">("all-time")
  const entries = mode === "all-time" ? allTime : weekly
  const viewerRank = mode === "all-time" ? allTimeRank : weeklyRank

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">Leaderboard</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Top learner momentum</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              Compare points and badge counts across the active learner community.
            </p>
          </div>
          <div className="flex gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1">
            <Button
              variant={mode === "weekly" ? "default" : "ghost"}
              className="rounded-full"
              onClick={() => setMode("weekly")}
            >
              Weekly
            </Button>
            <Button
              variant={mode === "all-time" ? "default" : "ghost"}
              className="rounded-full"
              onClick={() => setMode("all-time")}
            >
              All-time
            </Button>
          </div>
        </div>
      </section>

      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl tracking-tight">Ranking board</CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                {mode === "all-time"
                  ? "Ordered by total points earned across courses and assessments."
                  : "Ordered by point-generating activity recorded in the last 7 days."}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-full px-4 py-2">
              Your rank: {viewerRank ?? "Unranked"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {entries.map((entry) => {
            const initials = entry.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
            const isViewer = entry.id === viewerId

            return (
              <div
                key={`${mode}-${entry.id}`}
                className={`rounded-[26px] border p-5 ${
                  isViewer
                    ? "border-primary/30 bg-primary/10"
                    : "border-white/10 bg-black/10"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                      {entry.rank === 1 ? (
                        <Crown className="h-5 w-5 text-primary" />
                      ) : entry.rank <= 3 ? (
                        <Medal className="h-5 w-5 text-primary" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <Avatar className="h-11 w-11 ring-1 ring-white/10">
                      {entry.avatarUrl ? <AvatarImage src={entry.avatarUrl} alt={entry.name} /> : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{entry.name}</p>
                      <p className="text-sm text-muted-foreground">Rank #{entry.rank}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isViewer ? (
                      <Badge className="rounded-full border-primary/20 bg-primary/15 px-3 py-1 text-primary">
                        You
                      </Badge>
                    ) : null}
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {entry.points} points
                    </Badge>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {entry.badges} badges
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
