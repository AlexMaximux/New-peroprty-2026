"use client"

import * as React from "react"
import { useSearchListings } from "@/hooks/queries/use-listings"
import { R2RListingCard } from "./r2r-listing-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function R2RMarketplaceView() {
  const [sortBy, setSortBy] = React.useState<string>("highest-spread")

  // Fetch all listings first, then we filter and sort R2R properties client-side to ensure robustness
  const { data: searchResponse, isLoading, error } = useSearchListings({
    page: 1,
    limit: 100,
  })

  // Filter listings for R2R properties:
  // - Category is RENT_TO_RENT
  // - Or strategy is HMO / R2R HMO
  const r2rListings = React.useMemo(() => {
    if (!searchResponse?.data) return []
    
    return searchResponse.data.filter((listing) => {
      const strategy = (listing.strategy || "").toUpperCase()
      const category = (listing.category || "").toUpperCase()
      return category === "RENT_TO_RENT" || strategy.includes("R2R") || (strategy === "HMO" && category === "RENT_TO_RENT")
    })
  }, [searchResponse])

  // Sort R2R listings
  const sortedListings = React.useMemo(() => {
    const list = [...r2rListings]
    if (sortBy === "highest-spread") {
      list.sort((a, b) => {
        const aSpec = a.strategySpecificData || {}
        const bSpec = b.strategySpecificData || {}
        const aSpread = (aSpec.monthlySpreadPence as number) || 0
        const bSpread = (bSpec.monthlySpreadPence as number) || 0
        return bSpread - aSpread
      })
    } else if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sortBy === "lowest-fee") {
      list.sort((a, b) => (a.askingPricePence || 0) - (b.askingPricePence || 0))
    }
    return list
  }, [r2rListings, sortBy])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        <div className="h-8 bg-[var(--bg-secondary)] rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-[var(--bg-secondary)] rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-red-500">
        Failed to load R2R marketplace deals. Please try again.
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-[var(--bg-card)] border-b border-[var(--border)] py-4 px-6 flex justify-between items-center shrink-0">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
            {sortedListings.length} R2R deals found
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">High-yielding Rent-to-Rent HMO and SA opportunities</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-[var(--bg-secondary)] border-[var(--border)]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
              <SelectItem value="highest-spread">Highest Spread</SelectItem>
              <SelectItem value="newest">Newest Deals</SelectItem>
              <SelectItem value="lowest-fee">Lowest Sourcing Fee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Grid Canvas */}
      <main className="flex-1 overflow-y-auto p-6 bg-[var(--bg-primary)]">
        {sortedListings.length === 0 ? (
          <div className="h-[50vh] flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">No R2R Deals Found</h3>
            <p className="text-sm text-[var(--text-muted)] mt-2">There are currently no active Rent-to-Rent listings available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {sortedListings.map((listing) => (
              <R2RListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
