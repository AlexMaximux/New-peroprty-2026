"use client"

import * as React from "react"
import { Clock, FileText, Building2 } from "lucide-react"
import { SubtypeStep } from "./subtype-step"
import { HmoListingForm } from "./hmo-listing-form"
import type { HmoFormData, StrategyType } from "./wizard-types"
import { defaultHmoFormData } from "./wizard-types"
import { getAgencyProfile, getListing, createListing, updateListing, publishListing } from "@/lib/api"

export function NewListingWizard({ editId, onSuccess }: { editId?: string | null; onSuccess?: () => void }) {
  const [strategy, setStrategy] = React.useState<StrategyType | null>(null)
  const [subtype, setSubtype] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState<HmoFormData>(defaultHmoFormData)
  const [submitting, setSubmitting] = React.useState(false)
  const [listingStatus, setListingStatus] = React.useState<string | null>(null)
  const [isAgencyVerified, setIsAgencyVerified] = React.useState(false)

  // Fetch agency profile for verification status
  React.useEffect(() => {
    getAgencyProfile()
      .then(data => {
        setIsAgencyVerified(data.verificationStatus === "APPROVED")
      })
      .catch(() => {
        // Silently fail - not critical
      })
  }, [])

// Fetch existing listing data for editing
  React.useEffect(() => {
    if (editId) {
      const fetchListingData = async () => {
        try {
          const data = await getListing(editId)
          setListingStatus(data.status)
          const spec = data.strategySpecificData || {} as Record<string, any>
          
          // Map region back to central/north/south/wales/scotland
          let mappedRegion: any = ""
          if (data.region) {
            const r = data.region.toLowerCase()
            if (["north", "south", "central", "wales", "scotland"].includes(r)) {
              mappedRegion = r
            }
          }

          // Map property type back to flat/terraced/detached/semi/other
          let mappedPropType: any = ""
          if (data.propertyType) {
            const pt = data.propertyType.toLowerCase()
            if (pt === "terraced") mappedPropType = "terraced"
            else if (pt === "semi_detached") mappedPropType = "semi"
            else if (pt === "detached") mappedPropType = "detached"
            else if (pt === "flat") mappedPropType = "flat"
            else mappedPropType = "other"
          }

          // Map furnished status back to unfurnished/furnished/semi
          let mappedFurnished: any = ""
          if (data.furnishedStatus) {
            const fs = data.furnishedStatus.toLowerCase()
            if (fs === "unfurnished") mappedFurnished = "unfurnished"
            else if (fs === "furnished") mappedFurnished = "furnished"
            else if (fs === "semi_furnished") mappedFurnished = "semi"
          }

          setStrategy("rent2rent")
          setSubtype("hmo")
          setFormData({
            strategy: "rent2rent",
            subtype: "hmo",
            saVariant: null,
            title: data.title || "",
            description: data.description || "",
            postcode: data.postcode || "",
            houseNumber: data.buildingNumber || "",
            region: mappedRegion,
            manualAddress: data.addressLine1 || "",
            propertyType: mappedPropType,
            otherPropertyExplain: data.propertyTypeOther || "",
            mediaFiles: [], // new media can still be uploaded. Pre-existing media is in the DB.
            existingMedia: data.media || [],
            nearbyPlaces: data.nearbyPlaces || [],
            latitude: data.latitude,
            longitude: data.longitude,
            statusLicensed: data.isLicensed ?? true,
            licenseStatusReason: spec.licenceNote || "",
            statusTenanted: spec.isTenanted ?? false,
            tenancyStatus: spec.tenancyType || "",
            tenancyDetails: spec.tenancyDetails || "",
            statusNeedsRefurb: data.needsRefurb ?? false,
            refurbCost: data.refurbCostPence ? Math.round(data.refurbCostPence / 100) : 0,
            refurbIsQuoted: data.refurbQuoteType === "QUOTED",
            furnished: mappedFurnished,
            furnishQuality: spec.furnishQuality || "",
            furnishOtherExplain: spec.furnishOtherExplain || "",
            hasLivingRoom: data.hasLivingRoom ?? null,
            hasGarden: data.hasGarden ?? null,
            hasParking: spec.hasParking ?? null,
            parkingSpaces: spec.parkingSpaces || 0,
            parkingOtherExplain: spec.parkingOtherExplain || "",
            gardenOtherExplain: spec.gardenOtherExplain || "",
            rooms: (data.hmoRooms || []).map((r: any) => ({
              id: r.id,
              type: r.roomType === "DOUBLE_EN_SUITE" ? "Double En-Suite" :
                    r.roomType === "DOUBLE_SHARED" ? "Double Shared Bathroom" :
                    r.roomType === "SINGLE_EN_SUITE" ? "Single En-Suite" :
                    r.roomType === "SINGLE_SHARED" ? "Single Shared Bathroom" : "Other",
              monthlyRent: r.monthlyRentPence ? Math.round(r.monthlyRentPence / 100) : 0
            })),
            rentToLandlord: spec.rentToLandlordPence ? Math.round(spec.rentToLandlordPence / 100) : 0,
            deposit: spec.depositPence ? Math.round(spec.depositPence / 100) : 0,
            contractLength: spec.contractLengthMonths || 0,
            contractLengthUnit: "months",
            reviewAfter: spec.reviewPeriodMonths || 0,
            reviewAfterUnit: "months",
            referenceType: spec.referenceRequirement ? spec.referenceRequirement.toLowerCase() : "",
            referenceOtherExplain: "",
            finderFee: spec.finderFeePence ? Math.round(spec.finderFeePence / 100) : 0,
            happyToCoSource: spec.happyToCoSource ?? true,
            runUtilityTicked: spec.billsPence > 0,
            runUtilityCost: spec.billsPence ? Math.round(spec.billsPence / 100) : 0,
            runCouncilTaxTicked: false,
            runCouncilTaxCost: 0,
            runCleaningTicked: false,
            runCleaningCost: 0,
            runMaintenanceTicked: spec.managementEnabled ?? true,
            runMaintenancePercent: spec.managementRatePercent ?? 10,
            runOtherTicked: false,
            runOtherCost: 0,
            runOtherExplain: "",
            managementAvailable: spec.managementAvailable ?? false,
            managementFeePercent: spec.managementFeePercent ?? 10,
            additionalNotes: spec.notes || "",
          })
        } catch (err) {
          console.error("Failed to load listing for editing:", err)
        }
      }
      fetchListingData()
    }
  }, [editId])

  const updateFormData = React.useCallback((patch: Partial<HmoFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }))
  }, [])

  const mapPropertyType = (val: string): "TERRACED" | "FLAT" | "DETACHED" | "SEMI_DETACHED" | "OTHER" => {
    switch (val) {
      case "terraced": return "TERRACED";
      case "semi": return "SEMI_DETACHED";
      case "detached": return "DETACHED";
      case "flat": return "FLAT";
      default: return "OTHER";
    }
  }

  const mapFurnishedStatus = (val: string): "UNFURNISHED" | "SEMI_FURNISHED" | "FURNISHED" | undefined => {
    switch (val) {
      case "unfurnished": return "UNFURNISHED";
      case "semi": return "SEMI_FURNISHED";
      case "furnished": return "FURNISHED";
      default: return undefined;
    }
  }

  const mapRoomType = (val: string): "DOUBLE_EN_SUITE" | "DOUBLE_SHARED" | "SINGLE_EN_SUITE" | "SINGLE_SHARED" | "OTHER" => {
    switch (val) {
      case "Double En-Suite": return "DOUBLE_EN_SUITE";
      case "Double Shared Bathroom": return "DOUBLE_SHARED";
      case "Single En-Suite": return "SINGLE_EN_SUITE";
      case "Single Shared Bathroom": return "SINGLE_SHARED";
      default: return "OTHER";
    }
  }
  const mapReferenceRequirement = (val: string): "EASY" | "FULL" | "LTD" | "OTHER" | undefined => {
    switch (val?.toLowerCase()) {
      case "easy": return "EASY";
      case "full": return "FULL";
      case "ltd": return "LTD";
      case "other": return "OTHER";
      default: return undefined;
    }
  }

const handleSubmit = async (isPublish: boolean = false) => {
    setSubmitting(true)
    try {
      const token = localStorage.getItem("pv_access_token")
      if (!token) {
        alert("You must be logged in to submit a listing.")
        return
      }

      // Financial ROI math for Year 1 Self Managed
      const totalRoomIncome = formData.rooms.reduce((s, r) => s + r.monthlyRent, 0)
      const moneyNeeded = formData.rentToLandlord + formData.deposit + formData.finderFee + formData.refurbCost

      const monthlyMaintenance = formData.runMaintenanceTicked
        ? Math.round(totalRoomIncome * (formData.runMaintenancePercent / 100))
        : 0

      const runningCostSelfManageY1 = (
        formData.rentToLandlord +
        (formData.runUtilityTicked ? formData.runUtilityCost : 0) +
        (formData.runCouncilTaxTicked ? formData.runCouncilTaxCost : 0) +
        (formData.runCleaningTicked ? formData.runCleaningCost : 0) +
        Math.round(formData.finderFee / 12) +
        monthlyMaintenance +
        (formData.runOtherTicked ? formData.runOtherCost : 0)
      )
      const profitY1SelfManage = (totalRoomIncome - runningCostSelfManageY1) * 12
      const roiY1SelfManage = moneyNeeded > 0 ? (profitY1SelfManage / moneyNeeded) * 100 : 0

      const refurbQuoteTypeMapped = formData.statusNeedsRefurb
        ? (formData.refurbIsQuoted ? "QUOTED" : "ESTIMATED")
        : "NOT_QUOTED";

      const payload = {
        category: "RENT_TO_RENT",
        strategy: "HMO",
        status: "DRAFT",
        base: {
          title: formData.title || `${formData.rooms?.length || 0} Bed HMO - ${formData.manualAddress || formData.postcode || "Birmingham"}`,
          description: formData.description || formData.additionalNotes || "Rent to Rent HMO listing",
          propertyType: mapPropertyType(formData.propertyType),
          propertyTypeOther: formData.otherPropertyExplain || undefined,
          addressLine1: formData.manualAddress || "Address Line 1",
          city: formData.region || "Birmingham",
          postcode: formData.postcode || "B11 3AQ",
          buildingNumber: formData.houseNumber || undefined,
          region: formData.region || "West Midlands",
          bedrooms: formData.rooms?.length || 0,
          isLicensed: formData.statusLicensed,
          isTenanted: formData.statusTenanted,
          needsRefurb: formData.statusNeedsRefurb,
          refurbCostPence: Math.round((formData.refurbCost || 0) * 100),
          refurbQuoteType: refurbQuoteTypeMapped,
          askingPricePence: Math.round((formData.rentToLandlord || 0) * 100),
          marketValuePence: Math.round((formData.rentToLandlord || 0) * 100),
          estimatedRoi: Math.round(roiY1SelfManage * 10) / 10,
          furnishedStatus: mapFurnishedStatus(formData.furnished),
          furnishingQuality: formData.furnishQuality || undefined,
          furnishingNotes: formData.furnishOtherExplain || undefined,
          hasLivingRoom: formData.hasLivingRoom ?? undefined,
          hasGarden: formData.hasGarden ?? undefined,
          parking: formData.hasParking ? `${formData.parkingSpaces} spaces` : "No",
        },
        hmoRooms: (formData.rooms || []).map((r, i) => ({
          name: `Room ${i + 1}`,
          roomType: mapRoomType(r.type),
          monthlyRentPence: Math.round((r.monthlyRent || 0) * 100),
        })),
        strategySpecificData: {
          rentToLandlordPence: Math.round((formData.rentToLandlord || 0) * 100),
          depositPence: Math.round((formData.deposit || 0) * 100),
          contractLengthMonths: (formData.contractLengthUnit === "years" ? formData.contractLength * 12 : formData.contractLength) || 12,
          reviewPeriodMonths: (formData.reviewAfterUnit === "years" ? formData.reviewAfter * 12 : formData.reviewAfter) || undefined,
          referenceRequirement: mapReferenceRequirement(formData.referenceType),
          isLicensed: formData.statusLicensed,
          licenceNote: formData.licenseStatusReason || undefined,
          isTenanted: formData.statusTenanted,
          tenancyType: formData.tenancyStatus || undefined,
          needsRefurb: formData.statusNeedsRefurb,
          refurbCostPence: Math.round((formData.refurbCost || 0) * 100),
          refurbQuoteType: refurbQuoteTypeMapped,
          finderFeePence: Math.round((formData.finderFee || 0) * 100),
          happyToCoSource: formData.happyToCoSource,
          managementEnabled: formData.runMaintenanceTicked,
          managementRatePercent: formData.runMaintenancePercent || 0,
          billsPence: Math.round(
            ((formData.runUtilityTicked ? formData.runUtilityCost : 0) +
             (formData.runCouncilTaxTicked ? formData.runCouncilTaxCost : 0) +
             (formData.runCleaningTicked ? formData.runCleaningCost : 0) +
             (formData.runOtherTicked ? formData.runOtherCost : 0)) * 100
          ),
          notes: formData.additionalNotes || undefined,
        },
        nearbyPlaces: formData.nearbyPlaces,
      }

      console.log("Submitting listing payload:", payload)

      let createdListing: any
      
      if (editId) {
        // Update existing listing
        createdListing = await updateListing(editId, payload)
      } else {
        // Create new listing
        createdListing = await createListing(payload)
      }
      
      const listingId = createdListing.id

      if (formData.mediaFiles && formData.mediaFiles.length > 0 && listingId) {
        const { uploadImage } = await import("@/lib/api")
        for (let i = 0; i < formData.mediaFiles.length; i++) {
          const file = formData.mediaFiles[i]
          if (file) {
            try {
              await uploadImage(listingId, file, i === 0)
            } catch (uploadErr) {
              console.error(`Failed to upload file ${file.name}:`, uploadErr)
            }
          }
        }
      }

      let alertMsg = editId ? "Listing updated successfully!" : "Draft saved successfully!"

      if (isPublish && listingId && (editId ? listingStatus === "DRAFT" : true)) {
        const publishedListing = await publishListing(listingId)
        if (publishedListing.status === "PUBLISHED") {
          alertMsg = "Listing published successfully!"
        } else {
          alertMsg = "Listing submitted for review!"
        }
      }

      alert(alertMsg)
      // Reset wizard
      setStrategy(null)
      setSubtype(null)
      setFormData(defaultHmoFormData)
      onSuccess?.()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to submit listing. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    await handleSubmit(false)
  }

  /* ─── Strategy Selector ─── */
  if (!strategy) {
    return (
      <div className="space-y-4">
        <div className="text-center max-w-md mx-auto py-4">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Select Sourcing Strategy</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Choose the type of deal you want to list on the marketplace.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setStrategy("rent2rent")}
            className="p-6 bg-slate-950/40 border border-white/[0.06] hover:border-[var(--accent-border)] hover:bg-white/[0.02] rounded-xl text-center flex flex-col items-center gap-3 transition-all cursor-pointer group animate-fade-in"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Rent to Rent (R2R)</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              List HMO or SA properties available for corporate letting agreements.
            </p>
          </button>

          <button
            onClick={() => setStrategy("leadoption")}
            className="p-6 bg-slate-950/40 border border-white/[0.06] hover:border-[var(--accent-border)] hover:bg-white/[0.02] rounded-xl text-center flex flex-col items-center gap-3 transition-all cursor-pointer group animate-fade-in"
          >
            <div className="w-12 h-12 rounded-full bg-[#3398db]/15 flex items-center justify-center text-[#3398db] group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Lead Option</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              List lease option agreements or sourcing leads with structured terms.
            </p>
          </button>

          <button
            onClick={() => setStrategy("sell")}
            className="p-6 bg-slate-950/40 border border-white/[0.06] hover:border-[var(--accent-border)] hover:bg-white/[0.02] rounded-xl text-center flex flex-col items-center gap-3 transition-all cursor-pointer group animate-fade-in"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/15 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">Sell Property</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              List properties for direct sale — BMV, HMO, high-ROI, cash buys, development, commercial.
            </p>
          </button>
        </div>
      </div>
    )
  }

  /* ─── Subtype Selector (R2R only) ─── */
  if (strategy === "rent2rent" && !subtype) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStrategy(null)}
            className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
          >
            ← Back to strategies
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-subtle)] px-2.5 py-1 rounded-full border border-[var(--accent-border)]">
            Rent to Rent
          </span>
        </div>
        <div className="max-w-md mx-auto py-8">
          <SubtypeStep selectedSubtype={subtype} onSelect={setSubtype} />
        </div>
      </div>
    )
  }

  /* ─── Lead Option / Sell placeholders ─── */
  if (strategy === "leadoption" || strategy === "sell") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStrategy(null)}
            className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
          >
            ← Back to strategies
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent-subtle)] px-2.5 py-1 rounded-full border border-[var(--accent-border)]">
            {strategy === "leadoption" ? "Lead Option" : "Sell Property"}
          </span>
        </div>
        <div className="bg-slate-950/40 border border-white/[0.06] p-8 rounded-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">Strategy Form Pending</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            The detailed input fields for <strong>{strategy === "leadoption" ? "Lead Option" : "Sell Property"}</strong> will be configured in the next phase.
          </p>
          <button
            onClick={() => setStrategy(null)}
            className="mt-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold text-xs rounded-lg transition-all cursor-pointer"
          >
            Back to Sourcing Strategies
          </button>
        </div>
      </div>
    )
  }

  /* ─── SA placeholder ─── */
  if (strategy === "rent2rent" && subtype === "sa") {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSubtype(null)}
            className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
          >
            ← Back to R2R type
          </button>
        </div>
        <div className="p-12 text-center bg-slate-950/40 border border-white/[0.06] rounded-xl text-[var(--text-muted)]">
          <p className="text-xs">SA / Serviced Accommodation form — Coming Soon</p>
        </div>
      </div>
    )
  }

  /* ─── HMO Single Page Form ─── */
  return (
    <div className="animate-fade-in">
      <HmoListingForm
        data={formData}
        onChange={updateFormData}
        onSubmit={() => handleSubmit(true)}
        onSaveDraft={handleSaveDraft}
        submitting={submitting}
        isAgencyVerified={isAgencyVerified}
        onBack={() => {
          setSubtype(null)
        }}
      />
    </div>
  )
}
