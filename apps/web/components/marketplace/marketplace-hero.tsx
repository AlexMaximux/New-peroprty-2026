"use client"

import * as React from "react"
import { Search } from "lucide-react"

interface MarketplaceHeroProps {
  initialQuery: string
  onSearch: (query: string) => void
}

export function MarketplaceHero({ initialQuery, onSearch }: MarketplaceHeroProps) {
  const [query, setQuery] = React.useState(initialQuery)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query.trim())
  }

  return (
    <section className="relative py-16 lg:py-24 bg-[var(--bg-secondary)] overflow-hidden">
      {/* Radial glow background */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[var(--accent)]/20 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Label */}
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-4">
          INSTITUTIONAL-GRADE DEALS. DIRECT ACCESS.
        </p>

        {/* Main Heading */}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal text-[var(--text-primary)] mb-6 leading-tight">
          Discover Below Market Value Investment Properties
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-[var(--text-muted)] max-w-2xl mb-10">
          6,400+ exclusive deals sourced by verified agencies across England & Wales
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="relative max-w-3xl">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-faint)]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by location, postcode, property type..."
              className="w-full h-14 pl-12 pr-36 py-3 text-base bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-faint)] transition-all duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
              aria-label="Search properties"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors shadow-lg shadow-[var(--accent-subtle)]"
              aria-label="Search"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
