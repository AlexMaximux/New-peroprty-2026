// Display formatters. All money is integer PENCE per CLAUDE.md §7 — format only here.

const gbp0 = new Intl.NumberFormat("en-GB", {
	style: "currency",
	currency: "GBP",
	maximumFractionDigits: 0,
})

/** Compact GBP from pence, e.g. 19_500_000 -> "£195k". Returns "—" for null. */
export function formatPenceCompact(pence: number | null | undefined): string {
	if (pence == null) return "—"
	const pounds = pence / 100
	if (Math.abs(pounds) >= 1000) {
		const k = pounds / 1000
		const rounded = Math.round(k * 10) / 10
		const label = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)
		return `£${label}k`
	}
	return gbp0.format(pounds)
}

/** Full GBP from pence, e.g. 19_500_000 -> "£195,000". */
export function formatPence(pence: number | null | undefined): string {
	if (pence == null) return "—"
	return gbp0.format(pence / 100)
}

/** Percentage, e.g. 9.1 -> "9.1%"; null -> "N/A". Used for ROI. */
export function formatPercent(value: number | null | undefined): string {
	if (value == null) return "N/A"
	return `${value.toFixed(1)}%`
}

/** Turn an enum-ish string into a label, e.g. "REFURB_OPPORTUNITY" -> "Refurb Opportunity". */
export function prettifyEnum(value: string | null | undefined): string {
	if (!value) return ""
	return value
		.toLowerCase()
		.split(/[_\s]+/)
		.map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
		.join(" ")
}
