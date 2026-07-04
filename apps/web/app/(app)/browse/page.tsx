import type { Metadata } from "next"
import { MarketplaceView } from "@/components/marketplace/marketplace-view"

export const metadata: Metadata = {
	title: "Marketplace — PropVest",
	description:
		"Discover Below Market Value investment properties sourced by verified agencies.",
}

// Marketplace is the shared landing for every authenticated role.
// Data fetching + interactivity live in the client MarketplaceView.
export default function BrowsePage() {
	return <MarketplaceView />
}
