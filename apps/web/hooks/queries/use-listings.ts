"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { searchListings, getListing } from "@/lib/api"
import type { SearchFilters } from "@/_contracts/marketplace.types"

export const listingKeys = {
  all: ["listings"] as const,
  search: (filters: SearchFilters) => [...listingKeys.all, "search", filters] as const,
  detail: (id: string) => [...listingKeys.all, "detail", id] as const,
}

/** GET /listings/search?{filters} -> SearchResponse (type inferred from lib/api). */
export function useSearchListings(filters: SearchFilters) {
  return useQuery({
    queryKey: listingKeys.search(filters),
    queryFn: async () => {
      console.log("[useSearchListings] fetching with filters:", filters)
      const result = await searchListings(filters)
      console.log("[useSearchListings] fetched", result.data.length, "items")
      return result
    },
    placeholderData: keepPreviousData,
  })
}

/** GET /listings/:id -> ListingDetail */
export function useListing(id: string) {
  return useQuery({
    queryKey: listingKeys.detail(id),
    queryFn: () => getListing(id),
    enabled: !!id,
  })
}