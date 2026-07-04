import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { QueryProvider } from "@/components/providers/query-provider"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopbar } from "@/components/layout/app-topbar"

/**
 * Authenticated shell. Everything under (app) requires a session, so unauthenticated
 * visitors are redirected to /login. The sidebar nav is role-aware (see lib/nav.ts):
 * all users get Marketplace + Messages, plus the single destination for their role.
 */
export default async function AppLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const user = await getCurrentUser()
	if (!user) redirect("/login?clear=1")

	return (
		<QueryProvider>
			<div className="flex h-svh overflow-hidden bg-background">
				<AppSidebar user={user} />
				<div className="flex min-w-0 flex-1 flex-col">
					<AppTopbar user={user} />
					<main className="flex-1 overflow-y-auto">{children}</main>
				</div>
			</div>
		</QueryProvider>
	)
}
