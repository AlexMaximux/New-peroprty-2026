"use client"

import * as React from "react"
import { RefreshCw, Key, Banknote, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const categoryCards = [
  {
    id: "rent2rent",
    icon: RefreshCw,
    title: "Rent to Rent",
    description: "Lease a property and sublet as HMO or SA for monthly cashflow",
    badge: "Most Popular",
  },
  {
    id: "leaseoption",
    icon: Key,
    title: "Lease Option",
    description: "Control a property with an option to buy later at a fixed price",
    badge: undefined,
  },
  {
    id: "sellproperty",
    icon: Banknote,
    title: "Sell Property",
    description: "List your investment property for sale to our buyer network",
    badge: undefined,
  },
]

export function CategoryStep({ selectedCategory, onSelect }: { selectedCategory: string | null; onSelect: (category: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal text-[var(--text-primary)] mb-2">Select Listing Category</h2>
        <p className="text-[var(--text-muted)]">Choose the type of deal you want to create</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {categoryCards.map((cat) => {
          const Icon = cat.icon
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "relative group p-6 rounded-2xl border-2 transition-all duration-300 text-left h-full",
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent-subtle)] shadow-lg shadow-[var(--accent-subtle)]"
                  : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent-border)] hover:bg-[var(--bg-card-hover)]"
              )}
              aria-pressed={isSelected}
            >
              {cat.badge && (
                <Badge className="absolute -top-3 right-4 bg-[var(--accent)] text-white text-xs px-2 py-0.5">
                  {cat.badge}
                </Badge>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  isSelected ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                )}>
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-[var(--accent)] flex-shrink-0 ml-auto" />
                )}
              </div>
              <h3 className="font-display text-xl font-normal text-[var(--text-primary)] mb-2">{cat.title}</h3>
              <p className="text-sm text-[var(--text-muted)]">{cat.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
