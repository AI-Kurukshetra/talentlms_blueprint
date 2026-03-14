"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type TopCoursesChartProps = {
  data: Array<{
    name: string
    enrollments: number
  }>
}

export function TopCoursesChart({ data }: TopCoursesChartProps) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.14)" />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "rgba(148, 163, 184, 0.85)", fontSize: 12 }} />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            width={120}
            tick={{ fill: "rgba(226, 232, 240, 0.95)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(148,163,184,0.16)",
              background: "rgba(2,6,23,0.92)",
              color: "white"
            }}
          />
          <Bar dataKey="enrollments" radius={[0, 10, 10, 0]} fill="hsl(var(--primary))" barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
