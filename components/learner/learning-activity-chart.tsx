"use client"

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type LearningActivityChartProps = {
  data: Array<{
    label: string
    completions: number
  }>
}

export function LearningActivityChart({ data }: LearningActivityChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} stroke="rgba(148,163,184,0.72)" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "rgba(2, 6, 23, 0.92)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              color: "#f8fafc"
            }}
          />
          <Line
            type="monotone"
            dataKey="completions"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ r: 4, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
