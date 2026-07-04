"use client"

import * as React from "react"
import { MapPin, Phone, Mail, MessageSquare, CheckCircle2, AlertTriangle, ExternalLink, Edit } from "lucide-react"
import { ImageGallery } from "@/components/listings/image-gallery"
import { FinancialTable } from "@/components/listings/financial-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useListing } from "@/hooks/queries/use-listings"
import { getAgencyProfile, startConversation, sendMessage } from "@/lib/api"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default function ListingDetailPage({ params }: Props) {
  const { id } = React.use(params)
  const { data: listing, isLoading, error } = useListing(id)

  const [agencyProfile, setAgencyProfile] = React.useState<any>(null)
  const router = useRouter()
  const [isMessaging, setIsMessaging] = React.useState(false)
  
  React.useEffect(() => {
    // Fetch agency profile for the listing
    getAgencyProfile()
      .then(data => setAgencyProfile(data))
      .catch(() => {
        // Silently fail - not critical for listing display
      })
  }, [])

  const handleMessageAgent = async () => {
    if (!listing) return
    try {
      setIsMessaging(true)
      const conv = await startConversation(listing.id)
      
      // Auto-send initial context message if conversation is new
      if (conv._count?.messages === 0 || !conv._count) {
        const initialMessage = `Hi, I am interested in your listing: ${listing.title} (${listing.postcode}).\n\nIs this deal still available?`
        await sendMessage(conv.id, initialMessage)
      }
      
      router.push(`/messages?conversationId=${conv.id}`)
    } catch (err) {
      console.error("Failed to message agent:", err)
    } finally {
      setIsMessaging(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        <div className="h-64 bg-slate-800/40 rounded-xl w-full" />
        <div className="h-8 bg-slate-800/40 rounded w-1/3" />
        <div className="h-4 bg-slate-800/40 rounded w-1/2" />
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="h-24 bg-slate-800/40 rounded-xl" />
            <div className="h-48 bg-slate-800/40 rounded-xl" />
          </div>
          <div className="h-64 bg-slate-800/40 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-[var(--error)] mx-auto" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Listing Not Found</h2>
        <p className="text-xs text-[var(--text-muted)]">Could not load the requested property. Please verify the URL.</p>
        <Link href="/browse" className="inline-block px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold text-xs rounded-lg transition-all">
          Back to Browse
        </Link>
      </div>
    )
  }

  const images = listing.media && listing.media.length > 0
    ? listing.media.map((m: any) => m.url || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80")
    : ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80"]

  const spec = (listing.strategySpecificData || {}) as Record<string, any>

  const finderFeePence = typeof spec.finderFeePence === 'number' ? spec.finderFeePence : 0
  const refurbCostPence = typeof listing.refurbCostPence === 'number' ? listing.refurbCostPence : 0
  const depositPence = typeof spec.depositPence === 'number' ? spec.depositPence : 0
  const rentToLandlordPence = typeof spec.rentToLandlordPence === 'number' ? spec.rentToLandlordPence : 0

  const monthlyRentPence = listing.hmoRooms && listing.hmoRooms.length > 0
    ? listing.hmoRooms.reduce((sum: number, r: any) => sum + (r.monthlyRentPence || 0), 0)
    : rentToLandlordPence

  const moneyNeededPence = rentToLandlordPence + depositPence + finderFeePence + refurbCostPence

  const bmvDiscountPence = listing.marketValuePence && listing.askingPricePence && listing.marketValuePence > listing.askingPricePence
    ? listing.marketValuePence - listing.askingPricePence
    : 0

  const financialRows = [
    { label: "Market Value", value: listing.marketValuePence || 0, type: "currency" as const },
    { label: "Asking Price", value: listing.askingPricePence || 0, type: "currency" as const, highlight: "emerald" as const },
    ...(bmvDiscountPence > 0 ? [{ label: "BMV Discount", value: bmvDiscountPence, type: "currency" as const, highlight: "amber" as const }] : []),
    { label: "Renovation Cost", value: refurbCostPence, type: "currency" as const, highlight: "warning" as const },
    { label: "Sourcing Fee", value: finderFeePence, type: "currency" as const },
    { label: "Total Capital In", value: moneyNeededPence, type: "currency" as const, highlight: "bold" as const },
    { label: "", value: 0, isDivider: true },
    { label: "Gross Yield", value: listing.estimatedRoi || 0, type: "percentage" as const, highlight: "emerald" as const },
    { label: "Monthly Rental Income", value: monthlyRentPence, type: "currency" as const },
  ]

  const isOwner = !!(agencyProfile && listing && listing.agencyProfile && agencyProfile.companyName === listing.agencyProfile.companyName)

  const strategyBadges = [
    { label: listing.strategy || "HMO", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    ...(listing.isLicensed ? [{ label: "Licensed", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }] : []),
    ...(listing.needsRefurb ? [{ label: "Refurb Needed", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" }] : []),
  ]

  const agencyName = listing.agencyProfile?.companyName || listing.agencyProfile?.contactName || "Verified Agency"
  const agencyContact = listing.agencyProfile?.contactName || "Agency Representative"
  const agencyPhone = listing.agencyProfile?.phone || "+44 20 7123 4567"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Image Gallery */}
      <ImageGallery images={images} className="w-full" />

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Title & Address */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-normal text-[var(--text-primary)] mb-2">
                {listing.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span>{listing.addressLine1 || "Address"}, {listing.postcode}</span>
                </span>
                <span className="flex items-center gap-1">
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  <a href={`https://maps.google.com/?q=${encodeURIComponent((listing.addressLine1 || "") + " " + listing.postcode)}`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">
                    View on Google Maps
                  </a>
                </span>
              </div>
            </div>

            {isOwner && (
              <Link
                href={`/agency?tab=edit-listing&id=${listing.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold text-xs rounded-lg transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Listing
              </Link>
            )}
          </div>

          {/* Strategy Badges */}
          <div className="flex flex-wrap gap-2">
            {strategyBadges.map((badge) => (
              <Badge key={badge.label} className={badge.className}>
                {badge.label}
              </Badge>
            ))}
          </div>

          {/* Description */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <p className="text-[var(--text-muted)] leading-relaxed">{listing.description || "No description provided."}</p>
          </div>

          {/* Financial Breakdown */}
          <div>
            <h2 className="font-display text-xl font-normal text-[var(--text-primary)] mb-4">Financial Breakdown</h2>
            <FinancialTable rows={financialRows} />
          </div>

          {/* Property Details (from form) */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="font-display text-xl font-normal text-[var(--text-primary)] mb-4">Property & Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              {listing.propertyType && (
                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Property Type</span>
                  <span className="text-[var(--text-primary)] font-medium capitalize">{listing.propertyType}</span>
                </div>
              )}
              {spec.furnished && (
                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Furnishing</span>
                  <span className="text-[var(--text-primary)] font-medium capitalize">{spec.furnished} {spec.furnishQuality ? `(${spec.furnishQuality} quality)` : ''}</span>
                </div>
              )}
              {spec.statusLicensed !== undefined && (
                <div>
                  <span className="text-[var(--text-muted)] block mb-1">License Status</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {spec.statusLicensed ? "Licensed" : `No License (${spec.licenseStatusReason || 'N/A'})`}
                  </span>
                </div>
              )}
              {spec.statusTenanted !== undefined && (
                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Tenancy</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {spec.statusTenanted ? `Tenanted (${spec.tenancyStatus || 'Details unknown'})` : "Vacant"}
                  </span>
                </div>
              )}
              {spec.tenancyDetails && (
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-[var(--text-muted)] block mb-1">Tenancy Details</span>
                  <span className="text-[var(--text-primary)] font-medium">{spec.tenancyDetails}</span>
                </div>
              )}
              {spec.statusNeedsRefurb !== undefined && (
                <div>
                  <span className="text-[var(--text-muted)] block mb-1">Refurbishment</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {spec.statusNeedsRefurb ? `Needed (${spec.refurbIsQuoted ? 'Quoted' : 'Estimated'} cost)` : "Not Needed"}
                  </span>
                </div>
              )}
              {listing.hmoRooms && listing.hmoRooms.length > 0 && (
                <div className="col-span-1 sm:col-span-2 mt-2">
                  <span className="text-[var(--text-muted)] block mb-2 font-bold">Rooms Breakdown</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {listing.hmoRooms.map((room: any, idx: number) => (
                      <div key={idx} className="bg-[var(--bg-secondary)] p-2 rounded flex justify-between items-center border border-[var(--border)]">
                        <span className="text-[var(--text-primary)]">{room.name || room.roomType || `Room ${idx+1}`}</span>
                        <span className="font-mono text-[var(--accent)] font-bold">£{(room.monthlyRentPence || 0) / 100}/mo</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Due Diligence Banner */}
          <div className="bg-[var(--warning-subtle)] border border-[var(--warning)]/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium text-[var(--warning)] mb-1">Due Diligence Notice</p>
              <p className="text-sm text-[var(--text-muted)]">
                Always conduct independent due diligence. PropVest connects buyers with agencies — we do not verify property values or guarantee returns.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Sticky Sidebar */}
        <div className="lg:sticky lg:top-24">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 space-y-6">
            {/* Agency Card */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-lg">
                  {agencyName.split(" ").map((w) => w[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{agencyName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                    <span className="text-sm text-[var(--accent)] font-medium">Verified Agency</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text-muted)]">Contact: {agencyContact}</p>
                <p className="flex items-center gap-2 text-sm text-[var(--text-primary)] mt-1">
                  <Phone className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                  {agencyPhone}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button className="w-full justify-center gap-2" variant="outline">
                  <Phone className="w-4 h-4" />
                  Call Agent
                </Button>
                <Button className="w-full justify-center gap-2" variant="outline">
                  <Mail className="w-4 h-4" />
                  Email Agent
                </Button>
                <Button 
                  className="w-full justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
                  onClick={handleMessageAgent}
                  disabled={isMessaging}
                >
                  <MessageSquare className="w-4 h-4" />
                  {isMessaging ? "Connecting..." : "Message Agent"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
