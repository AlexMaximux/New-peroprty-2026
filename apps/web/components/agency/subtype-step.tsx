"use client"

import * as React from "react"
import { Building2, Home, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const subtypes = [
  {
    id: "hmo",
    icon: Building2,
    title: "HMO",
    description: "House in Multiple Occupation - licensed multi-let",
    badge: undefined,
  },
  {
    id: "sa",
    icon: Home,
    title: "SA / Serviced Accommodation",
    description: "Short-term lets with hotel-style services",
    badge: "Coming Soon",
  },
]

export function SubtypeStep({ selectedSubtype, onSelect }: { selectedSubtype: string | null; onSelect: (subtype: string) => void }) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="font-display text-2xl font-normal text-[var(--text-primary)] mb-2">Select Investment Strategy</h2>
        <p className="text-[var(--text-muted)]">Choose the specific strategy for your Rent to Rent deal</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {subtypes.map((subtype) => {
          const Icon = subtype.icon
          const isSelected = selectedSubtype === subtype.id
          const isComingSoon = subtype.badge === "Coming Soon"
          return (
            <button
              key={subtype.id}
              onClick={() => !isComingSoon && onSelect(subtype.id)}
              disabled={isComingSoon}
              className={cn(
                "relative group p-6 rounded-2xl border-2 transition-all duration-300 text-left h-full",
                isComingSoon
                  ? "border-[var(--border)] bg-[var(--bg-card)] opacity-60 cursor-not-allowed"
                  : isSelected
                  ? "border-[var(--accent)] bg-[var(--accent-subtle)] shadow-lg shadow-[var(--accent-subtle)]"
                  : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-card-hover)]"
              )}
              aria-pressed={isSelected}
              aria-disabled={isComingSoon}
            >
              {subtype.badge && (
                <Badge className={cn(
                  "absolute -top-3 right-4 text-xs px-2 py-0.5",
                  subtype.badge === "Coming Soon"
                    ? "bg-[var(--warning)] text-white"
                    : "bg-[var(--accent)] text-white"
                )}>
                  {subtype.badge}
                </Badge>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  isComingSoon
                    ? "bg-[var(--bg-secondary)] text-[var(--text-faint)]"
                    : isSelected
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                )}>
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                {isSelected && !isComingSoon && (
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent)] flex-shrink-0 ml-auto" />
                )}
              </div>
              <h3 className="font-display text-xl font-normal text-[var(--text-primary)] mb-2">{subtype.title}</h3>
              <p className="text-sm text-[var(--text-muted)]">{subtype.description}</p>
              {isComingSoon && (
                <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
                  <span className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium">Coming Soon</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
