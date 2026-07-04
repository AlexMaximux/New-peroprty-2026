import {
	Building2,
	LayoutDashboard,
	MessageSquare,
	Shield,
	Store,
	type LucideIcon,
} from "lucide-react"

// Defined locally because @propvest/shared does not export `Role`.
// If/when it does, swap this for `import type { Role } from "@propvest/shared"`.
export type Role = "ADMIN" | "USER" | "AGENCY"

export type NavItem = {
	label: string
	href: string
	icon: LucideIcon
	/** Roles allowed to see this item. Omitted = visible to every authenticated user. */
	roles?: Role[]
	/** Live badge source rendered next to the item (e.g. unread message count). */
	badge?: "messages"
}

// Order matches the sidebar in the Marketplace design.
export const NAV_ITEMS: NavItem[] = [
	{ label: "Marketplace", href: "/browse", icon: Store },
	{ label: "R2R Marketplace", href: "/r2r-marketplace", icon: Store },
	{ label: "Investor Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["USER"] },
	{ label: "Agency Portal", href: "/agency", icon: Building2, roles: ["AGENCY"] },
	{ label: "Admin Panel", href: "/admin", icon: Shield, roles: ["ADMIN"] },
	{ label: "Messages", href: "/messages", icon: MessageSquare, badge: "messages" },
]

/**
 * Every authenticated user sees Marketplace + Messages, plus exactly the one
 * role-specific destination (Investor Dashboard / Agency Portal / Admin Panel).
 */
export function navItemsForRole(role: Role): NavItem[] {
	return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))
}

/** Best-effort page title for the top bar, derived from the current pathname. */
export function titleForPath(pathname: string): string {
	const match = NAV_ITEMS.find(
		(item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
	)
	return match?.label ?? "PropVest"
}
