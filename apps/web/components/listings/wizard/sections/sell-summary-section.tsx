'use client';

import { useMemo } from 'react';
import {
  calcSellSummary,
} from '@propvest/shared';
import { formatGBP, formatPercent, cn } from '@/lib/utils';

interface Props {
  sellOwnership: any;
  sellPricing: any;
  sellCostToBuy: any;
  sellFinance: any;
  sellAddValue: any;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function SellSummarySection({
  sellPricing,
  sellCostToBuy,
  sellFinance,
  sellAddValue,
  onConfirm,
  onBack,
  isSubmitting,
}: Props) {
  const annualRentPence = (sellPricing?.potentialRentPence ?? sellPricing?.existingRentPence ?? 0) * 12;

  const summary = useMemo(() => calcSellSummary({
    askingPricePence: sellPricing?.askingPricePence ?? 0,
    marketValuePence: sellPricing?.marketValuePence,
    annualRentPence,
    depositPence: sellCostToBuy?.depositPence ?? 0,
    stampDutyPence: sellCostToBuy?.stampDutyPence ?? 0,
    finderFeePence: sellCostToBuy?.finderFeePence ?? 0,
    legalFeesPence: sellCostToBuy?.legalFeesPence ?? 0,
    otherAcquisitionCostsPence: sellCostToBuy?.otherAcquisitionCostsPence ?? 0,
    refurbCostPence: sellAddValue?.refurbCostPence,
    developmentCostPence: sellAddValue?.developmentCostPence,
    mortgageInterestRate: sellFinance?.mortgageInterestRate,
    potentialAddValuePence: undefined,
  }), [sellPricing, sellCostToBuy, sellFinance, sellAddValue, annualRentPence]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Sell Property — Summary</h2>

      {/* Pricing */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Pricing</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Asking Price</span><span>{formatGBP(sellPricing?.askingPricePence)}</span></div>
          {sellPricing?.potentialRentPence && (
            <div className="flex justify-between"><span className="text-slate-400">Potential Monthly Rent</span><span>{formatGBP(sellPricing.potentialRentPence)}</span></div>
          )}
          {sellPricing?.existingRentPence && (
            <div className="flex justify-between"><span className="text-slate-400">Existing Monthly Rent</span><span>{formatGBP(sellPricing.existingRentPence)}</span></div>
          )}
        </div>
      </div>

      {/* Investment */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Investment</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Total Cost to Buy</span><span>{formatGBP(summary.totalCostToBuyPence)}</span></div>
          {addValueCosts() > 0 && (
            <div className="flex justify-between"><span className="text-slate-400">+ Refurb / Development</span><span>{formatGBP(addValueCosts())}</span></div>
          )}
          <div className="flex justify-between font-medium pt-2 border-t border-deep-600">
            <span>Total Investment</span>
            <span className="text-gold-400">{formatGBP(summary.totalInvestmentPence)}</span>
          </div>
        </div>
      </div>

      {/* Mortgage */}
      {sellFinance?.mortgageInterestRate != null && (
        <div className="glass-card p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Mortgage (75% LTV)</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Rate</span><span>{formatPercent(sellFinance.mortgageInterestRate)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Monthly Mortgage Cost</span><span>{formatGBP(summary.monthlyMortgagePence)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Annual Mortgage Cost</span><span>{formatGBP(summary.annualMortgageCostPence)}</span></div>
          </div>
        </div>
      )}

      {/* Yields */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Returns</p>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-slate-400">Gross Yield</span>
            <span className={cn('text-lg font-bold', summary.grossYield >= 0.04 ? 'text-emerald-400' : 'text-gold-400')}>
              {formatPercent(summary.grossYield)}
            </span>
          </div>
          {sellFinance?.mortgageInterestRate != null && (
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-slate-400">Net Yield (after mortgage)</span>
              <span className="text-lg font-bold gradient-text">{formatPercent(summary.netYield)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Net Annual Income</span>
            <span className={summary.netAnnualIncomePence >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {formatGBP(summary.netAnnualIncomePence)}
            </span>
          </div>
          {(sellAddValue?.refurbCostPence || sellAddValue?.developmentCostPence) && (
            <>
              <div className="flex justify-between text-sm pt-2 border-t border-deep-600">
                <span className="text-slate-400">Add-Value Profit</span>
                <span className={summary.addValueProfitPence >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {formatGBP(summary.addValueProfitPence)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-slate-400">Add-Value ROI</span>
                <span className="text-lg font-bold gradient-text">{formatPercent(summary.addValueRoi)}</span>
              </div>
            </>
          )}
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

  function addValueCosts(): number {
    return (sellAddValue?.refurbCostPence ?? 0) + (sellAddValue?.developmentCostPence ?? 0);
  }
}
