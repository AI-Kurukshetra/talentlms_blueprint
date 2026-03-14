"use client"

import { useMemo, useState } from "react"
import { Download, Eye, Search } from "lucide-react"

import type { InstructorStudentsData } from "@/lib/instructor/data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

type StudentsTableProps = {
  data: InstructorStudentsData
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value))
}

export function StudentsTable({ data }: StudentsTableProps) {
  const [query, setQuery] = useState("")
  const [courseId, setCourseId] = useState("all")
  const [selectedRow, setSelectedRow] = useState<InstructorStudentsData["rows"][number] | null>(null)

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return data.rows.filter((row) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        row.name.toLowerCase().includes(normalizedQuery) ||
        row.email.toLowerCase().includes(normalizedQuery)
      const matchesCourse = courseId === "all" || row.courseId === courseId
      return matchesQuery && matchesCourse
    })
  }, [courseId, data.rows, query])

  function exportCsv() {
    const header = [
      "Name",
      "Email",
      "Course",
      "Progress",
      "Last Active",
      "Assessment Score",
      "Status"
    ]
    const rows = filteredRows.map((row) => [
      row.name,
      row.email,
      row.courseTitle,
      `${row.progressPercent.toFixed(1)}%`,
      formatDate(row.lastActivity),
      `${row.assessmentScore.toFixed(1)}%`,
      row.status
    ])
    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "instructor-students.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <Card key={metric.label} className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
            <CardHeader className="pb-3">
              <CardDescription className="text-sm text-muted-foreground">{metric.label}</CardDescription>
              <CardTitle className="text-4xl tracking-tight">{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="text-2xl tracking-tight">Student management</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Monitor enrolled learners across your course catalog and export the current filtered roster as CSV.
            </CardDescription>
          </div>
          <Button variant="outline" className="rounded-full" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="space-y-2">
              <Label htmlFor="student-search">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="student-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-10"
                  placeholder="Search by learner name or email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Course filter</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {data.courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Assessment Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => {
                  const initials = row.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <TableRow key={row.enrollmentId}>
                      <TableCell>
                        <Avatar className="h-10 w-10 ring-1 ring-white/10">
                          {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt={row.name} /> : null}
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.courseTitle}</TableCell>
                      <TableCell>{row.progressPercent.toFixed(1)}%</TableCell>
                      <TableCell>{formatDate(row.lastActivity)}</TableCell>
                      <TableCell>{row.assessmentScore.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => setSelectedRow(row)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No students match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedRow)}
        onOpenChange={(open) => {
          if (!open) setSelectedRow(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedRow?.name ?? "Learner detail"}</DialogTitle>
            <DialogDescription>
              Detailed progress for the selected learner and course enrollment.
            </DialogDescription>
          </DialogHeader>
          {selectedRow ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Course</p>
                  <p className="mt-2 font-medium">{selectedRow.courseTitle}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                  <p className="mt-2 font-medium capitalize">{selectedRow.status.replace("_", " ")}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Lessons</p>
                  <p className="mt-2 font-medium">
                    {selectedRow.completedLessons} / {selectedRow.totalLessons}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Last Active</p>
                  <p className="mt-2 font-medium">{formatDate(selectedRow.lastActivity)}</p>
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/10 p-4">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <span>Progress</span>
                  <span>{selectedRow.progressPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${selectedRow.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
