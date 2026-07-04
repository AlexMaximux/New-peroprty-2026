"use client"

import * as React from "react"
import { SlidersHorizontal } from "lucide-react"
import { ListingCard } from "./listing-card"
import { useSearchListings } from "@/hooks/queries/use-listings"
import type { SearchFilters } from "@/_contracts/marketplace.types"
import type { ListingSearchResult } from "@/lib/api"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CATEGORY_CHIPS = [
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
] as const

export function MarketplaceView() {
  // States
  const [selectedChips, setSelectedChips] = React.useState<string[]>([])
  const [showMap, setShowMap] = React.useState(false)
  const [sortBy, setSortBy] = React.useState<string>("newest")
  const [strategy, setStrategy] = React.useState<string>("all")
  
  const [minPrice, setMinPrice] = React.useState("")
  const [maxPrice, setMaxPrice] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [distance, setDistance] = React.useState("5")
  const [minYield, setMinYield] = React.useState("")
  const [maxYield, setMaxYield] = React.useState("")

  // Toggle category chips (only allow one active chip to match backend API capability)
  const handleChipToggle = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? [] : [chip]
    )
  }

  // Construct search filters for the API query hook
  const apiFilters = React.useMemo(() => {
    const filters: SearchFilters = {
      page: 1,
      limit: 100,
    }

    // 1. Strategy from dropdown
    if (strategy !== "all") {
      filters.strategy = strategy.toUpperCase()
    }

    // 2. Chip filters
    if (selectedChips.length > 0) {
      const chip = selectedChips[0]!
      const c = chip.toLowerCase()
      if (c === "hmo") filters.strategy = "HMO"
      else if (c === "sa") filters.strategy = "SA"
      else if (c === "block") filters.strategy = "BLOCK"
      else if (c === "refurb") filters.category = "REFURB_OPPORTUNITY"
      else if (c === "commercial") filters.category = "COMMERCIAL"
      else if (c === "land") filters.category = "DEVELOPMENT_OPPORTUNITY"
      else if (c === "portfolio") filters.category = "PORTFOLIO"
      else if (c === "light refurb" || c === "heavy refurb") {
        filters.category = "REFURB_OPPORTUNITY"
        filters.needsRefurb = true
      }
      else if (c === "high roi") {
        filters.roiMin = 10
      }
      else if (c === "bmv") {
        filters.roiMin = 8 // approximate BMV threshold
      }
    }

    // 3. Price
    if (minPrice) filters.priceMin = parseFloat(minPrice) * 100
    if (maxPrice) filters.priceMax = parseFloat(maxPrice) * 100

    // 4. Yield
    if (minYield) filters.roiMin = parseFloat(minYield)
    if (maxYield) filters.roiMax = parseFloat(maxYield)

    // 5. Location
    if (location) filters.postcode = location

    // 6. Sorting
    switch (sortBy) {
      case "high-roi":
        filters.sortBy = "estimatedRoi"
        filters.sortOrder = "desc"
        break
      case "low-roi":
        filters.sortBy = "estimatedRoi"
        filters.sortOrder = "asc"
        break
      case "price-asc":
        filters.sortBy = "askingPricePence"
        filters.sortOrder = "asc"
        break
      case "price-desc":
        filters.sortBy = "askingPricePence"
        filters.sortOrder = "desc"
        break
      case "newest":
        filters.sortBy = "createdAt"
        filters.sortOrder = "desc"
        break
    }

    return filters
  }, [selectedChips, sortBy, strategy, minPrice, maxPrice, location, minYield, maxYield])

  // Fetch real listings from backend API
  const { data, isLoading, error } = useSearchListings(apiFilters)

  // API listings are passed directly to ListingCard (which accepts ListingSearchResult)
  const listings: ListingSearchResult[] = React.useMemo(() => {
    return data?.data ?? []
  }, [data])

  console.log("[MarketplaceView] Render state:", { 
    apiFilters, 
    isLoading, 
    hasData: !!data, 
    dataLength: data?.data?.length, 
    error: error?.message,
    listingsLength: listings.length 
  })

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-ui p-6 lg:p-8 flex flex-col gap-6">
      
      {/* FILTER BAR ROW 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Filter Chips */}
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold tracking-widest uppercase">Filters:</span>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 -mb-1.5 no-scrollbar flex-1">
            {CATEGORY_CHIPS.map((chip) => {
              const active = selectedChips.includes(chip)
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipToggle(chip)}
                  className={`px-3.5 py-1.5 text-[11px] font-bold uppercase rounded-[4px] border transition-all duration-200 whitespace-nowrap ${
                    active
                      ? "bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]"
                      : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)] hover:border-[var(--text-faint)]"
                  }`}
                >
                  {chip}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Map Toggle & Sort */}
        <div className="flex items-center justify-end gap-6 flex-shrink-0">
          {/* Show Map Toggle */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">Show Map</span>
            <Switch 
              checked={showMap}
              onCheckedChange={setShowMap}
              className="data-[state=checked]:bg-[var(--accent)]"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">Sort:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-9 bg-[var(--bg-card)] border-[var(--border)] text-xs font-semibold rounded-[4px] text-[var(--text-primary)] focus:ring-[var(--accent-border)]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)] text-xs text-[var(--text-primary)]">
                <SelectItem value="high-roi">High ROI</SelectItem>
                <SelectItem value="low-roi">Low ROI</SelectItem>
                <SelectItem value="price-asc">Prices: Low to High</SelectItem>
                <SelectItem value="price-desc">Prices: High to Low</SelectItem>
                <SelectItem value="newest">Newest Property</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* FILTER BAR ROW 2 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-[var(--border)] pt-5 mt-1">
        {/* Left: Results Count */}
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            <span className="text-[var(--accent)] font-bold mr-1">
              {isLoading ? "..." : listings.length}
            </span>
            {listings.length === 1 ? "property" : "properties"} found
          </p>
        </div>

        {/* Right: Detailed Inputs */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
          {/* Strategy */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--text-faint)] uppercase tracking-wider text-[10px]">Strategy:</span>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger className="w-[120px] h-8 bg-[var(--bg-card)] border-[var(--border)] text-xs rounded-[4px] text-[var(--text-primary)]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)] text-xs text-[var(--text-primary)]">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="hmo">HMO</SelectItem>
                <SelectItem value="sa">SA</SelectItem>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="refurb">Refurb</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="portfolio">Portfolio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[var(--text-faint)] uppercase tracking-wider text-[10px] mr-1">Price:</span>
            <input 
              type="number" 
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-20 h-8 px-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-[4px] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-border)]"
            />
            <span className="text-[var(--text-faint)]">-</span>
            <input 
              type="number" 
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-20 h-8 px-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-[4px] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-border)]"
            />
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[var(--text-faint)] uppercase tracking-wider text-[10px] mr-1">Location:</span>
            <div className="relative flex items-center">
              <input 
                type="text" 
                placeholder="City/Postcode"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-36 h-8 pl-2 pr-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-[4px] text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-border)]"
              />
              <Select value={distance} onValueChange={setDistance}>
                <SelectTrigger className="absolute right-0 w-[42px] h-8 bg-transparent border-none text-[10px] text-[var(--text-muted)] focus:ring-0">
                  <SelectValue placeholder="+5m" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)] text-xs text-[var(--text-primary)]">
                  <SelectItem value="5">+5m</SelectItem>
                  <SelectItem value="10">+10m</SelectItem>
                  <SelectItem value="20">+20m</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Yield */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[var(--text-faint)] uppercase tracking-wider text-[10px] mr-1">Yield:</span>
            <input 
              type="number" 
              placeholder="Min %"
              value={minYield}
              onChange={(e) => setMinYield(e.target.value)}
              className="w-16 h-8 px-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-[4px] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-border)]"
            />
            <span className="text-[var(--text-faint)]">-</span>
            <input 
              type="number" 
              placeholder="Max %"
              value={maxYield}
              onChange={(e) => setMaxYield(e.target.value)}
              className="w-16 h-8 px-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-[4px] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-border)]"
            />
          </div>
        </div>
      </div>

      {/* LISTINGS GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] animate-pulse flex flex-col">
              <div className="aspect-video w-full bg-[var(--bg-secondary)] rounded-t-lg" />
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div className="h-4 w-2/3 bg-[var(--bg-secondary)] rounded" />
                <div className="h-3 w-1/2 bg-[var(--bg-secondary)] rounded" />
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="h-10 bg-[var(--bg-secondary)] rounded" />
                  <div className="h-10 bg-[var(--bg-secondary)] rounded" />
                  <div className="h-10 bg-[var(--bg-secondary)] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--error)]/30 rounded-lg bg-[var(--bg-card)]">
          <p className="text-[var(--error)] text-sm mb-2 font-semibold">Failed to load listings</p>
          <p className="text-[var(--text-muted)] text-xs">Please make sure the API server is running on port 3001.</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--border)] rounded-lg bg-[var(--bg-card)]/30">
          <p className="text-[var(--text-muted)] text-sm mb-4">No properties match your filters.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedChips([])
              setStrategy("all")
              setMinPrice("")
              setMaxPrice("")
              setLocation("")
              setMinYield("")
              setMaxYield("")
            }}
            className="px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-[4px] bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--text-faint)] transition-all"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2 animate-fade-in">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

    </div>
  )
}