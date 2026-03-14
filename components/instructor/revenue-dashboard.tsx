"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

type RevenueDashboardProps = {
  data: {
    metrics: Array<{ label: string; value: string }>
    revenueByCourse: Array<{
      courseId: string
      title: string
      price: number
      totalSales: number
      revenue: number
    }>
    monthlyRevenue: Array<{ label: string; revenue: number }>
    recentTransactions: Array<{
      id: string
      learnerName: string
      courseTitle: string
      amount: number
      date: string
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value)
}

export function RevenueDashboard({ data }: RevenueDashboardProps) {
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Monthly revenue</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Gross course sales derived from paid enrollments over recent months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyRevenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      background: "rgba(2, 6, 23, 0.92)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "18px",
                      color: "#f8fafc"
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Revenue by course</CardTitle>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              Compare pricing, sales count, and gross revenue across your catalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.revenueByCourse.length > 0 ? (
                  data.revenueByCourse.map((row) => (
                    <TableRow key={row.courseId}>
                      <TableCell>{row.title}</TableCell>
                      <TableCell>{formatCurrency(row.price)}</TableCell>
                      <TableCell>{row.totalSales}</TableCell>
                      <TableCell>{formatCurrency(row.revenue)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No revenue yet. Publish a paid course to start tracking sales.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Card className="glass-panel rounded-[30px] border-white/10 bg-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Recent transactions</CardTitle>
          <CardDescription className="text-sm leading-7 text-muted-foreground">
            Latest paid enrollments across your courses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.learnerName}</TableCell>
                    <TableCell>{transaction.courseTitle}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No paid transactions recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
