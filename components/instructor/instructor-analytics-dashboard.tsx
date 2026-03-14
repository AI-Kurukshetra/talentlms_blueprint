"use client"

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

const pieColors = ["#38bdf8", "#818cf8", "#34d399", "#f59e0b"]

type InstructorAnalyticsDashboardProps = {
  data: {
    engagementSeries: Array<{ label: string; completions: number }>
    coursePerformance: Array<{ title: string; enrollments: number; completionRate: number }>
    difficultyAnalysis: Array<{ id: string; question: string; assessmentTitle: string; estimatedCorrectRate: number }>
    progressDistribution: Array<{ name: string; value: number }>
  }
}

export function InstructorAnalyticsDashboard({ data }: InstructorAnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Student engagement over time</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Recent lesson completion volume across all instructor-owned courses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.engagementSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(2, 6, 23, 0.92)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "18px",
                      color: "#f8fafc"
                    }}
                  />
                  <Bar dataKey="completions" fill="hsl(var(--primary))" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Student progress distribution</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Enrollment mix grouped by current completion percentage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.progressDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                  >
                    {data.progressDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(2, 6, 23, 0.92)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "18px",
                      color: "#f8fafc"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Course performance comparison</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Enrollments and completion rate side by side across your course portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Enrollments</TableHead>
                  <TableHead>Completion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.coursePerformance.length > 0 ? (
                  data.coursePerformance.map((course) => (
                    <TableRow key={course.title}>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>{course.enrollments}</TableCell>
                      <TableCell>{course.completionRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Performance data appears after learners start engaging with your catalog.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Assessment difficulty analysis</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Lowest-performing questions based on estimated correct rate from assessment-level results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Estimated Correct Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.difficultyAnalysis.length > 0 ? (
                  data.difficultyAnalysis.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="max-w-[320px] truncate">{row.question}</TableCell>
                      <TableCell>{row.assessmentTitle}</TableCell>
                      <TableCell>{row.estimatedCorrectRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Difficulty analysis appears after assessment attempts are recorded.
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
