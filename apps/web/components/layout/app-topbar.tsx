"use client"

import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { titleForPath } from "@/lib/nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSidebar } from "@/components/layout/sidebar-provider"

type Props = {
	user: { displayName: string; avatarUrl?: string | null }
}

export function AppTopbar({ user }: Props) {
	const pathname = usePathname()
	const { toggleSidebar } = useSidebar()

	if (pathname === "/browse") return null

	return (
		<header className="flex h-14 shrink-0 items-center justify-between border-b bg-[var(--bg-secondary)] border-[var(--border)] px-4 md:px-6">
			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={toggleSidebar}
					aria-label="Toggle sidebar"
					className="md:hidden text-muted-foreground hover:text-foreground"
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
				</button>
				<h1 className="text-sm font-medium text-muted-foreground">
					{titleForPath(pathname)}
				</h1>
			</div>
			<div className="flex items-center gap-4">
				<button
					type="button"
					aria-label="Notifications"
					className="relative text-muted-foreground hover:text-foreground"
				>
					<Bell className="size-5" />
					<span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-destructive" />
				</button>
				<Avatar className="size-8">
					{user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
					<AvatarFallback>
						{user.displayName.slice(0, 1).toUpperCase()}
					</AvatarFallback>
				</Avatar>
			</div>
		</header>
	)
}
