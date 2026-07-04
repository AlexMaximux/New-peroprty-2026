"use client"

import * as React from "react"
import { MarketplaceHero } from "@/components/marketplace/marketplace-hero"
import { FilterChips } from "@/components/marketplace/filter-chips"
import { ListingCard } from "@/components/marketplace/listing-card"
import { useSearchListings } from "@/hooks/queries/use-listings"
import type { ListingSearchResult } from "@/lib/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, SearchX } from "lucide-react"

// ── Constants ──────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { key: "newest", label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { key: "roi_desc", label: "Highest ROI", sortBy: "estimatedRoi", sortOrder: "desc" },
  { key: "price_asc", label: "Price: Low to High", sortBy: "askingPricePence", sortOrder: "asc" },
  { key: "price_desc", label: "Price: High to Low", sortBy: "askingPricePence", sortOrder: "desc" },
] as const

/** Map chip labels → API strategy values */
const CHIP_TO_STRATEGY: Record<string, string> = {
  "HMO": "HMO",
  "SA": "SA",
  "Block": "BLOCK_OF_PROPERTY",
  "BMV": "BMV",
  "High ROI": "HIGH_ROI",
  "Commercial": "COMMERCIAL",
  "Land": "SINGLE_LET",
  "Refurb": "HMO",
  "Portfolio": "SINGLE_LET",
}

interface LocalFilters {
  chips: string[]
  excludeSold: boolean
  excludeReserved: boolean
  sortBy: string
  searchQuery: string
  page: number
}

const DEFAULT_FILTERS: LocalFilters = {
  chips: [],
  excludeSold: true,
  excludeReserved: true,
  sortBy: "newest",
  searchQuery: "",
  page: 1,
}

// ── Page Component ─────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [filters, setFilters] = React.useState<LocalFilters>(DEFAULT_FILTERS)

  // Derive the first selected strategy from chips (API only supports single strategy filter)
  const selectedStrategy = React.useMemo(() => {
    for (const chip of filters.chips) {
      if (CHIP_TO_STRATEGY[chip]) return CHIP_TO_STRATEGY[chip]
    }
    return undefined
  }, [filters.chips])

  // Resolve sort config from the key
  const sortConfig = React.useMemo(() => {
    const opt = SORT_OPTIONS.find((o) => o.key === filters.sortBy)
    return opt ?? SORT_OPTIONS[0]
  }, [filters.sortBy])

  // Build API filters
  const apiFilters = React.useMemo(
    () => ({
      strategy: selectedStrategy,
      postcode: filters.searchQuery || undefined,
      excludeSold: filters.excludeSold,
      excludeReserved: filters.excludeReserved,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      page: filters.page,
      limit: 20,
    }),
    [selectedStrategy, filters.searchQuery, filters.excludeSold, filters.excludeReserved, sortConfig, filters.page],
  )

  // Fetch from API
  const { data, isLoading, isError, error } = useSearchListings(apiFilters)

  const listings: ListingSearchResult[] = data?.data ?? []
  const total = data?.meta?.total ?? 0
  const totalPages = data?.meta?.totalPages ?? 1

  // ── Handlers ──

  const handleSearch = React.useCallback((query: string) => {
    setFilters((f) => ({ ...f, searchQuery: query, page: 1 }))
  }, [])

  const handleChipsChange = React.useCallback(
    (chipFilters: { categories: string[]; strategies: string[]; excludeSold: boolean; excludeReserved: boolean }) => {
      setFilters((f) => ({
        ...f,
        chips: chipFilters.categories,
        excludeSold: chipFilters.excludeSold,
        excludeReserved: chipFilters.excludeReserved,
        page: 1,
      }))
    },
    [],
  )

  const handleSortChange = React.useCallback((key: string) => {
    setFilters((f) => ({ ...f, sortBy: key, page: 1 }))
  }, [])

  const handleLoadMore = React.useCallback(() => {
    setFilters((f) => ({ ...f, page: f.page + 1 }))
  }, [])

  const handleClearFilters = React.useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // ── Render ──

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <MarketplaceHero
        initialQuery={filters.searchQuery}
        onSearch={handleSearch}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Chips */}
        <FilterChips
          filters={{
            categories: filters.chips,
            strategies: [],
            excludeSold: filters.excludeSold,
            excludeReserved: filters.excludeReserved,
          }}
          onChange={handleChipsChange}
        />

        {/* Results Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <p className="text-sm text-[var(--text-muted)]">
            {isLoading ? (
              "Searching properties..."
            ) : (
              <>
                {total} {total === 1 ? "property" : "properties"} found
                {filters.searchQuery && <> for &ldquo;{filters.searchQuery}&rdquo;</>}
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">Sort:</span>
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[200px] bg-[var(--bg-card)] border-[var(--border)]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && listings.length === 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-[var(--bg-card)] rounded-t-lg" />
                <div className="bg-[var(--bg-card)] rounded-b-lg p-5 space-y-3">
                  <div className="h-4 bg-[var(--bg-secondary)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--bg-secondary)] rounded w-1/2" />
                  <div className="h-20 bg-[var(--bg-secondary)] rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-16 space-y-4">
            <AlertTriangle className="w-12 h-12 text-[var(--error)] mx-auto" />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Something went wrong</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
              {error instanceof Error ? error.message : "Failed to load properties. Please try again."}
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-2 text-sm text-[var(--accent)] hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && listings.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <SearchX className="w-12 h-12 text-[var(--text-faint)] mx-auto" />
            <p className="text-[var(--text-muted)]">No properties match your filters.</p>
            <button
              onClick={handleClearFilters}
              className="mt-2 text-sm text-[var(--accent)] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Listings Grid */}
        {listings.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Load More / Pagination */}
            {filters.page < totalPages && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-6 py-3 text-sm font-bold tracking-wider uppercase rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-accent)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Loading..." : `Load More (${listings.length} of ${total})`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
