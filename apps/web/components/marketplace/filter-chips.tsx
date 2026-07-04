"use client"

import * as React from "react"

interface FilterChipsProps {
  filters: {
    categories: string[]
    strategies: string[]
    excludeSold: boolean
    excludeReserved: boolean
  }
  onChange: (filters: FilterChipsProps["filters"]) => void
}

const categoryChips = [
  "BMV",
  "High ROI",
  "HMO",
  "Block",
  "Refurb",
  "Commercial",
  "Land",
  "SA",
  "Portfolio",
  "Light Refurb",
  "Heavy Refurb",
]

export function FilterChips({ filters, onChange }: FilterChipsProps) {
  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]
    onChange({ ...filters, categories: newCategories })
  }

  const handleExcludeToggle = (key: "excludeSold" | "excludeReserved") => {
    onChange({ ...filters, [key]: !filters[key] })
  }

  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 px-4 -mx-4 lg:px-0 lg:mx-0" role="group" aria-label="Filter by category and status">
      {categoryChips.map((category) => (
        <button
          key={category}
          onClick={() => handleCategoryToggle(category)}
          className={`
            whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-full border transition-all duration-200
            ${filters.categories.includes(category)
              ? "bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]"
              : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
            }
          `}
          aria-pressed={filters.categories.includes(category)}
        >
          {category}
        </button>
      ))}

      <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4 ml-2">
        {[
          { key: "excludeSold" as const, label: "Excl. Sold" },
          { key: "excludeReserved" as const, label: "Excl. Reserved" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleExcludeToggle(key)}
            className={`
              whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200
              ${filters[key]
                ? "bg-[var(--accent)] text-white shadow-[var(--accent-subtle)]"
                : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)]"
              }
            `}
            aria-pressed={filters[key]}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
