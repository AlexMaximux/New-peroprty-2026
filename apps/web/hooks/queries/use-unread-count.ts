"use client"

import { useQuery } from "@tanstack/react-query"
import { getUnreadCount } from "@/lib/api"

/** GET /conversations/unread-count -> { count: number }. Drives the Messages nav badge. */
export function useUnreadCount() {
	return useQuery({
		queryKey: ["conversations", "unread-count"],
		queryFn: getUnreadCount,
		refetchInterval: 30_000,
	})
}
