"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Star, MapPin, Calculator, ChevronDown, ChevronUp, 
  MessageSquare, ShieldCheck, ArrowRight,
  Train, GraduationCap, Hospital, ShoppingBag, CheckCircle2
} from "lucide-react"
import { type ListingSearchResult, startConversation, sendMessage } from "@/lib/api"
import { useFavourites, useToggleFavourite } from "@/hooks/queries/use-favourites"

interface R2RListingCardProps {
  listing: ListingSearchResult
}

export function R2RListingCard({ listing }: R2RListingCardProps) {
  const router = useRouter()
  const [isAccordionOpen, setIsAccordionOpen] = React.useState(false)
  const [isMessaging, setIsMessaging] = React.useState(false)

  // Favorites
  const { data: favourites } = useFavourites()
  const toggleFavourite = useToggleFavourite()
  const isFavourite = favourites?.some((fav) => fav.listingId === listing.id)

  const formatPrice = (pence?: number | null) => {
    if (pence === undefined || pence === null) return "£--"
    const pounds = pence / 100
    return `£${pounds.toLocaleString()}`
  }

  const formatWholePrice = (pence?: number | null) => {
    if (pence === undefined || pence === null) return "£--"
    return `£${(pence / 100).toLocaleString()}`
  }

  const handleToggleStar = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavourite.mutate({ listingId: listing.id, next: !isFavourite })
  }

  const handleMessageAgent = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      setIsMessaging(true)
      const conv = await startConversation(listing.id)
      
      // Auto-send initial context message if conversation is new
      if (conv._count?.messages === 0 || !conv._count) {
        const initialMessage = `Hi, I am interested in your Rent to Rent listing: ${listing.title} (${listing.postcode}).\n\nIs this deal still available?`
        await sendMessage(conv.id, initialMessage)
      }
      
      router.push(`/messages?conversationId=${conv.id}`)
    } catch (err) {
      console.error("Failed to message agent:", err)
    } finally {
      setIsMessaging(false)
    }
  }

  const strategyData = (listing.strategySpecificData || {}) as Record<string, any>
  const rentToLandlordPence = (strategyData.rentToLandlordPence as number | undefined) ?? (strategyData.rentToLandlord as number | undefined) ?? 0
  const depositPence = (strategyData.depositPence as number | undefined) ?? (strategyData.deposit as number | undefined) ?? 0
  const finderFeePence = (strategyData.finderFeePence as number | undefined) ?? (strategyData.finderFee as number | undefined) ?? 0
  const refurbCostPence = (listing.refurbCostPence as number | null | undefined) ?? (strategyData.refurbCostPence as number | undefined) ?? (strategyData.refurbCost as number | undefined) ?? 0
  const billsPence = (strategyData.billsPence as number | undefined) ?? (strategyData.billsTotalPence as number | undefined) ?? (strategyData.bills as number | undefined) ?? 0
  const managementRatePercent = (strategyData.managementRatePercent as number | undefined) ?? (strategyData.managementFeePercent as number | undefined) ?? 0
  const managementEnabled = (strategyData.managementEnabled as boolean | undefined) ?? (strategyData.managementAvailable as boolean | undefined) ?? false

  const totalRoomIncome = listing.hmoRooms?.reduce((sum, r) => sum + r.monthlyRentPence, 0) ?? 0
  const monthlyGrossProfit = totalRoomIncome - rentToLandlordPence
  const moneyNeeded = rentToLandlordPence + depositPence + finderFeePence + refurbCostPence

  const roomGroups = React.useMemo(() => {
    if (!listing.hmoRooms) return []
    const map = new Map<string, { count: number; name: string; rent: number }>()
    listing.hmoRooms.forEach(r => {
      const roomType = r.roomType
      
      // Parse room and bathroom info from roomType
      let typeStr = "Room"
      let bathStr = "Standard"
      
      if (roomType === "DOUBLE_EN_SUITE") {
        typeStr = "Double En-Suite"
        bathStr = "En-Suite"
      } else if (roomType === "SINGLE_EN_SUITE") {
        typeStr = "Single En-Suite"
        bathStr = "En-Suite"
      } else if (roomType === "DOUBLE_SHARED_BATHROOM") {
        typeStr = "Double Bed"
        bathStr = "Shared Bathroom"
      } else if (roomType === "SINGLE_SHARED_BATHROOM") {
        typeStr = "Single Bed"
        bathStr = "Shared Bathroom"
      } else if (roomType === "DOUBLE") {
        typeStr = "Double Bed"
        bathStr = "Standard"
      } else if (roomType === "SINGLE") {
        typeStr = "Single Bed"
        bathStr = "Standard"
      }
      
      const key = `${typeStr} ${bathStr}-${r.monthlyRentPence}`
      const name = `${typeStr} ${bathStr}`
      if (!map.has(key)) map.set(key, { count: 0, name, rent: r.monthlyRentPence })
      map.get(key)!.count++
    })
    return Array.from(map.values())
  }, [listing.hmoRooms])

  // Calculations mirroring listing-card.tsx
  const monthlyMaintenance = managementEnabled ? Math.round(totalRoomIncome * (managementRatePercent / 100)) : 0
  const finalManagementFee = Math.round(totalRoomIncome * 0.1)

  const runningCostSelfManageY1 = rentToLandlordPence + billsPence + Math.round(finderFeePence / 12) + monthlyMaintenance
  const runningCostManagedY1 = runningCostSelfManageY1 + finalManagementFee

  const runningCostSelfManageY2 = rentToLandlordPence + billsPence + monthlyMaintenance
  const runningCostManagedY2 = runningCostSelfManageY2 + finalManagementFee

  const profitY1SelfManage = (totalRoomIncome - runningCostSelfManageY1) * 12
  const roiY1SelfManage = moneyNeeded > 0 ? (profitY1SelfManage / moneyNeeded) * 100 : 0

  const profitY1Managed = (totalRoomIncome - runningCostManagedY1) * 12
  const roiY1Managed = moneyNeeded > 0 ? (profitY1Managed / moneyNeeded) * 100 : 0

  const profitY2SelfManage = (totalRoomIncome - runningCostSelfManageY2) * 12
  const roiY2SelfManage = moneyNeeded > 0 ? (profitY2SelfManage / moneyNeeded) * 100 : 0

  const profitY2Managed = (totalRoomIncome - runningCostManagedY2) * 12
  const roiY2Managed = moneyNeeded > 0 ? (profitY2Managed / moneyNeeded) * 100 : 0

  const imageUrl = listing.media?.[0]?.url || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"
  
  const agencyName = listing.agencyProfile?.companyName ?? "Verified Agency"
  const isVerified = listing.agencyProfile?.verificationStatus === "VERIFIED"

  // Location display: "Manual Address, NN6" or fallback to "City, NN6"
  const locationDisplay = (() => {
    const postcodeArea = listing.postcode ? listing.postcode.split(" ")[0] : ""
    const manualAddress = (listing as any).manualAddress || strategyData?.manualAddress
    
    if (manualAddress) {
      return `${manualAddress}, ${postcodeArea}`
    }
    
    return `${listing.city || ""}, ${postcodeArea}`.replace(/^, /, "")
  })()

  return (
    <article className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col hover:border-[var(--outline)] transition-colors group h-full">
      
      {/* ── Image Header ─────────────────────────────────────────── */}
      <div className="relative h-48 w-full bg-[var(--bg-secondary)] overflow-hidden">
        <img
          src={imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-[var(--accent)] text-white font-label-xs text-label-xs px-2 py-1 rounded">R2R</span>
          <span className="bg-black/60 text-white font-label-xs text-label-xs px-2 py-1 rounded">
            {listing.propertyType?.toLowerCase() === 'other' ? 'HMO' : (listing.propertyType || 'HMO')}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          {listing.status === "RESERVED" && (
            <span className="bg-[var(--warning-review)] text-white font-label-xs text-label-xs px-2 py-1 rounded uppercase tracking-wider">RESERVED</span>
          )}
          <button 
            onClick={handleToggleStar}
            disabled={toggleFavourite.isPending}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm ${
              isFavourite ? 'bg-[var(--accent)]/90 text-white' : 'bg-black/40 text-white/80 hover:bg-black/60'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavourite ? 'fill-current' : ''}`} />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
          {(listing.isLicensed || strategyData.statusLicensed) && (
            <span className="bg-black/60 text-white font-medium text-[9px] tracking-wide px-1.5 py-0.5 rounded-full border border-white/20 backdrop-blur-sm flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400"/> Licensed
            </span>
          )}
          {(listing.isTenanted || strategyData.statusTenanted) && (
            <span className="bg-black/60 text-white font-medium text-[9px] tracking-wide px-1.5 py-0.5 rounded-full border border-white/20 backdrop-blur-sm flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-blue-400"/> Tenanted
            </span>
          )}
          {(strategyData.happyToCoSource || strategyData.coSourceAccepted || strategyData.coSourcing || strategyData.coSourcingAccepted || strategyData.coSource) && (
            <span className="bg-black/60 text-white font-medium text-[9px] tracking-wide px-1.5 py-0.5 rounded-full border border-white/20 backdrop-blur-sm flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-yellow-400"/> Co-sourcing
            </span>
          )}
          {managementEnabled && (
            <span className="bg-black/60 text-white font-medium text-[9px] tracking-wide px-1.5 py-0.5 rounded-full border border-white/20 backdrop-blur-sm flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-green-400"/> Management
            </span>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="p-5 flex-1 flex flex-col">
        
        {/* Title and Location */}
        <div className="mb-4">
          <Link href={`/listings/${listing.id}`}>
            <h3 className="font-display text-lg font-medium text-[var(--text-primary)] mb-1 hover:text-[var(--accent)] transition-colors line-clamp-1 cursor-pointer">
              {listing.title}
            </h3>
          </Link>
          <div className="flex items-center text-[var(--text-muted)] font-label-xs text-xs gap-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{locationDisplay}</span>
          </div>
        </div>

        {/* Financial Grid */}
        <div className="grid grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden mb-6">
          <div className="bg-[var(--bg-secondary)] p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-[var(--text-muted)] uppercase mb-1">Rent to LL</span>
            <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{formatPrice(rentToLandlordPence)}</span>
            <span className="text-[10px] text-[var(--text-muted)]">/mo</span>
          </div>
          <div className="bg-[var(--bg-secondary)] p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-[var(--text-muted)] uppercase mb-1">Room Income</span>
            <span className="font-mono text-sm font-bold text-[var(--text-primary)]">{formatPrice(totalRoomIncome)}</span>
            <span className="text-[10px] text-[var(--text-muted)]">{listing.hmoRooms?.length || 0} rooms</span>
          </div>
          <div className="bg-[var(--bg-secondary)] p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[var(--accent)]/5"></div>
            <span className="text-[10px] text-[var(--accent)] uppercase mb-1 relative z-10 font-medium">Monthly Spread</span>
            <span className="font-mono text-sm font-bold text-[var(--accent)] relative z-10">{formatPrice(monthlyGrossProfit)}</span>
            <span className="text-[10px] text-[var(--accent)]/80 relative z-10">Gross Profit/m</span>
          </div>
        </div>

        {/* Room Breakdown (if HMO rooms exist) */}
        {roomGroups.length > 0 && (
          <div className="mb-6">
            <h4 className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 font-semibold">Room Breakdown</h4>
            <div className="space-y-1.5 text-xs max-h-32 overflow-y-auto pr-1">
              {roomGroups.map((group, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-[var(--border)]/50">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[var(--accent)]/10 text-[var(--accent)] font-bold flex items-center justify-center text-[10px]">{group.count}</span>
                    <span className="text-[var(--text-muted)]">{group.name}</span>
                  </div>
                  <span className="font-mono font-medium text-[var(--text-primary)]">{formatWholePrice(group.rent)}/mo</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 mt-1 font-bold border-t border-[var(--border)]">
              <span className="text-[var(--text-primary)]">Total Room Income</span>
              <span className="font-mono text-[var(--accent)]">{formatWholePrice(totalRoomIncome)}/mo</span>
            </div>
          </div>
        )}

        {/* Contract Details */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6 text-xs">
          <div className="flex justify-between border-b border-[var(--border)] pb-1">
            <span className="text-[var(--text-muted)]">Contract</span>
            <span className="text-[var(--text-primary)] font-semibold">{strategyData.contractLengthMonths ? `${strategyData.contractLengthMonths} Months` : 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-[var(--border)] pb-1">
            <span className="text-[var(--text-muted)]">Finder Fee</span>
            <span className="text-[var(--text-primary)] font-semibold">{formatPrice(listing.askingPricePence)}</span>
          </div>
        </div>

        {/* Projections Accordion */}
        <div className="mt-auto border border-[var(--border)] rounded-lg bg-[var(--bg-secondary)] overflow-hidden">
          <button 
            type="button"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full p-3 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20">
                <Calculator className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Financial Projections</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {formatPrice(moneyNeeded)} in · Y2 ROI {roiY2SelfManage.toFixed(0)}% self
                </p>
              </div>
            </div>
            {isAccordionOpen ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
          </button>

          {isAccordionOpen && (
            <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border)] text-xs space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Money Needed In</p>
                  <p className="font-mono text-sm font-bold text-[var(--text-primary)]">{formatWholePrice(moneyNeeded)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Monthly Gross Profit</p>
                  <p className="font-mono text-sm font-bold text-[var(--accent)]">{formatWholePrice(monthlyGrossProfit)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="border border-[var(--border)] rounded bg-[var(--bg-secondary)] p-2">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1.5 font-semibold">Year One Potential</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">Self Manage</p>
                      <p className="font-mono font-bold text-[var(--accent)]">{formatWholePrice(profitY1SelfManage)}/yr</p>
                      <p className="text-[10px] text-[var(--text-muted)]">ROI: {roiY1SelfManage.toFixed(1)}%</p>
                    </div>
                    <div className="border-l border-[var(--border)] pl-2">
                      <p className="text-[10px] text-[var(--text-muted)]">Managed (10%)</p>
                      <p className="font-mono font-bold text-[var(--accent)]">{formatWholePrice(profitY1Managed)}/yr</p>
                      <p className="text-[10px] text-[var(--text-muted)]">ROI: {roiY1Managed.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="border border-[var(--border)] rounded bg-[var(--bg-secondary)] p-2">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1.5 font-semibold">Year Two Potential</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)]">Self Manage</p>
                      <p className="font-mono font-bold text-[var(--accent)]">{formatWholePrice(profitY2SelfManage)}/yr</p>
                      <p className="text-[10px] text-[var(--text-muted)]">ROI: {roiY2SelfManage.toFixed(1)}%</p>
                    </div>
                    <div className="border-l border-[var(--border)] pl-2">
                      <p className="text-[10px] text-[var(--text-muted)]">Managed (10%)</p>
                      <p className="font-mono font-bold text-[var(--accent)]">{formatWholePrice(profitY2Managed)}/yr</p>
                      <p className="text-[10px] text-[var(--text-muted)]">ROI: {roiY2Managed.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nearby Locations */}
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <h4 className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 font-semibold">Nearby Locations</h4>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] text-[var(--text-muted)]">
                  <div className="flex justify-between"><span className="flex items-center gap-1"><Train className="w-3 h-3"/> Nottingham Stn</span> <span>1.1mi</span></div>
                  <div className="flex justify-between"><span className="flex items-center gap-1"><GraduationCap className="w-3 h-3"/> Trent Uni</span> <span>0.6mi</span></div>
                  <div className="flex justify-between"><span className="flex items-center gap-1"><Hospital className="w-3 h-3"/> QMC Hospital</span> <span>1.5mi</span></div>
                  <div className="flex justify-between"><span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> Victoria Ctr</span> <span>0.7mi</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs uppercase">
            {agencyName[0]}
          </div>
          <div>
            <div className="flex items-center gap-0.5">
              <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">{agencyName}</p>
              {isVerified && <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />}
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">Sourcing Agent</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/listings/${listing.id}`}>
            <button className="flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs transition-colors p-1.5 rounded">
              Details <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </Link>
          <button 
            onClick={handleMessageAgent}
            disabled={isMessaging}
            className="bg-[var(--accent)] text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5 hover:bg-[var(--accent-hover)] transition-colors font-semibold"
          >
            <MessageSquare className="w-3.5 h-3.5" /> 
            {isMessaging ? "..." : "Enquire"}
          </button>
        </div>
      </div>

    </article>
  )
}
