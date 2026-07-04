"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import type { HmoFormData } from "../wizard-types"

interface Props {
  data: HmoFormData
}

export function IncomeStep({ data }: Props) {
  const totalIncome = data.rooms.reduce((sum, r) => sum + r.monthlyRent, 0)
  const monthlyProfit = totalIncome - data.rentToLandlord
  const annualProfit = monthlyProfit * 12

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
          Potential Income
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">Auto-calculated from your room configuration and rent terms</p>
      </div>

      {/* Room-by-room income */}
      <div className="bg-slate-900/30 border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-900/40 border-b border-white/[0.06]">
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Room Breakdown</h4>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {data.rooms.map((room, i) => (
            <div key={room.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] text-xs font-bold">{i + 1}</span>
                <div>
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{room.type === "Other" ? room.customType || "Custom Room" : room.type}</span>
                </div>
              </div>
              <span className="text-sm font-mono tabular-nums text-[var(--text-primary)] font-bold">
                £{room.monthlyRent.toLocaleString()}<span className="text-[10px] text-[var(--text-muted)] font-normal">/mo</span>
              </span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-[var(--accent-subtle)] border-t border-[var(--accent-border)] flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">Total Gross Monthly</span>
          <span className="text-lg font-mono tabular-nums text-[var(--accent)] font-bold">£{totalIncome.toLocaleString()}/mo</span>
        </div>
      </div>

      {/* Profit Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-slate-900/30 border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Rent to Landlord</p>
          <p className="text-lg font-mono tabular-nums text-[var(--text-primary)] font-bold">£{data.rentToLandlord.toLocaleString()}/mo</p>
        </div>
        <div className={`border rounded-xl p-4 text-center ${monthlyProfit >= 0 ? "bg-[var(--accent)]/5 border-[var(--accent-border)]" : "bg-red-500/5 border-red-500/20"}`}>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Monthly Gross Profit</p>
          <p className={`text-lg font-mono tabular-nums font-bold ${monthlyProfit >= 0 ? "text-[var(--accent)]" : "text-red-400"}`}>
            {monthlyProfit >= 0 ? "+" : ""}£{monthlyProfit.toLocaleString()}/mo
          </p>
        </div>
        <div className={`border rounded-xl p-4 text-center ${annualProfit >= 0 ? "bg-[var(--accent)]/5 border-[var(--accent-border)]" : "bg-red-500/5 border-red-500/20"}`}>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Annual Gross Profit</p>
          <p className={`text-lg font-mono tabular-nums font-bold ${annualProfit >= 0 ? "text-[var(--accent)]" : "text-red-400"}`}>
            {annualProfit >= 0 ? "+" : ""}£{annualProfit.toLocaleString()}/yr
          </p>
        </div>
      </div>

      {data.rooms.some((r) => r.monthlyRent === 0) && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
          ⚠️ Some rooms have £0 rent. Go back to HMO Details to set room rents for an accurate income projection.
        </div>
      )}
    </div>
  )
}
