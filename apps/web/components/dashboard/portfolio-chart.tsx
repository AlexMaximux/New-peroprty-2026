"use client"

import * as React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { month: "Jan", value: 850 },
  { month: "Feb", value: 920 },
  { month: "Mar", value: 1050 },
  { month: "Apr", value: 1180 },
  { month: "May", value: 1320 },
  { month: "Jun", value: 1470 },
]

export function PortfolioChart() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 h-[350px]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Portfolio Growth</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
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
            tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
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
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#portfolioGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
