"use client"

import { useMemo, useState, useTransition } from "react"
import { Download, BellRing } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

const pieColors = ["#38bdf8", "#34d399"]

type AdminAnalyticsDashboardProps = {
  data: {
    metricsByRange: Record<string, {
      totalUsers: string
      totalCourses: string
      totalEnrollments: string
      completionRate: string
      totalRevenue: string
    }>
    timeline: Array<{ date: string; label: string; registrations: number; enrollments: number }>
    topCourses: Array<{ name: string; enrollments: number }>
    completionRates: Array<{ name: string; completionRate: number }>
    passDistribution: Array<{ name: string; value: number }>
    atRiskLearners: Array<{
      enrollmentId: string
      learnerId: string
      name: string
      courseTitle: string
      progressPercent: number
      lastActive: string
    }>
    reportRows: Array<{
      learnerName: string
      learnerEmail: string
      courseTitle: string
      status: string
      enrolledAt: string
      amount: number
    }>
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value))
}

export function AdminAnalyticsDashboard({ data }: AdminAnalyticsDashboardProps) {
  const { toast } = useToast()
  const [range, setRange] = useState("30")
  const [pendingLearnerId, startTransition] = useTransition()

  const visibleMetrics = data.metricsByRange[range] ?? data.metricsByRange["30"]
  const filteredTimeline = useMemo(() => {
    const days = Number(range)
    const start = new Date()
    start.setUTCHours(0, 0, 0, 0)
    start.setUTCDate(start.getUTCDate() - (days - 1))
    return data.timeline.filter((point) => new Date(point.date) >= start)
  }, [data.timeline, range])

  function exportCsv() {
    const header = ["Learner", "Email", "Course", "Status", "Enrolled At", "Amount"]
    const rows = data.reportRows.map((row) => [
      row.learnerName,
      row.learnerEmail,
      row.courseTitle,
      row.status,
      formatDate(row.enrolledAt),
      `${row.amount}`
    ])
    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "admin-analytics-report.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function sendReminder(learnerId: string, courseTitle: string) {
    startTransition(async () => {
      const response = await fetch("/api/admin/analytics/reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ learnerId, courseTitle })
      })
      const result = await response.json()

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Reminder failed",
          description: result.error ?? "Unable to send reminder."
        })
        return
      }

      toast({
        title: "Reminder sent",
        description: `A reminder notification was created for ${courseTitle}.`
      })
    })
  }

  const metricCards = [
    { label: "Total Users", value: visibleMetrics.totalUsers },
    { label: "Total Courses", value: visibleMetrics.totalCourses },
    { label: "Total Enrollments", value: visibleMetrics.totalEnrollments },
    { label: "Completion Rate", value: visibleMetrics.completionRate },
    { label: "Total Revenue", value: visibleMetrics.totalRevenue }
  ]

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-primary">Advanced Analytics</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Operational visibility across the LMS</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              Monitor registrations, enrollments, completions, revenue, and at-risk learners from one reporting surface.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="w-full sm:w-40">
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="rounded-full" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((metric) => (
          <Card key={metric.label} className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm text-muted-foreground">{metric.label}</CardDescription>
              <CardTitle className="text-4xl tracking-tight">{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">User registrations over time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredTimeline}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "rgba(2,6,23,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px" }} />
                  <Line type="monotone" dataKey="registrations" stroke="#38bdf8" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Enrollments over time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredTimeline}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "rgba(2,6,23,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px" }} />
                  <Line type="monotone" dataKey="enrollments" stroke="#818cf8" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Top 10 courses by enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topCourses} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={160} stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "rgba(2,6,23,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px" }} />
                  <Bar dataKey="enrollments" fill="hsl(var(--primary))" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Assessment pass rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.passDistribution} dataKey="value" nameKey="name" innerRadius={80} outerRadius={120} paddingAngle={4}>
                    {data.passDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "rgba(2,6,23,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Course completion rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.completionRates} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={160} stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "rgba(2,6,23,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px" }} />
                  <Bar dataKey="completionRate" fill="#34d399" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">At risk learners</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Learners with low progress and no recent activity. Send a quick nudge directly from analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Progress %</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.atRiskLearners.length > 0 ? (
                  data.atRiskLearners.map((learner) => (
                    <TableRow key={learner.enrollmentId}>
                      <TableCell>{learner.name}</TableCell>
                      <TableCell>{learner.courseTitle}</TableCell>
                      <TableCell>{learner.progressPercent.toFixed(1)}%</TableCell>
                      <TableCell>{formatDate(learner.lastActive)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={pendingLearnerId}
                          onClick={() => sendReminder(learner.learnerId, learner.courseTitle)}
                        >
                          <BellRing className="mr-2 h-4 w-4" />
                          Send Reminder
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No at-risk learners detected in the current dataset.
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
