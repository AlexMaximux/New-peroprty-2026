"use client"

import * as React from "react"
import { formatPrice } from "@/lib/data/listings"
import { cn } from "@/lib/utils"

interface FinancialSummaryProps {
  formData: {
    rentToLandlord: number
    deposit: number
    contractLength: number
    contractLengthUnit: "years" | "months"
    reviewPeriod: number
    reviewPeriodUnit: "years" | "months"
    referenceType: string
    finderFee: number
    coSource: boolean
    includedBills: string[]
    refurbCost: number
    refurbQuoted: boolean
  }
}

export function FinancialSummary({ formData }: FinancialSummaryProps) {
  // Calculate values
  const monthlyCosts = formData.rentToLandlord + (formData.deposit / (formData.contractLengthUnit === "years" ? formData.contractLength * 12 : formData.contractLength))
  const totalMoneyIn = formData.deposit + formData.refurbCost + formData.finderFee
  const potentialProfit = formData.rentToLandlord * 4 - monthlyCosts // simplified calculation

  return (
    <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-card)] border border-[var(--accent-border)] rounded-2xl p-6 space-y-4 animate-counter">
      <h4 className="font-display text-lg font-normal text-[var(--text-primary)] flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">£</span>
        Financial Summary
      </h4>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Money Needed to be In</span>
          <span className="font-mono tabular-nums text-[var(--text-primary)] font-bold">{formatPrice(totalMoneyIn)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Potential Monthly Profit</span>
          <span className={cn("font-mono tabular-nums font-bold", potentialProfit >= 0 ? "text-[var(--accent)]" : "text-[var(--error)]")}>
            {potentialProfit >= 0 ? "+" : ""}{formatPrice(potentialProfit)}/mo
          </span>
        </div>
        <div className="pt-2 border-t border-[var(--accent-border)] flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Management Available</span>
          <span className="font-medium text-[var(--accent)]">Yes</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Agency Details</span>
          <span className="font-medium text-[var(--text-primary)]">PropertySource UK</span>
        </div>
      </div>
    </div>
  )
}
