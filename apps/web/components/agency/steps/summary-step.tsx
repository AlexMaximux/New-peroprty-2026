"use client"

import * as React from "react"
import { ClipboardCheck, ChevronDown, ChevronUp } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { HmoFormData } from "../wizard-types"

interface Props {
  data: HmoFormData
  onChange: (patch: Partial<HmoFormData>) => void
  onSubmit: () => void
  onSaveDraft: () => void
  submitting: boolean
}

const LABEL_MAP: Record<string, string> = {
  terraced: "Terraced",
  flat: "Flat",
  detached: "Detached",
  semi: "Semi-Detached",
  other: "Other",
  north: "North",
  south: "South",
  central: "Central",
  wales: "Wales",
  scotland: "Scotland",
  ltd: "LTD Contract",
  easy: "Easy Reference",
  full: "Full Reference",
  unfurnished: "Unfurnished",
  furnished: "Furnished",
  high: "High Quality",
  good: "Good Quality",
  medium: "Medium Quality",
  low: "Low Quality",
}

function SummarySection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/40 hover:bg-slate-900/60 transition-colors cursor-pointer"
      >
        <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
      </button>
      {open && <div className="p-4 space-y-2 bg-slate-900/20">{children}</div>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className="text-xs text-[var(--text-muted)] flex-shrink-0">{label}</span>
      <span className="text-xs text-[var(--text-primary)] font-semibold text-right">{value || "—"}</span>
    </div>
  )
}

export function SummaryStep({ data, onChange, onSubmit, onSaveDraft, submitting }: Props) {
  const totalIncome = data.rooms.reduce((s, r) => s + r.monthlyRent, 0)
  const monthlyGrossProfit = totalIncome - data.rentToLandlord

  const totalRunningCost = (
    (data.runUtilityTicked ? data.runUtilityCost : 0) +
    (data.runCouncilTaxTicked ? data.runCouncilTaxCost : 0) +
    (data.runCleaningTicked ? data.runCleaningCost : 0) +
    Math.round(data.finderFee / 12) +
    (data.runOtherTicked ? data.runOtherCost : 0)
  )

  const moneyNeeded = data.rentToLandlord + data.deposit + data.finderFee + data.refurbCost
  const profitYearOne = (monthlyGrossProfit - totalRunningCost) * 12
  const roi = moneyNeeded > 0 ? (profitYearOne / moneyNeeded) * 100 : 0

  const runningCostsList = [
    data.runUtilityTicked && `Utility (£${data.runUtilityCost}/mo)`,
    data.runCouncilTaxTicked && `Council Tax (£${data.runCouncilTaxCost}/mo)`,
    data.runCleaningTicked && `Cleaning (£${data.runCleaningCost}/mo)`,
    data.finderFee > 0 && `Finder Fee Amortized (£${Math.round(data.finderFee / 12)}/mo)`,
    data.runOtherTicked && `${data.runOtherExplain || "Other"} (£${data.runOtherCost}/mo)`,
  ].filter(Boolean)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-[var(--accent)]" />
          Summary &amp; Review
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">Review all details before submitting your listing</p>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <div className="bg-slate-900/30 border border-white/[0.06] rounded-xl p-3.5 text-center">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Money Needed In</p>
          <p className="text-base font-mono tabular-nums text-[var(--text-primary)] font-bold">£{moneyNeeded.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/30 border border-white/[0.06] rounded-xl p-3.5 text-center">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Gross Profit</p>
          <p className="text-base font-mono tabular-nums text-[var(--accent)] font-bold">£{monthlyGrossProfit.toLocaleString()}/mo</p>
        </div>
        <div className="bg-slate-900/30 border border-white/[0.06] rounded-xl p-3.5 text-center">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Profit Year One</p>
          <p className="text-base font-mono tabular-nums text-[var(--accent)] font-bold">£{profitYearOne.toLocaleString()}/yr</p>
        </div>
        <div className="bg-slate-900/30 border border-white/[0.06] rounded-xl p-3.5 text-center">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">ROI</p>
          <p className="text-base font-mono tabular-nums text-[var(--accent)] font-bold">{roi.toFixed(1)}%</p>
        </div>
        <div className="bg-slate-900/30 border border-white/[0.06] rounded-xl p-3.5 text-center col-span-2 md:col-span-1">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Rooms</p>
          <p className="text-base font-mono tabular-nums text-[var(--text-primary)] font-bold">{data.rooms.length}</p>
        </div>
      </div>

      {/* Collapsible Sections */}
      <SummarySection title="Address & Property">
        <Row label="Postcode" value={data.postcode} />
        <Row label="House Number" value={data.houseNumber} />
        <Row label="Region" value={LABEL_MAP[data.region] || data.region} />
        {data.manualAddress && <Row label="Manual Address" value={data.manualAddress} />}
        <Row label="Property Type" value={data.propertyType === "other" ? data.otherPropertyExplain : LABEL_MAP[data.propertyType] || data.propertyType} />
        <Row label="Media Files" value={`${data.mediaFiles.length} file(s)`} />
      </SummarySection>

      <SummarySection title="HMO Details" defaultOpen={false}>
        <Row label="Licensed" value={data.statusLicensed ? "Yes" : "No"} />
        <Row label="Tenanted" value={data.statusTenanted ? "Yes" : "No"} />
        <Row label="Needs Refurb" value={data.statusNeedsRefurb ? `Yes — £${data.refurbCost.toLocaleString()} (${data.refurbIsQuoted ? "Quoted" : "Estimated"})` : "No"} />
        <Row label="Furnished" value={data.furnished === "furnished" ? `Yes — ${LABEL_MAP[data.furnishQuality] || data.furnishOtherExplain || ""}` : LABEL_MAP[data.furnished] || data.furnished} />
        <Row label="Living Room" value={data.hasLivingRoom === true ? "Yes" : data.hasLivingRoom === false ? "No" : "Other"} />
        <Row label="Parking" value={data.hasParking === true ? `Yes (${data.parkingSpaces} spaces)` : data.hasParking === false ? "No" : data.parkingOtherExplain || "Other"} />
        <Row label="Garden" value={data.hasGarden === true ? "Yes" : data.hasGarden === false ? "No" : data.gardenOtherExplain || "Other"} />
        {data.rooms.map((r, i) => (
          <Row key={r.id} label={`Room ${i + 1}`} value={`${r.type === "Other" ? r.customType : r.type} — £${r.monthlyRent.toLocaleString()}/mo`} />
        ))}
      </SummarySection>

      <SummarySection title="Rent Terms & Running Costs" defaultOpen={false}>
        <Row label="Rent to Landlord" value={`£${data.rentToLandlord.toLocaleString()}/mo`} />
        <Row label="Deposit" value={`£${data.deposit.toLocaleString()}`} />
        <Row label="Contract" value={`${data.contractLength} ${data.contractLengthUnit}, review after ${data.reviewAfter} ${data.reviewAfterUnit}`} />
        <Row label="Reference" value={data.referenceType === "other" ? data.referenceOtherExplain : LABEL_MAP[data.referenceType] || data.referenceType} />
        <Row label="Finder Fee" value={`£${data.finderFee.toLocaleString()}`} />
        <Row label="Co-Source" value={data.happyToCoSource ? "Yes" : "No"} />
        <Row label="Running Costs" value={runningCostsList.length ? runningCostsList.join(", ") : "None"} />
        <Row label="Total Running Cost" value={`£${totalRunningCost.toLocaleString()}/mo`} />
      </SummarySection>

      {/* Management + Notes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-white/[0.06] rounded-lg">
          <span className="text-xs font-bold text-[var(--text-primary)]">Management Available</span>
          <button
            type="button"
            onClick={() => onChange({ managementAvailable: !data.managementAvailable })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${data.managementAvailable ? "bg-[var(--accent)]" : "bg-white/[0.08]"}`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${data.managementAvailable ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Additional Notes <span className="text-slate-600">(optional)</span></label>
          <Textarea
            placeholder="Any additional information for potential investors..."
            value={data.additionalNotes}
            onChange={(e) => onChange({ additionalNotes: e.target.value })}
            rows={3}
            className="bg-slate-900/50 border-white/[0.08]"
          />
        </div>
      </div>

      {/* Submit Actions */}
      <div className="border-t border-white/[0.06] pt-4 flex flex-col sm:flex-row justify-end gap-3">
        <Button
          variant="outline"
          onClick={onSaveDraft}
          disabled={submitting}
          className="border-white/[0.08] text-[var(--text-primary)] hover:bg-white/[0.02]"
        >
          Save as Draft
        </Button>
        <Button
          onClick={onSubmit}
          disabled={submitting}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold"
        >
          {submitting ? "Submitting..." : "Submit for Review"}
        </Button>
      </div>
    </div>
  )
}
