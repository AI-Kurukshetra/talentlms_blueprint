"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type AssessmentResultsChartProps = {
  data: Array<{
    range: string
    count: number
  }>
}

export function AssessmentResultsChart({ data }: AssessmentResultsChartProps) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="range" stroke="rgba(148,163,184,0.7)" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} stroke="rgba(148,163,184,0.7)" tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              background: "rgba(2, 6, 23, 0.92)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              color: "#f8fafc"
            }}
          />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
