"use client"

import type { Route } from "next"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRight, Search } from "lucide-react"

import type { LearnerMyCourse } from "@/lib/learner/data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type MyCoursesGridProps = {
  courses: LearnerMyCourse[]
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function MyCoursesGrid({ courses }: MyCoursesGridProps) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return courses.filter((course) => {
      const matchesQuery =
        normalizedQuery.length === 0 || course.title.toLowerCase().includes(normalizedQuery)
      const matchesStatus = status === "all" || course.status === status
      return matchesQuery && matchesStatus
    })
  }, [courses, query, status])

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-primary">My Courses</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Your active learning queue</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Filter by progress state, jump back into lessons, and keep momentum across every enrolled course.
        </p>
      </section>

      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Enrolled catalog</CardTitle>
          <CardDescription className="text-sm leading-7 text-muted-foreground">
            Everything you are currently taking, including finished and in-progress work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
            <div className="space-y-2">
              <Label htmlFor="my-course-search">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="my-course-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search enrolled courses"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredCourses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <Card
                  key={course.enrollmentId}
                  className="rounded-[28px] border-white/10 bg-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white/[0.05]"
                >
                  <div className="overflow-hidden rounded-t-[28px] border-b border-white/10 bg-black/20">
                    {course.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnailUrl} alt={course.title} className="h-44 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                        No thumbnail
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                        {course.status.replace("_", " ")}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{course.lessonCount} lessons</span>
                    </div>
                    <CardTitle className="text-xl tracking-tight">{course.title}</CardTitle>
                    <CardDescription className="text-sm leading-7 text-muted-foreground">
                      {course.description || "Continue the remaining lessons and assessments."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        <span>Progress</span>
                        <span>{formatPercent(course.progressPercent)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${course.progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {course.completedLessons} of {course.lessonCount} lessons completed
                    </p>
                    <Button asChild className="w-full rounded-full">
                      <Link href={`/learner/courses/${course.courseId}` as Route}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-[26px] border border-dashed border-white/10 bg-black/10 p-8 text-sm text-muted-foreground">
              No enrolled courses match the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
