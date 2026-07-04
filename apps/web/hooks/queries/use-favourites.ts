"use client"

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { addFavourite, removeFavourite, getFavourites } from "@/lib/api"
import { listingKeys } from "./use-listings"

export const favouriteKeys = {
	all: ["favourites"] as const,
}

export function useFavourites() {
	return useQuery({
		queryKey: favouriteKeys.all,
		queryFn: () => getFavourites(),
	})
}

/**
 * POST /favourites/{listingId}  (add)
 * DELETE /favourites/{listingId} (remove)
 *
 * Both calls are awaited and the function resolves to void so the mutation has a
 * single, consistent return type (addFavourite and removeFavourite return
 * different shapes). Invalidates search + favourites so state stays in sync.
 */
export function useToggleFavourite() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async ({
			listingId,
			next,
		}: {
			listingId: string
			next: boolean
		}): Promise<void> => {
			if (next) {
				await addFavourite(listingId)
			} else {
				await removeFavourite(listingId)
			}
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: listingKeys.all })
			qc.invalidateQueries({ queryKey: favouriteKeys.all })
		},
	})
}