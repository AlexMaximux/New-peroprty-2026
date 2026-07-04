"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

/**
 * Wrap the authenticated tree so client components can use TanStack Query.
 * Hoist this to the root app/layout.tsx if you want it shared across all routes.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
	const [client] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
				},
			}),
	)
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
