import type { Route } from "next"
import Link from "next/link"
import { Activity, BookOpenCheck, FolderKanban, GraduationCap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getInstructorDashboardData } from "@/lib/instructor/data"

const metricIcons = [FolderKanban, GraduationCap, Activity, BookOpenCheck]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value))
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export default async function InstructorDashboardPage() {
  const data = await getInstructorDashboardData()

  return (
    <div className="space-y-6">
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

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl tracking-tight">Recent courses</CardTitle>
              <CardDescription className="mt-2 text-sm leading-7 text-muted-foreground">
                Your most recent course work, draft to published.
              </CardDescription>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/instructor/courses/new">Create course</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentCourses.map((course) => (
              <div
                key={course.id}
                className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="truncate text-lg font-medium">{course.title}</p>
                    <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                      {course.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {course.studentCount} learners • {course.lessonCount} lessons • {formatPercent(course.completionRate)} completion
                  </p>
                </div>
                <Button asChild className="rounded-full">
                  <Link href={`/instructor/courses/${course.id}` as Route}>Open</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Recent student activity</CardTitle>
            <CardDescription className="mt-2 text-sm leading-7 text-muted-foreground">
              Enrollment and lesson completion events across your course catalog.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.activity.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-[24px] border border-white/10 bg-black/10 p-4">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {item.learnerName} <span className="text-muted-foreground">{item.detail}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.courseTitle}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-primary">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
