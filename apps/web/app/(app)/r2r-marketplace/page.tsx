import type { Metadata } from "next"
import { R2RMarketplaceView } from "@/components/marketplace/r2r-marketplace-view"

export const metadata: Metadata = {
	title: "R2R Marketplace — PropVest",
	description: "Discover Rent-to-Rent investment deals sourced by verified agencies.",
}

export default function R2RMarketplacePage() {
	return <R2RMarketplaceView />
}
