import { BarChart3, CircleCheckBig, Gauge, History } from "lucide-react"

import { AssessmentResultsChart } from "@/components/instructor/assessment-results-chart"
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
import { getInstructorAssessmentResultsData } from "@/lib/assessment/data"

const metricIcons = [History, Gauge, CircleCheckBig]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value))
}

export default async function AssessmentResultsPage({ params }: { params: { id: string } }) {
  const data = await getInstructorAssessmentResultsData(params.id)

  const metrics = [
    { label: "Total Attempts", value: `${data.totalAttempts}` },
    { label: "Avg Score", value: `${data.avgScore.toFixed(1)}%` },
    { label: "Pass Rate", value: `${data.passRate.toFixed(1)}%` }
  ]

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">{data.courseTitle}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{data.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Attempt analytics, pass performance, and score distribution for this assessment.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full px-4 py-2">
            Passing score {data.passingScore}%
          </Badge>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric, index) => {
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

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl tracking-tight">Score distribution</CardTitle>
                <CardDescription className="text-sm leading-7 text-muted-foreground">
                  See where learner outcomes cluster across score bands.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AssessmentResultsChart data={data.distribution} />
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Learner attempts</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Every recorded attempt with score, outcome, and submission timestamp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.attempts.length > 0 ? (
                  data.attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{attempt.learnerName}</p>
                          <p className="text-sm text-muted-foreground">{attempt.learnerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{attempt.score.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge
                          className={`rounded-full px-3 py-1 ${
                            attempt.passed
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : "border-red-500/20 bg-red-500/10 text-red-300"
                          }`}
                        >
                          {attempt.passed ? "Passed" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(attempt.submittedAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No attempts recorded yet.
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
