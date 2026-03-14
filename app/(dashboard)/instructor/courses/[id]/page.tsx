import type { Route } from "next"
import Link from "next/link"
import { ArrowLeft, BookOpenText, ClipboardList, Users } from "lucide-react"

import { DiscussionForum } from "@/components/shared/discussion-forum"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getInstructorCourseDetail } from "@/lib/instructor/data"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value))
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export default async function InstructorCourseDetailPage({ params }: { params: { id: string } }) {
  const course = await getInstructorCourseDetail(params.id)

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/10">
              {course.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnailUrl} alt={course.title} className="h-40 w-56 object-cover" />
              ) : (
                <div className="flex h-40 w-56 items-center justify-center text-sm text-muted-foreground">
                  No thumbnail
                </div>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                  {course.status}
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {course.studentCount} students
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {formatPercent(course.completionRate)} completion
                </Badge>
              </div>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight">{course.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                {course.description || "No description added yet."}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.22em] text-primary">
                Updated {formatDate(course.updatedAt)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/instructor/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href={`/instructor/courses/${course.id}/edit` as Route}>Edit Course</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <BookOpenText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl tracking-tight">Lessons</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  Completion signals for each lesson in the course sequence.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {course.lessons.map((lesson, index) => (
              <div key={lesson.id} className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {index + 1}. {lesson.title}
                    </p>
                    <p className="mt-1 text-sm capitalize text-muted-foreground">{lesson.type}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {lesson.completions} completions
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <span>Completion</span>
                    <span>{formatPercent(lesson.completionRate)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${lesson.completionRate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl tracking-tight">Enrolled students</CardTitle>
                  <CardDescription className="text-sm leading-7 text-muted-foreground">
                    Progress snapshots across current learners.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.students.map((student) => (
                <div key={student.id} className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                      {student.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <span>Progress</span>
                      <span>{formatPercent(student.progressPercent)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${student.progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl tracking-tight">Assessment summary</CardTitle>
                  <CardDescription className="text-sm leading-7 text-muted-foreground">
                    Submission volume, average score, and pass rate by assessment.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.assessments.length > 0 ? (
                course.assessments.map((assessment) => (
                  <div key={assessment.id} className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                    <p className="font-medium">{assessment.title}</p>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-sm text-muted-foreground">
                      <div>
                        <p>Submissions</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">{assessment.submissions}</p>
                      </div>
                      <div>
                        <p>Avg score</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">{assessment.avgScore.toFixed(1)}</p>
                      </div>
                      <div>
                        <p>Pass rate</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">{formatPercent(assessment.passRate)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 p-6 text-sm text-muted-foreground">
                  No assessments have been created for this course yet.
                </div>
              )}
            </CardContent>
          </Card>

          <DiscussionForum
            courseId={course.id}
            title="Course discussion"
            description="Review learner questions and reply from the instructor workspace in real time."
          />
        </div>
      </section>
    </div>
  )
}
