import "server-only"
import type { Role } from "@/lib/nav"
import { cookies } from "next/headers"

export type CurrentUser = {
	id: string
	displayName: string
	role: Role
	avatarUrl?: string | null
}

/**
 * Resolves the authenticated session by reading the access token cookie
 * and fetching the user profile from the NestJS API.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
	try {
		const cookieStore = await cookies()
		const token = cookieStore.get("pv_access_token")?.value
		if (!token) return null

		const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"
		const res = await fetch(`${API}/auth/me`, {
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			next: { revalidate: 0 }, // Disable Next.js caching for this request
		})

		if (!res.ok) {
			return null
		}

		const user = await res.json()
		return {
			id: user.id,
			displayName: user.displayName,
			role: user.role as Role,
			avatarUrl: user.avatarUrl ?? null,
		}
	} catch (error: any) {
		if (error?.digest === "DYNAMIC_SERVER_USAGE" || error?.message?.includes("Dynamic server usage")) {
			throw error
		}
		console.error("[getCurrentUser] Failed to fetch session:", error)
		return null
	}
}
