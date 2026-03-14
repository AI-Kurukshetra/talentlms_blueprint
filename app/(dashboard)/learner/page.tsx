import type { Route } from "next"
import Link from "next/link"
import { ArrowRight, Award, BookOpenCheck, Flame, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getLearnerDashboardData } from "@/lib/learner/data"

const metricIcons = [BookOpenCheck, Flame, Award, Sparkles]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value))
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export default async function LearnerDashboardPage() {
  const data = await getLearnerDashboardData()

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">Welcome back</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight">{data.viewer.name}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
              Keep momentum across your active courses, finish recommended milestones, and turn completed work into credentials.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/learner/browse">Browse catalog</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric, index) => {
          const Icon = metricIcons[index]
          return (
            <Card key={metric.label} className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
              <CardHeader className="pb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardDescription className="pt-4 text-sm text-muted-foreground">{metric.label}</CardDescription>
                <CardTitle className="text-4xl tracking-tight">{metric.value}</CardTitle>
              </CardHeader>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl tracking-tight">Continue learning</CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                Pick up the next lesson in your most active courses.
              </CardDescription>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/learner/my-courses">My Courses</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.continueCourses.length > 0 ? (
              data.continueCourses.map((course) => (
                <div
                  key={course.enrollmentId}
                  className="rounded-[26px] border border-white/10 bg-black/10 p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-lg font-medium">{course.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Next lesson: {course.nextLessonTitle}
                      </p>
                    </div>
                    <Button asChild className="rounded-full">
                      <Link href={`/learner/courses/${course.courseId}` as Route}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <span>Progress</span>
                      <span>{formatPercent(course.progressPercent)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${course.progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[26px] border border-dashed border-white/10 bg-black/10 p-6 text-sm text-muted-foreground">
                No active courses yet. Enroll in a published course to start learning.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight">Upcoming deadlines</CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                Recommended checkpoints and assessments in your active courses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.upcomingItems.length > 0 ? (
                data.upcomingItems.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.courseTitle}</p>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                        {item.meta}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 p-6 text-sm text-muted-foreground">
                  No upcoming deadlines are currently queued.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
            <CardHeader>
              <CardTitle className="text-2xl tracking-tight">Recent achievements</CardTitle>
              <CardDescription className="text-sm leading-7 text-muted-foreground">
                Badges, certificates, and completion milestones earned recently.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.achievements.length > 0 ? (
                data.achievements.map((achievement) => (
                  <div key={achievement.id} className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{achievement.title}</p>
                      <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                        {achievement.kind}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{achievement.detail}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-primary">
                      {formatDate(achievement.earnedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 p-6 text-sm text-muted-foreground">
                  Achievements will appear here as you complete more learning work.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
