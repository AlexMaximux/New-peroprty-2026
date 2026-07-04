'use client';

import { useMemo } from 'react';
import {
  calcHmoSummary,
  calcBillItemsTotal,
} from '@propvest/shared';
import { formatGBP, formatPercent, cn } from '@/lib/utils';

interface Props {
  hmoDetails: { rooms: Array<{ name: string; roomType: string; monthlyRentPence: number }> };
  rentTerm: { rentToLandlordPence: number; depositPence: number; finderFeePence: number; bills: Array<{ label: string; amountPence: number }>; cleaningPence: number; managementEnabled: boolean; managementRatePercent: number };
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function HmoSummarySection({ hmoDetails, rentTerm, onConfirm, onBack, isSubmitting }: Props) {
  const summary = useMemo(() => calcHmoSummary({
    rooms: hmoDetails.rooms,
    rentToLandlordPence: rentTerm.rentToLandlordPence,
    depositPence: rentTerm.depositPence,
    finderFeePence: rentTerm.finderFeePence,
    billsPence: calcBillItemsTotal(rentTerm.bills),
    cleaningPence: rentTerm.cleaningPence,
    managementEnabled: rentTerm.managementEnabled,
    managementRatePercent: rentTerm.managementRatePercent,
    legalFeesPence: 0,
  }), [hmoDetails, rentTerm]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">HMO Summary</h2>

      {/* Rooms */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
          {hmoDetails.rooms.length} Room(s)
        </p>
        <div className="space-y-1">
          {hmoDetails.rooms.map((r, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{r.name}</span>
              <span className="text-slate-300">{formatGBP(r.monthlyRentPence)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 pt-2 border-t border-deep-600">
          <span className="font-medium">Gross Monthly Income</span>
          <span className="gradient-text font-semibold">{formatGBP(summary.grossMonthlyIncomePence)}</span>
        </div>
      </div>

      {/* Money needed in */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Money Needed to Get In</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Deposit</span><span>{formatGBP(rentTerm.depositPence)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">1 Month Rent in Advance</span><span>{formatGBP(rentTerm.rentToLandlordPence)}</span></div>
          {rentTerm.finderFeePence > 0 && (
            <div className="flex justify-between"><span className="text-slate-400">Finder Fee</span><span>{formatGBP(rentTerm.finderFeePence)}</span></div>
          )}
          <div className="flex justify-between font-medium pt-2 border-t border-deep-600">
            <span>Total Upfront</span>
            <span className="text-gold-400">{formatGBP(summary.moneyNeededInPence)}</span>
          </div>
        </div>
      </div>

      {/* Monthly costs */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Monthly Costs</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">− Rent to Landlord</span><span>{formatGBP(rentTerm.rentToLandlordPence)}</span></div>
          {rentTerm.managementEnabled && (
            <div className="flex justify-between"><span className="text-slate-400">− Management ({rentTerm.managementRatePercent}%)</span><span>{formatGBP(summary.managementFeePence)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-slate-400">− Bills</span><span>{formatGBP(calcBillItemsTotal(rentTerm.bills))}</span></div>
          {rentTerm.cleaningPence > 0 && (
            <div className="flex justify-between"><span className="text-slate-400">− Cleaning</span><span>{formatGBP(rentTerm.cleaningPence)}</span></div>
          )}
          {summary.finderMonthlyAmortisedPence > 0 && (
            <div className="flex justify-between"><span className="text-slate-400">− Finder Fee ÷ 12</span><span>{formatGBP(summary.finderMonthlyAmortisedPence)}</span></div>
          )}
        </div>
      </div>

      {/* Profit */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Profit</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Monthly Profit (Year 1)</span>
            <span className={cn('text-lg font-semibold', summary.year1MonthlyProfitPence >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {formatGBP(summary.year1MonthlyProfitPence)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Year-1 Annual Profit</span>
            <span className={summary.year1AnnualProfitPence >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {formatGBP(summary.year1AnnualProfitPence)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Ongoing Annual Profit (Year 2+)</span>
            <span className="text-emerald-400">{formatGBP(summary.ongoingAnnualProfitPence)}</span>
          </div>
        </div>
      </div>

      {/* ROI */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Return on Investment</p>
        <div className="space-y-2">
          {rentTerm.finderFeePence > 0 && (
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-400">Year-1 ROI</span>
              <span className="text-lg font-bold gradient-text">{formatPercent(summary.year1Roi)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-400">Ongoing ROI (Year 2+)</span>
            <span className="text-lg font-bold gradient-text">{formatPercent(summary.ongoingRoi)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} disabled={isSubmitting} className="btn-secondary disabled:opacity-30">Back</button>
        <button type="button" onClick={onConfirm} disabled={isSubmitting}
          className="btn-primary disabled:opacity-50">
          {isSubmitting ? 'Publishing...' : 'Publish Listing'}
        </button>
      </div>
    </div>
  );
}
