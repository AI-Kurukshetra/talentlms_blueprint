import { ArrowDownRight, ArrowUpRight, BookOpenText, CircleAlert, GraduationCap, Users } from "lucide-react"

import { TopCoursesChart } from "@/components/admin/top-courses-chart"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAdminDashboardData } from "@/lib/admin/data"

const metricIcons = [Users, BookOpenText, GraduationCap, CircleAlert]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value))
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData()

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric, index) => {
          const Icon = metricIcons[index]
          const TrendIcon = metric.trend === "down" ? ArrowDownRight : ArrowUpRight

          return (
            <Card key={metric.label} className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    <TrendIcon className="mr-1 h-3.5 w-3.5" />
                    {metric.delta}
                  </Badge>
                </div>
                <CardDescription className="pt-4 text-sm text-muted-foreground">{metric.label}</CardDescription>
                <CardTitle className="text-4xl tracking-tight">{metric.value}</CardTitle>
              </CardHeader>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Recent enrollments</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Latest learner-course assignments across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learner Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Enrolled Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">{enrollment.learnerName}</TableCell>
                    <TableCell>{enrollment.courseTitle}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(enrollment.enrolledDate)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                        {enrollment.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Top courses by enrollment</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Highest-volume training programs across current platform activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopCoursesChart data={data.topCourses} />
          </CardContent>
        </Card>
      </section>

      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">At-risk learners</CardTitle>
          <CardDescription className="text-sm leading-7 text-muted-foreground">
            Learners with in-progress enrollments and no observed momentum for 7 or more days.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.atRiskLearners.length > 0 ? (
            data.atRiskLearners.map((learner) => (
              <div key={learner.id} className="rounded-[24px] border border-white/10 bg-black/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{learner.name}</p>
                    <p className="text-sm text-muted-foreground">{learner.email}</p>
                  </div>
                  <Badge className="rounded-full border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-300">
                    {learner.idleDays}d idle
                  </Badge>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Needs intervention in</p>
                <p className="mt-1 text-base font-medium">{learner.courseTitle}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 p-6 text-sm text-muted-foreground">
              No at-risk learners detected in the last 7 days.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
