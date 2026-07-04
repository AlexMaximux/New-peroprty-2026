"use client"

import * as React from "react"
import { formatPrice } from "@/lib/data/listings"
import { cn } from "@/lib/utils"

interface FinancialRow {
  label: string
  value: string | number
  type?: "currency" | "percentage" | "plain"
  highlight?: "emerald" | "amber" | "warning" | "bold"
  isTotal?: boolean
  isDivider?: boolean
}

interface FinancialTableProps {
  rows: FinancialRow[]
  className?: string
}

const formatValue = (value: string | number, highlight?: string) => {
  const className = cn(
    "font-mono tabular-nums",
    highlight === "emerald" && "text-[var(--accent)]",
    highlight === "amber" && "text-amber-400",
    highlight === "warning" && "text-[var(--warning)]",
    highlight === "bold" && "font-bold"
  )
  return <span className={className}>{value}</span>
}

export function FinancialTable({ rows, className }: FinancialTableProps) {
  return (
    <div className={cn("bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden", className)}>
      <table className="w-full">
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className={cn(
                "border-b border-[var(--border)]",
                row.isDivider && "border-t-2 border-[var(--border)]",
                index % 2 === 0 && !row.isDivider && "bg-[var(--bg-secondary)]/50"
              )}
            >
              <td className="px-6 py-4 text-[var(--text-muted)] font-medium">
                {row.label}
              </td>
              <td className="px-6 py-4 text-right font-mono tabular-nums">
                {row.isDivider ? (
                  <div className="w-full h-px bg-[var(--border)]" />
                ) : row.type === "currency" && typeof row.value === "number" ? (
                  formatValue(formatPrice(row.value), row.highlight)
                ) : row.type === "percentage" ? (
                  formatValue(`${row.value}%`, row.highlight)
                ) : (
                  formatValue(row.value, row.highlight)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
