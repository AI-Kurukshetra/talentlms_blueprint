"use client"

import type { Route } from "next"
import Link from "next/link"
import { useMemo, useState } from "react"
import { BarChart3, Clock3, FileQuestion, Plus, Search } from "lucide-react"

import type { InstructorAssessmentCard, InstructorCourseOption } from "@/lib/assessment/data"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AssessmentsListProps = {
  courses: InstructorCourseOption[]
  assessments: InstructorAssessmentCard[]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value))
}

export function AssessmentsList({ courses, assessments }: AssessmentsListProps) {
  const [query, setQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")

  const filteredAssessments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return assessments.filter((assessment) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        assessment.title.toLowerCase().includes(normalizedQuery) ||
        assessment.courseTitle.toLowerCase().includes(normalizedQuery)
      const matchesCourse = selectedCourse === "all" || assessment.courseId === selectedCourse
      return matchesQuery && matchesCourse
    })
  }, [assessments, query, selectedCourse])

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">Assessments</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Quiz and evaluation studio</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Build knowledge checks, monitor attempt quality, and iterate on assessment performance across every course.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/instructor/assessments/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Assessment
            </Link>
          </Button>
        </div>
      </section>

      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">All assessments</CardTitle>
          <CardDescription className="text-sm leading-7 text-muted-foreground">
            Search by title or linked course, then drill into editing or learner results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="space-y-2">
              <Label htmlFor="assessment-search">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="assessment-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search assessments or courses"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Course filter</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredAssessments.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredAssessments.map((assessment) => (
                <Card
                  key={assessment.id}
                  className="rounded-[28px] border-white/10 bg-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white/[0.05]"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                        {assessment.courseTitle}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                        {assessment.passingScore}% to pass
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-xl tracking-tight">{assessment.title}</CardTitle>
                      <CardDescription className="mt-2 text-sm text-muted-foreground">
                        Created {formatDate(assessment.createdAt)}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileQuestion className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.18em]">Questions</span>
                        </div>
                        <p className="mt-3 text-2xl font-semibold tracking-tight">{assessment.questionCount}</p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.18em]">Avg Score</span>
                        </div>
                        <p className="mt-3 text-2xl font-semibold tracking-tight">{assessment.avgScore.toFixed(1)}</p>
                      </div>
                      <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock3 className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-[0.18em]">Attempts</span>
                        </div>
                        <p className="mt-3 text-2xl font-semibold tracking-tight">{assessment.totalAttempts}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        {assessment.timeLimitMinutes ? `${assessment.timeLimitMinutes} min limit` : "Untimed"} assessment
                      </p>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" className="rounded-full">
                          <Link href={`/instructor/assessments/${assessment.id}/results` as Route}>Results</Link>
                        </Button>
                        <Button asChild className="rounded-full">
                          <Link href={`/instructor/assessments/${assessment.id}/edit` as Route}>Edit</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileQuestion}
              title="No assessments found"
              description="Create your first assessment or widen the current filters to see more results."
              ctaLabel="Create Assessment"
              ctaHref="/instructor/assessments/new"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
