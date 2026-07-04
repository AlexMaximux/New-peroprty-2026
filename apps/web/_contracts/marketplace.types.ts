// Types mirrored EXACTLY from your apps/web/lib/api.ts (searchListings).
// Kept local so the components compile with zero external-export assumptions.
// If lib/api.ts (or @propvest/shared) already exports these, you can delete this
// file and import from there instead — the shapes are identical.
//
// Money is integer PENCE (CLAUDE.md §7).

export interface ListingMedia {
	id: string
	kind: string // "PHOTO" | "VIDEO"
	fileKey: string
	order: number
	url?: string | null
}

export interface HmoRoom {
	id: string
	name: string
	roomType: string
	monthlyRentPence: number
}

export interface PortfolioAsset {
	id: string
	name: string
	valuePence: number | null
}

export interface ListingAgencyProfile {
	companyName: string
	contactName: string
	user: { displayName: string }
}

export interface ListingSearchResult {
	id: string
	title: string
	description: string | null
	category: string
	strategy: string | null
	status: string
	propertyType: string | null
	addressLine1: string
	postcode: string
	city: string
	region: string | null
	bedrooms: number | null
	bathrooms: number | null
	floorArea: number | null
	askingPricePence: number | null
	marketValuePence: number | null
	estimatedRoi: number | null
	isLicensed: boolean | null
	needsRefurb: boolean | null
	isVacant: boolean | null
	isTenanted: boolean | null
	hasGarden: boolean | null
	parking: string | null
	furnishedStatus: string | null
	strategySpecificData: Record<string, unknown> | null
	refurbCostPence: number | null
	publishedAt: string | null
	createdAt: string
	media: ListingMedia[]
	hmoRooms: HmoRoom[]
	portfolioAssets: PortfolioAsset[]
	agencyProfile: ListingAgencyProfile | null
	_count: { favourites: number }
}

export interface SearchMeta {
	total: number
	page: number
	limit: number
	totalPages: number
}

export interface SearchResponse {
	data: ListingSearchResult[]
	meta: SearchMeta
}

export interface SearchFilters {
	category?: string
	strategy?: string
	propertyType?: string
	postcode?: string
	region?: string
	priceMin?: number
	priceMax?: number
	roiMin?: number
	roiMax?: number
	needsRefurb?: boolean
	excludeSold?: boolean
	excludeReserved?: boolean
	page?: number
	limit?: number
	sortBy?: string
	sortOrder?: string
}
