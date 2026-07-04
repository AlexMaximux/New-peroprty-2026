"use client"

import * as React from "react"
import { Banknote } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { HmoFormData } from "../wizard-types"

interface Props {
  data: HmoFormData
  onChange: (patch: Partial<HmoFormData>) => void
}

export function RentTermsStep({ data, onChange }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Banknote className="w-5 h-5 text-[var(--accent)]" />
          Rent Terms
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">Specify the financial terms and conditions</p>
      </div>

      {/* Rent to Landlord + Deposit */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Rent to Landlord (£/month)</label>
          <Input
            type="number"
            placeholder="e.g. 1200"
            value={data.rentToLandlord || ""}
            onChange={(e) => onChange({ rentToLandlord: parseInt(e.target.value) || 0 })}
            className="bg-slate-900/50 border-white/[0.08]"
            min={0}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Deposit (£)</label>
          <Input
            type="number"
            placeholder="e.g. 3600"
            value={data.deposit || ""}
            onChange={(e) => onChange({ deposit: parseInt(e.target.value) || 0 })}
            className="bg-slate-900/50 border-white/[0.08]"
            min={0}
          />
        </div>
      </div>

      {/* Contract Length + Review Period */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Contract Length</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="3"
              value={data.contractLength || ""}
              onChange={(e) => onChange({ contractLength: parseInt(e.target.value) || 1 })}
              className="bg-slate-900/50 border-white/[0.08] flex-1"
              min={1}
            />
            <Select value={data.contractLengthUnit} onValueChange={(v) => onChange({ contractLengthUnit: v as any })}>
              <SelectTrigger className="w-28 bg-slate-900/50 border-white/[0.08]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="years">Years</SelectItem>
                <SelectItem value="months">Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Review After</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="1"
              value={data.reviewAfter || ""}
              onChange={(e) => onChange({ reviewAfter: parseInt(e.target.value) || 1 })}
              className="bg-slate-900/50 border-white/[0.08] flex-1"
              min={1}
            />
            <Select value={data.reviewAfterUnit} onValueChange={(v) => onChange({ reviewAfterUnit: v as any })}>
              <SelectTrigger className="w-28 bg-slate-900/50 border-white/[0.08]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="years">Years</SelectItem>
                <SelectItem value="months">Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Reference Type */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Reference Type</label>
        <Select value={data.referenceType} onValueChange={(v) => onChange({ referenceType: v as any })}>
          <SelectTrigger className="bg-slate-900/50 border-white/[0.08]"><SelectValue placeholder="Select reference type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ltd">LTD Contract</SelectItem>
            <SelectItem value="easy">Easy Reference</SelectItem>
            <SelectItem value="full">Full Reference</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {data.referenceType === "other" && (
        <Input
          placeholder="Describe reference requirements"
          value={data.referenceOtherExplain}
          onChange={(e) => onChange({ referenceOtherExplain: e.target.value })}
          className="bg-slate-900/50 border-white/[0.08]"
        />
      )}

      {/* Finder Fee + Co-Source */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Finder Fee (£)</label>
          <Input
            type="number"
            placeholder="e.g. 2500"
            value={data.finderFee || ""}
            onChange={(e) => onChange({ finderFee: parseInt(e.target.value) || 0 })}
            className="bg-slate-900/50 border-white/[0.08]"
            min={0}
          />
        </div>
        <div className="flex items-end pb-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="co-source"
              checked={data.happyToCoSource}
              onCheckedChange={(checked: boolean) => onChange({ happyToCoSource: !!checked })}
            />
            <label htmlFor="co-source" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
              Happy to co-source
            </label>
          </div>
        </div>
      </div>

      {/* Running Costs */}
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Running Costs (Paid by Deal Buyer Monthly)</label>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Tick the running costs that apply and enter the monthly amount.</p>
        </div>

        <div className="space-y-3 bg-slate-900/20 border border-white/[0.06] rounded-xl p-4">
          {/* Utility */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="runUtility"
                checked={data.runUtilityTicked}
                onCheckedChange={(checked: boolean) => onChange({ runUtilityTicked: !!checked })}
              />
              <label htmlFor="runUtility" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">Utility</label>
            </div>
            {data.runUtilityTicked && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--text-muted)]">£</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={data.runUtilityCost || ""}
                  onChange={(e) => onChange({ runUtilityCost: parseInt(e.target.value) || 0 })}
                  className="w-24 text-right bg-slate-900/50 border-white/[0.08] h-8 text-xs font-mono"
                  min={0}
                />
                <span className="text-[10px] text-[var(--text-muted)]">/mo</span>
              </div>
            )}
          </div>

          {/* Council Tax */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="runCouncilTax"
                checked={data.runCouncilTaxTicked}
                onCheckedChange={(checked: boolean) => onChange({ runCouncilTaxTicked: !!checked })}
              />
              <label htmlFor="runCouncilTax" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">Council Tax</label>
            </div>
            {data.runCouncilTaxTicked && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--text-muted)]">£</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={data.runCouncilTaxCost || ""}
                  onChange={(e) => onChange({ runCouncilTaxCost: parseInt(e.target.value) || 0 })}
                  className="w-24 text-right bg-slate-900/50 border-white/[0.08] h-8 text-xs font-mono"
                  min={0}
                />
                <span className="text-[10px] text-[var(--text-muted)]">/mo</span>
              </div>
            )}
          </div>

          {/* Cleaning */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="runCleaning"
                checked={data.runCleaningTicked}
                onCheckedChange={(checked: boolean) => onChange({ runCleaningTicked: !!checked })}
              />
              <label htmlFor="runCleaning" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">Cleaning</label>
            </div>
            {data.runCleaningTicked && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--text-muted)]">£</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={data.runCleaningCost || ""}
                  onChange={(e) => onChange({ runCleaningCost: parseInt(e.target.value) || 0 })}
                  className="w-24 text-right bg-slate-900/50 border-white/[0.08] h-8 text-xs font-mono"
                  min={0}
                />
                <span className="text-[10px] text-[var(--text-muted)]">/mo</span>
              </div>
            )}
          </div>

          {/* Finder Fee (Amortized) */}
          <div className="flex items-center justify-between gap-4 border-t border-white/[0.04] pt-2">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Finder Fee (Amortized /12)</span>
            <span className="text-xs font-mono text-[var(--text-primary)]">
              £{Math.round(data.finderFee / 12)}<span className="text-[10px] text-[var(--text-muted)]">/mo</span>
            </span>
          </div>

          {/* Others */}
          <div className="flex flex-col gap-2 border-t border-white/[0.04] pt-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="runOther"
                  checked={data.runOtherTicked}
                  onCheckedChange={(checked: boolean) => onChange({ runOtherTicked: !!checked })}
                />
                <label htmlFor="runOther" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">Others</label>
              </div>
              {data.runOtherTicked && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--text-muted)]">£</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={data.runOtherCost || ""}
                    onChange={(e) => onChange({ runOtherCost: parseInt(e.target.value) || 0 })}
                    className="w-24 text-right bg-slate-900/50 border-white/[0.08] h-8 text-xs font-mono"
                    min={0}
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">/mo</span>
                </div>
              )}
            </div>
            {data.runOtherTicked && (
              <Input
                placeholder="Explain other costs"
                value={data.runOtherExplain}
                onChange={(e) => onChange({ runOtherExplain: e.target.value })}
                className="bg-slate-900/50 border-white/[0.08] text-xs h-8"
              />
            )}
          </div>
        </div>

        {/* Total Sum Box */}
        <div className="bg-[var(--accent-subtle)] border border-[var(--accent-border)] rounded-xl p-4 flex justify-between items-center">
          <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">Total Monthly Running Cost</span>
          <span className="text-lg font-mono tabular-nums text-[var(--accent)] font-bold">
            £{(
              (data.runUtilityTicked ? data.runUtilityCost : 0) +
              (data.runCouncilTaxTicked ? data.runCouncilTaxCost : 0) +
              (data.runCleaningTicked ? data.runCleaningCost : 0) +
              Math.round(data.finderFee / 12) +
              (data.runOtherTicked ? data.runOtherCost : 0)
            ).toLocaleString()}/mo
          </span>
        </div>
      </div>
    </div>
  )
}
