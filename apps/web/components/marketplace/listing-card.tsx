"use client"

import * as React from "react"
import Link from "next/link"
import {
  MapPin, Building2, Bed, Bath, Maximize2, CheckCircle2, Heart,
} from "lucide-react"
import type { ListingSearchResult } from "@/lib/api"
import { useFavourites, useToggleFavourite } from "@/hooks/queries/use-favourites"

interface ListingCardProps {
  listing: ListingSearchResult
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(pence: number | null | undefined): string {
  if (pence == null || pence === 0) return "—"
  const pounds = pence / 100
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(1)}M`
  if (pounds >= 100_000) return `£${(pounds / 1_000).toFixed(0)}k`
  return `£${Math.round(pounds).toLocaleString()}`
}

function formatPriceSigned(pence: number | null | undefined): string {
  if (pence == null || pence === 0) return "—"
  const isNegative = pence < 0
  const absPence = Math.abs(pence)
  const formatted = formatPrice(absPence)
  return isNegative ? `-${formatted}` : formatted
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—"
  return `${Number(value).toFixed(1)}%`
}

function getStrategyLabel(strategy: string | null): string {
  switch (strategy) {
    case "HMO": return "HMO"
    case "SA": return "SA"
    case "SINGLE_LET": return "Single Let"
    case "BLOCK_OF_PROPERTY": return "Block"
    case "COMMERCIAL":
    case "HOTEL":
    case "SHOP":
    case "MIXED_USE":
      return "Commercial"
    case "BMV": return "BMV"
    case "HIGH_ROI": return "High ROI"
    default: return strategy ?? "Property"
  }
}

function getCategoryLabel(category: string | null | undefined): string {
  if (!category) return "Rent to Rent"
  if (category === "RENT_TO_RENT") return "Rent to Rent"
  if (category === "LEASE_OPTION") return "Lease Option"
  if (category === "SELL_PROPERTY") return "Sell Property"
  return category
    .replace(/_/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/** Check if agency is verified (APPROVED status) */
function isAgencyVerified(verificationStatus: string | undefined): boolean {
  return verificationStatus === "APPROVED"
}

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80"

// ── Component ────────────────────────────────────────────────────────────────

export function ListingCard({ listing }: ListingCardProps) {
  const { data: favourites } = useFavourites()
  const toggleFavourite = useToggleFavourite()

  const isFavourite = favourites?.some((fav) => fav.listingId === listing.id)

  const imageUrl = listing.media.length > 0
    ? (listing.media[0]?.url ?? PLACEHOLDER_IMAGE)
    : PLACEHOLDER_IMAGE

  // Financial metrics from API data
  const monthlyRentPence = listing.hmoRooms.length > 0
    ? listing.hmoRooms.reduce((sum, r) => sum + r.monthlyRentPence, 0)
    : listing.strategySpecificData?.rentToLandlordPence as number | undefined ?? null

  const roi = listing.estimatedRoi

  // Gross yield: derive from monthly rent vs asking price
  let grossYield = roi
  if (monthlyRentPence && listing.askingPricePence && listing.askingPricePence > 0) {
    grossYield = (monthlyRentPence * 12) / listing.askingPricePence * 100
  }

  // Net yield (typically ~80% of gross)
  const netYield = grossYield != null ? grossYield * 0.8 : null

  // Extracting HMO-specific data
  const spec = (listing.strategySpecificData ?? {}) as Record<string, any>
  const furnishing = spec.furnished as boolean | undefined ?? listing.furnishedStatus === "FURNISHED"
  const managementInPlace = spec.managementAvailable as boolean | undefined
  const referenceReq = spec.referenceRequirement as string | undefined
  const isTenanted = listing.isTenanted ?? (spec.isTenanted as boolean | undefined)
  const finderFeePence = spec.finderFeePence as number | undefined ?? null

  // P.G Income (Potential Gross Income)
  const pgIncomePence = spec.potentialIncomePence as number | undefined ??
    (monthlyRentPence ? monthlyRentPence * 12 * 1.1 : null)

  // Net Profit: PG income minus sourcing fee (simplified)
  const netProfitPence = pgIncomePence && finderFeePence
    ? pgIncomePence - finderFeePence
    : pgIncomePence

  const isR2RHmo = listing.strategy === "HMO" && listing.category === "RENT_TO_RENT"

  // HMO Rent to Rent Specific calculations
  let moneyNeeded = 0
  let monthlyGrossProfit = 0
  let profitY1SelfManage = 0
  let roiY1SelfManage = 0
  let profitY1Managed = 0
  let roiY1Managed = 0
  let profitY2SelfManage = 0
  let roiY2SelfManage = 0
  let profitY2Managed = 0
  let roiY2Managed = 0

  if (isR2RHmo) {
    const totalRoomIncome = listing.hmoRooms?.reduce((sum, r) => sum + r.monthlyRentPence, 0) ?? 0
    const rentToLandlordPence = (spec.rentToLandlordPence as number | undefined) ?? (spec.rentToLandlord as number | undefined) ?? 0
    const depositPence = (spec.depositPence as number | undefined) ?? (spec.deposit as number | undefined) ?? 0
    const r2rFinderFeePence = (spec.finderFeePence as number | undefined) ?? (spec.finderFee as number | undefined) ?? 0
    const refurbCostPence = (listing.refurbCostPence as number | null | undefined) ?? (spec.refurbCostPence as number | undefined) ?? (spec.refurbCost as number | undefined) ?? 0
    const billsPence = (spec.billsPence as number | undefined) ?? (spec.billsTotalPence as number | undefined) ?? (spec.bills as number | undefined) ?? 0
    const managementRatePercent = (spec.managementRatePercent as number | undefined) ?? (spec.managementFeePercent as number | undefined) ?? 0
    const managementEnabled = (spec.managementEnabled as boolean | undefined) ?? (spec.managementAvailable as boolean | undefined) ?? false

    moneyNeeded = rentToLandlordPence + depositPence + r2rFinderFeePence + refurbCostPence
    monthlyGrossProfit = totalRoomIncome - rentToLandlordPence

    const monthlyMaintenance = managementEnabled
      ? Math.round(totalRoomIncome * (managementRatePercent / 100))
      : 0
    const finalManagementFee = Math.round(totalRoomIncome * 0.1)

    const runningCostSelfManageY1 = rentToLandlordPence + billsPence + Math.round(r2rFinderFeePence / 12) + monthlyMaintenance
    const runningCostManagedY1 = runningCostSelfManageY1 + finalManagementFee
    const runningCostSelfManageY2 = rentToLandlordPence + billsPence + monthlyMaintenance
    const runningCostManagedY2 = runningCostSelfManageY2 + finalManagementFee

    profitY1SelfManage = (totalRoomIncome - runningCostSelfManageY1) * 12
    roiY1SelfManage = moneyNeeded > 0 ? (profitY1SelfManage / moneyNeeded) * 100 : 0
    profitY1Managed = (totalRoomIncome - runningCostManagedY1) * 12
    roiY1Managed = moneyNeeded > 0 ? (profitY1Managed / moneyNeeded) * 100 : 0
    profitY2SelfManage = (totalRoomIncome - runningCostSelfManageY2) * 12
    roiY2SelfManage = moneyNeeded > 0 ? (profitY2SelfManage / moneyNeeded) * 100 : 0
    profitY2Managed = (totalRoomIncome - runningCostManagedY2) * 12
    roiY2Managed = moneyNeeded > 0 ? (profitY2Managed / moneyNeeded) * 100 : 0
  }

  const displayRoi = isR2RHmo ? roiY2SelfManage : roi
  const strategyLabel = getStrategyLabel(listing.strategy)
  const agencyName = listing.agencyProfile?.companyName ?? "Verified Agency"
  const isVerified = isAgencyVerified(listing.agencyProfile?.verificationStatus)

  // Status logic
  const isReserved = listing.status === "RESERVED"
  const isSold = listing.status === "SOLD"

  // Location display: "Manual Address, NN6" or fallback to "Region, NN6"
  const locationDisplay = (() => {
    const postcodeArea = listing.postcode ? listing.postcode.split(" ")[0] : ""
    const manualAddress = spec.manualAddress as string | undefined

    if (manualAddress) {
      return `${manualAddress}, ${postcodeArea}`
    }

    return `${listing.region || ""}, ${postcodeArea}`.replace(/^, /, "")
  })()

  return (
    <article className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-500 ease-out hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-1 bg-[var(--bg-card)] border border-[var(--border)]">
      {/* ── Image Header ─────────────────────────────────────────── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--bg-secondary)]">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
          loading="lazy"
        />

        {/* Image gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

        {/* Reserved / Sold overlay */}
        {(isReserved || isSold) && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-5 py-2 text-sm font-bold uppercase tracking-[0.2em] rounded-full bg-[#ff7675] text-white shadow-lg">
              {isReserved ? "Reserved" : "Sold"}
            </span>
          </div>
        )}

        {/* Strategy pill badge — top left */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-sm">
            {strategyLabel}
          </span>
        </div>

        {/* Strategy Category pill badge — top middle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] rounded-full bg-white/15 backdrop-blur-md text-white border border-white/30 shadow-md">
            {getCategoryLabel(listing.category)}
          </span>
        </div>

        {/* ROI badge — top right */}
        {displayRoi != null && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center px-3 py-1.5 text-[12px] font-mono font-bold tracking-tight rounded-full bg-[#003919]/80 backdrop-blur-md text-[#54e98a] border border-[#005027]/40">
              {formatPercent(displayRoi)} ROI
            </span>
          </div>
        )}

        {/* Favourite heart — bottom left */}
        <button
          onClick={(e) => {
            e.preventDefault()
            toggleFavourite.mutate({ listingId: listing.id, next: !isFavourite })
          }}
          disabled={toggleFavourite.isPending}
          className={`absolute bottom-3 left-3 z-10 w-8 h-8 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center transition-all ${
            isFavourite ? "bg-black/80 text-[#ff7675]" : "bg-black/40 text-white/70 hover:text-[#ff7675] hover:bg-black/60"
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavourite ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* ── Card Body ───────────────────────────────────────────── */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title & Location */}
        <div className="mb-3">
          <h3 className="font-semibold text-[15px] text-[var(--text-primary)] tracking-tight mb-1 line-clamp-1">
            {listing.title}
          </h3>
          <p className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
            <MapPin className="w-3 h-3 text-[var(--text-faint)] flex-shrink-0" />
            <span className="truncate">
              {locationDisplay}
            </span>
          </p>
        </div>

        {/* Quick specs pills */}
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-3">
          {listing.bedrooms != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)]">
              <Bed className="w-3 h-3" />
              {listing.bedrooms}
            </span>
          )}
          {listing.bathrooms != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)]">
              <Bath className="w-3 h-3" />
              {listing.bathrooms}
            </span>
          )}
          {listing.floorArea != null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)]">
              <Maximize2 className="w-3 h-3" />
              {listing.floorArea} ft²
            </span>
          )}
        </div>

        {/* Rent-to-Rent HMO Price & Profit Row */}
        {isR2RHmo && (
          <div className="flex justify-between items-start mb-3.5 mt-1 pt-1">
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-white/70 uppercase tracking-wider font-extrabold mb-0.5">Rent</span>
              <span className="font-mono text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                {formatPrice(monthlyRentPence)}
                <span className="text-xs text-[var(--text-muted)] font-normal ml-0.5">/mo</span>
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-white/70 uppercase tracking-wider font-extrabold mb-0.5">Potential Profit</span>
              <span className="font-mono text-xl font-extrabold text-[#54e98a] tracking-tight">
                {formatPriceSigned(profitY2SelfManage)}/yr
              </span>
            </div>
          </div>
        )}

        {/* ── Financial Metrics Table / Projections ──────────────────────────── */}
        {isR2RHmo ? (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--bg-secondary)]/50 divide-x divide-[var(--border)]/50 flex flex-row w-full text-center backdrop-blur-sm bg-gradient-to-br from-[var(--bg-secondary)]/60 to-[var(--bg-card)]/30">
            <div className="py-2.5 px-1 flex-1 min-w-0">
              <p className="text-[8px] font-extrabold text-[var(--text-faint)] uppercase tracking-wider truncate">Money In</p>
              <p className="font-mono text-[11px] font-bold text-[var(--text-primary)] tracking-tight mt-0.5 truncate">
                {formatPrice(moneyNeeded)}
              </p>
            </div>
            <div className="py-2.5 px-1 flex-1 min-w-0">
              <p className="text-[8px] font-extrabold text-[var(--text-faint)] uppercase tracking-wider truncate">Gross Profit</p>
              <p className="font-mono text-[11px] font-bold text-[#54e98a] tracking-tight mt-0.5 truncate">
                {formatPrice(monthlyGrossProfit)}/m
              </p>
            </div>
            <div className="py-2.5 px-1 flex-1 min-w-0">
              <p className="text-[8px] font-extrabold text-[var(--text-faint)] uppercase tracking-wider truncate">Y1 Self</p>
              <p className="font-mono text-[11px] font-bold text-[#54e98a] tracking-tight mt-0.5 truncate">
                {formatPriceSigned(profitY1SelfManage)}/yr
              </p>
              <p className="text-[8px] text-[var(--text-faint)] mt-0.5 truncate">
                ROI: <span className="font-bold text-[var(--text-primary)]">{roiY1SelfManage.toFixed(1)}%</span>
              </p>
            </div>
            <div className="py-2.5 px-1 flex-1 min-w-0">
              <p className="text-[8px] font-extrabold text-[var(--text-faint)] uppercase tracking-wider truncate">Y1 Managed</p>
              <p className="font-mono text-[11px] font-bold text-[#54e98a] tracking-tight mt-0.5 truncate">
                {formatPriceSigned(profitY1Managed)}/yr
              </p>
              <p className="text-[8px] text-[var(--text-faint)] mt-0.5 truncate">
                ROI: <span className="font-bold text-[var(--text-primary)]">{roiY1Managed.toFixed(1)}%</span>
              </p>
            </div>
            <div className="py-2.5 px-1 flex-1 min-w-0">
              <p className="text-[8px] font-extrabold text-[var(--text-faint)] uppercase tracking-wider truncate">Y2 Managed</p>
              <p className="font-mono text-[11px] font-bold text-[#54e98a] tracking-tight mt-0.5 truncate">
                {formatPriceSigned(profitY2Managed)}/yr
              </p>
              <p className="text-[8px] text-[var(--text-faint)] mt-0.5 truncate">
                ROI: <span className="font-bold text-[var(--text-primary)]">{roiY2Managed.toFixed(1)}%</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--bg-secondary)]/50">
            <table className="w-full border-collapse">
              <tbody>
                {/* Row 1: Monthly Rent | Net Profit | Gross Yield */}
                <tr className="border-b border-[var(--border)]">
                  <td className="py-2.5 px-3">
                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--text-faint)] uppercase">Monthly Rent</p>
                    <p className="font-mono text-[15px] font-bold text-[var(--text-primary)] tracking-tight mt-0.5">
                      {monthlyRentPence ? formatPrice(monthlyRentPence) : "—"}
                    </p>
                  </td>
                  <td className="py-2.5 px-3 border-l border-[var(--border)]">
                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--text-faint)] uppercase">Net Profit</p>
                    <p className="font-mono text-[15px] font-bold text-[var(--accent)] tracking-tight mt-0.5">
                      {netProfitPence ? formatPrice(netProfitPence) : "—"}
                    </p>
                  </td>
                  <td className="py-2.5 px-3 border-l border-[var(--border)]">
                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--text-faint)] uppercase">Gross Yield</p>
                    <p className="font-mono text-[15px] font-bold text-[var(--accent)] tracking-tight mt-0.5">
                      {formatPercent(grossYield)}
                    </p>
                  </td>
                </tr>

                {/* Row 2: P.G Income | Sourcing Fee | Net Yield */}
                <tr>
                  <td className="py-2.5 px-3">
                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--text-faint)] uppercase">P.G Income</p>
                    <p className="font-mono text-[13px] font-semibold text-[var(--text-muted)] tracking-tight mt-0.5">
                      {pgIncomePence ? formatPrice(pgIncomePence) : "—"}
                    </p>
                  </td>
                  <td className="py-2.5 px-3 border-l border-[var(--border)]">
                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--text-faint)] uppercase">Sourcing Fee</p>
                    <p className="font-mono text-[13px] font-semibold text-[var(--text-muted)] tracking-tight mt-0.5">
                      {finderFeePence ? formatPrice(finderFeePence) : "—"}
                    </p>
                  </td>
                  <td className="py-2.5 px-3 border-l border-[var(--border)]">
                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--text-faint)] uppercase">Net Yield</p>
                    <p className="font-mono text-[13px] font-semibold text-[var(--text-muted)] tracking-tight mt-0.5">
                      {formatPercent(netYield)}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── HMO Property Tags ──────────────────────────────────── */}
        {listing.strategy === "HMO" && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {furnishing && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]">
                Furnished
              </span>
            )}
            {managementInPlace && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]">
                Management in Place
              </span>
            )}
            {isTenanted && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]">
                Already Tenanted
              </span>
            )}
            {referenceReq && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)]">
                {referenceReq} Reference
              </span>
            )}
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border)]">
          {/* Agency */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-sm flex-shrink-0">
              <Building2 className="w-3.5 h-3.5 text-[#003919]" />
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[12px] font-semibold text-[var(--text-primary)] truncate">
                {agencyName}
              </span>
              {isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4da6ff] flex-shrink-0" />
              )}
            </div>
          </div>

          {/* View Details CTA */}
          <Link
            href={`/listings/${listing.id}`}
            className="px-4 py-2 text-[11px] font-bold tracking-[0.08em] uppercase rounded-lg bg-[var(--accent)] text-[#003919] hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm hover:shadow-md"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}
