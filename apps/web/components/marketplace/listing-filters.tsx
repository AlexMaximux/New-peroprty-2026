"use client"

import { cn } from "@/lib/utils"
import type { SearchFilters } from "@/_contracts/marketplace.types"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

type Props = {
	filters: SearchFilters
	onChange: (next: SearchFilters) => void
}

// ⚠⚠ IMPORTANT: these `value` strings are GUESSES based on CLAUDE.md.
// Replace each value with your real Prisma enum string for `category` / `strategy`
// (the labels can stay). Wrong values just mean a chip won't filter — it still compiles.
type ChipDef = { label: string; field: "category" | "strategy"; value: string }
const FILTER_CHIPS: ChipDef[] = [
	{ label: "HMO", field: "strategy", value: "HMO" },
	{ label: "Serviced Accom (SA)", field: "strategy", value: "SA" },
	{ label: "High ROI", field: "strategy", value: "HIGH_ROI" },
	{ label: "Single Let", field: "strategy", value: "SINGLE_LET" },
	{ label: "Commercial", field: "category", value: "COMMERCIAL" },
	{ label: "Portfolio", field: "category", value: "PORTFOLIO" },
	{ label: "Refurb", field: "category", value: "REFURB_OPPORTUNITY" },
	{ label: "Development", field: "category", value: "DEVELOPMENT_OPPORTUNITY" },
	{ label: "Lease Option", field: "category", value: "LEASE_OPTION" },
	{ label: "Rent to Rent", field: "category", value: "RENT_TO_RENT" },
]

export function ListingFilters({ filters, onChange }: Props) {
	function toggleChip(chip: ChipDef) {
		const isActive = filters[chip.field] === chip.value
		onChange({ ...filters, [chip.field]: isActive ? undefined : chip.value, page: 1 })
	}

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap gap-2">
				{FILTER_CHIPS.map((chip) => {
					const active = filters[chip.field] === chip.value
					return (
						<button
							key={`${chip.field}:${chip.value}`}
							type="button"
							onClick={() => toggleChip(chip)}
							aria-pressed={active}
							className={cn(
								"rounded-full border px-3 py-1 text-sm transition-colors",
								active
									? "border-primary bg-primary text-primary-foreground"
								: "border-input bg-background hover:bg-accent",
							)}
						>
							{chip.label}
						</button>
					)
				})}
			</div>

			<div className="flex flex-wrap items-center gap-6">
				<div className="flex items-center gap-2">
					<Switch
						id="excludeSold"
						checked={filters.excludeSold ?? false}
						onCheckedChange={(checked) =>
							onChange({ ...filters, excludeSold: checked, page: 1 })
						}
					/>
					<Label htmlFor="excludeSold">Excl. Sold</Label>
				</div>
				<div className="flex items-center gap-2">
					<Switch
						id="excludeReserved"
						checked={filters.excludeReserved ?? false}
						onCheckedChange={(checked) =>
							onChange({ ...filters, excludeReserved: checked, page: 1 })
						}
					/>
					<Label htmlFor="excludeReserved">Excl. Reserved</Label>
				</div>
				<div className="flex items-center gap-2">
					<Switch
						id="needsRefurb"
						checked={filters.needsRefurb ?? false}
						onCheckedChange={(checked) =>
							onChange({ ...filters, needsRefurb: checked || undefined, page: 1 })
						}
					/>
					<Label htmlFor="needsRefurb">Refurb only</Label>
				</div>
			</div>
		</div>
	)
}
