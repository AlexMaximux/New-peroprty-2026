"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { strategy: "HMO", yield: 14.2 },
  { strategy: "SA", yield: 16.5 },
  { strategy: "BTL", yield: 6.8 },
  { strategy: "Block", yield: 11.5 },
  { strategy: "Commercial", yield: 10.2 },
]

export function YieldChart() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 h-[350px]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Yield by Strategy</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} vertical={false} />
          <XAxis
            dataKey="strategy"
            stroke="var(--text-faint)"
            fontSize={12}
            tick={{ fill: "var(--text-faint)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="var(--text-faint)"
            fontSize={12}
            tick={{ fill: "var(--text-faint)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
            labelStyle={{ color: "var(--text-primary)" }}
          />
          <Bar dataKey="yield" fill="var(--accent)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
