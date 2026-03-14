import { Activity, BookCheck, Gauge, Sparkles } from "lucide-react"

import { LearningActivityChart } from "@/components/learner/learning-activity-chart"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { getLearnerProgressData } from "@/lib/learner/data"

const metricIcons = [Activity, Gauge, BookCheck, Sparkles]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value))
}

export default async function LearnerProgressPage() {
  const data = await getLearnerProgressData()

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
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Learning activity</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Daily lesson completions across your recent learning sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LearningActivityChart data={data.activitySeries} />
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Skills being developed</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              High-level capability areas inferred from your current course mix.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.skills.length > 0 ? (
              data.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="rounded-full px-3 py-1">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Skills will appear as you enroll in more courses.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Course by course progress</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Completion breakdown across each enrollment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.courseBreakdown.map((course) => (
              <div key={course.courseId} className="rounded-[24px] border border-white/10 bg-black/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.completedLessons} / {course.totalLessons} lessons completed
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                    {course.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <span>Progress</span>
                    <span>{course.progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${course.progressPercent}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Assessment history</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Recorded scores across the assessments you have taken.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.grades.length > 0 ? (
                  data.grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell>{grade.assessmentTitle}</TableCell>
                      <TableCell>{grade.courseTitle}</TableCell>
                      <TableCell>{grade.score.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-full px-3 py-1 ${
                            grade.passed
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : "border-red-500/20 bg-red-500/10 text-red-300"
                          }`}
                        >
                          {grade.passed ? "Passed" : "Needs work"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(grade.submittedAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No assessment history recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
