"use client"

import type { Route } from "next"
import Link from "next/link"
import { useMemo, useState } from "react"
import { Eye, Plus, Search, Sparkles } from "lucide-react"

import type { InstructorCourseCard } from "@/lib/instructor/data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type CoursesGridProps = {
  courses: InstructorCourseCard[]
}

type StatusFilter = "all" | "draft" | "published" | "archived"

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function CoursesGrid({ courses }: CoursesGridProps) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")

  const filteredCourses = useMemo(() => {
    const normalized = query.toLowerCase()
    return courses.filter((course) => {
      const matchesQuery =
        !normalized ||
        course.title.toLowerCase().includes(normalized) ||
        (course.description ?? "").toLowerCase().includes(normalized)
      const matchesStatus = status === "all" || course.status === status
      return matchesQuery && matchesStatus
    })
  }, [courses, query, status])

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">My Courses</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Ship courses faster</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
              Review draft and published work, track engagement, and jump directly into editing or preview.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/instructor/courses/ai-generate">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/instructor/courses/new">
                <Plus className="mr-2 h-4 w-4" />
                Create New Course
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-11" placeholder="Search courses" />
          </div>
          <div className="w-full lg:w-56">
            <Select value={status} onValueChange={(value: StatusFilter) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredCourses.map((course) => {
          const viewHref = `/instructor/courses/${course.id}` as Route
          const editHref = `/instructor/courses/${course.id}/edit` as Route

          return (
            <Card key={course.id} className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
              <CardHeader className="space-y-4">
                <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/10">
                  {course.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="h-44 w-full object-cover transition duration-300 hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
                      No thumbnail uploaded
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-2xl">{course.title}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
                      {course.description || "No description yet."}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                    {course.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Students</span>
                  <span className="font-medium text-foreground">{course.studentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Completion rate</span>
                  <span className="font-medium text-foreground">{formatPercent(course.completionRate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lessons</span>
                  <span className="font-medium text-foreground">{course.lessonCount}</span>
                </div>
              </CardContent>
              <CardFooter className="gap-3">
                <Button asChild variant="outline" className="flex-1 rounded-2xl">
                  <Link href={editHref}>Edit</Link>
                </Button>
                <Button asChild className="flex-1 rounded-2xl">
                  <Link href={viewHref}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
