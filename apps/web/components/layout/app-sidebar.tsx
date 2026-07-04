"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"
import { useTheme as useNextTheme } from "next-themes"
import { LogOut, Settings, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { navItemsForRole, type Role } from "@/lib/nav"
import { useUnreadCount } from "@/hooks/queries/use-unread-count"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSidebar } from "@/components/layout/sidebar-provider"

type Props = {
	user: { displayName: string; role: Role; avatarUrl?: string | null }
}

export function AppSidebar({ user }: Props) {
	const pathname = usePathname()
	const { theme, setTheme } = useNextTheme()
	const items = navItemsForRole(user.role)
	const { data: unread } = useUnreadCount()
	const unreadCount = unread?.count ?? 0
	const { openMobile, setOpenMobile } = useSidebar()

	// Handle mounting state to avoid hydration mismatch
	const [mounted, setMounted] = React.useState(false)
	React.useEffect(() => {
		setMounted(true)
	}, [])

	return (
		<>
			{/* Mobile Overlay */}
			{openMobile && (
				<div
					className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
					onClick={() => setOpenMobile(false)}
					aria-hidden="true"
				/>
			)}
			
			<aside 
				className={cn(
					"flex h-svh w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-ui select-none",
					"fixed inset-y-0 left-0 z-50 md:relative",
					"transition-transform duration-300 ease-in-out",
					openMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
				)}
			>
			{/* Brand */}
			<div className="flex flex-col gap-1 px-6 py-6 border-b border-[var(--border)]">
				<h1 className="text-lg font-bold tracking-wider text-[var(--text-primary)]">
					PropVault
				</h1>
				<p className="text-[10px] font-semibold tracking-widest text-[var(--text-muted)] uppercase">
					Investment Platform
				</p>
			</div>

			{/* Primary nav — role-aware */}
			<nav className="flex-1 space-y-1.5 px-3 py-4">
				{items.map((item) => {
					const Icon = item.icon
					const active =
						pathname === item.href || pathname.startsWith(`${item.href}/`)
					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={() => setOpenMobile(false)}
							aria-current={active ? "page" : undefined}
							className={cn(
								"flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm font-medium transition-all duration-200",
								active
									? "bg-[var(--secondary-container)] text-white font-semibold"
									: "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]",
							)}
						>
							<Icon className="size-4 shrink-0" />
							<span className="flex-1">{item.label}</span>
							{item.badge === "messages" && unreadCount > 0 && (
								<span className="flex size-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg-primary)] text-[11px] font-bold font-mono">
									{unreadCount}
								</span>
							)}
						</Link>
					)
				})}
			</nav>

			{/* Footer */}
			<div className="space-y-1 border-t border-[var(--border)] px-3 py-4">
				{mounted && (
					<button
						type="button"
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						className="flex w-full items-center gap-3 rounded-[4px] px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
					>
						{theme === "dark" ? (
							<>
								<Sun className="size-4" />
								<span>Light Mode</span>
							</>
						) : (
							<>
								<Moon className="size-4" />
								<span>Dark Mode</span>
							</>
						)}
					</button>
				)}
				<Link
					href="/settings"
					className="flex items-center gap-3 rounded-[4px] px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors"
				>
					<Settings className="size-4" />
					Settings
				</Link>
				<div className="flex items-center gap-3 rounded-[4px] px-3 py-2.5 mt-2 border-t border-[var(--border)]/50 pt-3">
					<Avatar className="size-8 rounded-full border border-[var(--border)]">
						{user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
						<AvatarFallback className="bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-xs font-bold">
							{initials(user.displayName)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1 leading-tight">
						<p className="truncate text-xs font-semibold text-[var(--text-primary)]">{user.displayName}</p>
						<p className="truncate text-[10px] font-medium uppercase text-[var(--text-muted)] mt-0.5">
							{user.role === "USER" ? "Investor" : user.role.toLowerCase()}
						</p>
					</div>
					<button
						type="button"
						onClick={async () => {
							try {
								const token = localStorage.getItem("pv_refresh_token")
								const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"
								if (token) {
									await fetch(`${API}/auth/logout`, {
										method: "POST",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({ refreshToken: token }),
									}).catch(() => {})
								}
							} finally {
								localStorage.removeItem("pv_access_token")
								localStorage.removeItem("pv_refresh_token")
								document.cookie = "pv_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
								window.location.href = "/login"
							}
						}}
						aria-label="Log out"
						className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors cursor-pointer"
					>
						<LogOut className="size-4" />
					</button>
				</div>
			</div>
		</aside>
		</>
	)
}

function initials(name: string): string {
	return name
		.split(" ")
		.map((p) => p[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase()
}
