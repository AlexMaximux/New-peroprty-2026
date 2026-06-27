'use client';

import { useMemo } from 'react';
import {
  calcSaSummary,
  calcBillItemsTotal,
} from '@propvest/shared';
import { formatGBP, formatPercent, cn } from '@/lib/utils';

interface Props {
  saDetails: { bedrooms: number; bathrooms: number; accommodates: number };
  rentTerm: { rentToLandlordPence: number; depositPence: number; finderFeePence: number; bills: Array<{ label: string; amountPence: number }>; cleaningPence: number; managementEnabled: boolean; managementRatePercent: number };
  saRevenue: { nightlyRatePence: number; occupancyRate: number; bookingFeePence: number; maintenanceRate: number; otherCostsPence: number };
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function SaSummarySection({ saDetails, rentTerm, saRevenue, onConfirm, onBack, isSubmitting }: Props) {
  const summary = useMemo(() => calcSaSummary({
    nightlyRatePence: saRevenue.nightlyRatePence,
    occupancyRate: saRevenue.occupancyRate,
    rentToLandlordPence: rentTerm.rentToLandlordPence,
    billsTotalPence: calcBillItemsTotal(rentTerm.bills),
    bookingFeePence: saRevenue.bookingFeePence,
    maintenanceRate: saRevenue.maintenanceRate ?? 0.05,
    managementCostPence: rentTerm.managementEnabled
      ? Math.round(rentTerm.rentToLandlordPence * (rentTerm.managementRatePercent / 100))
      : 0,
    cleaningPence: rentTerm.cleaningPence,
    otherCostsPence: saRevenue.otherCostsPence,
    depositPence: rentTerm.depositPence,
    finderFeePence: rentTerm.finderFeePence,
    legalFeesPence: 0,
  }), [saDetails, rentTerm, saRevenue]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">SA Summary</h2>

      {/* Property */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Property</p>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <span className="text-slate-400">Bedrooms</span><span className="text-right">{saDetails.bedrooms}</span>
          <span className="text-slate-400">Bathrooms</span><span className="text-right">{saDetails.bathrooms}</span>
          <span className="text-slate-400">Max Guests</span><span className="text-right">{saDetails.accommodates}</span>
        </div>
      </div>

      {/* Money needed in */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Money Needed to Get In</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Deposit</span><span>{formatGBP(rentTerm.depositPence)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">1 Month Rent Advance</span><span>{formatGBP(rentTerm.rentToLandlordPence)}</span></div>
          {rentTerm.finderFeePence > 0 && <div className="flex justify-between"><span className="text-slate-400">Finder Fee</span><span>{formatGBP(rentTerm.finderFeePence)}</span></div>}
          <div className="flex justify-between font-medium pt-2 border-t border-deep-600">
            <span>Total Upfront</span>
            <span className="text-gold-400">{formatGBP(summary.moneyNeededInPence)}</span>
          </div>
        </div>
      </div>

      {/* Income */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Income</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Monthly Revenue</span><span className="font-medium">{formatGBP(summary.monthlyIncomePence)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Yearly Revenue</span><span className="font-medium">{formatGBP(summary.yearlyIncomePence)}</span></div>
        </div>
      </div>

      {/* Monthly costs breakdown */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Monthly Costs</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">− Rent to Landlord</span><span>{formatGBP(rentTerm.rentToLandlordPence)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">− Bills</span><span>{formatGBP(calcBillItemsTotal(rentTerm.bills))}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">− Booking Fee</span><span>{formatGBP(saRevenue.bookingFeePence)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">− Maintenance ({(saRevenue.maintenanceRate ?? 0.05) * 100}% of revenue)</span><span>{formatGBP(summary.maintenancePence)}</span></div>
          {rentTerm.managementEnabled && <div className="flex justify-between"><span className="text-slate-400">− Management ({rentTerm.managementRatePercent}%)</span><span>{formatGBP(Math.round(rentTerm.rentToLandlordPence * (rentTerm.managementRatePercent / 100)))}</span></div>}
          {rentTerm.cleaningPence > 0 && <div className="flex justify-between"><span className="text-slate-400">− Cleaning</span><span>{formatGBP(rentTerm.cleaningPence)}</span></div>}
          <div className="flex justify-between"><span className="text-slate-400">− Other Costs</span><span>{formatGBP(saRevenue.otherCostsPence)}</span></div>
          <div className="flex justify-between font-medium pt-2 border-t border-deep-600">
            <span>Total Monthly Costs</span>
            <span>{formatGBP(summary.totalMonthlyCostsPence)}</span>
          </div>
        </div>
      </div>

      {/* Profit */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Profit</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Monthly Profit</span>
            <span className={cn('text-lg font-semibold', summary.monthlyProfitPence >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {formatGBP(summary.monthlyProfitPence)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Yearly Profit</span>
            <span className={summary.yearlyProfitPence >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {formatGBP(summary.yearlyProfitPence)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Break-even Occupancy</span>
            <span>{formatPercent(summary.breakEvenOccupancy)}</span>
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
            <span className="text-sm text-slate-400">Ongoing ROI</span>
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
