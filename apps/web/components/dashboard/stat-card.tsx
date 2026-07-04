"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  subtitle: string
  icon?: React.ReactNode
  trend?: { value: string; positive: boolean }
  className?: string
}

export function StatCard({ label, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 transition-all duration-200 hover:border-[var(--accent-border)] hover:shadow-lg hover:shadow-[var(--accent-subtle)]",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
          <p className="font-mono tabular-nums text-3xl font-bold text-[var(--text-primary)] mt-1">
            {value}
          </p>
        </div>
        {icon && <div className="w-10 h-10 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">{icon}</div>}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-faint)]">{subtitle}</p>
        {trend && (
          <span
            className={cn(
              "text-sm font-medium flex items-center gap-1",
              trend.positive ? "text-[var(--accent)]" : "text-[var(--error)]"
            )}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
