'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saRevenueSectionSchema } from '@propvest/shared';
import { calcSaMonthlyIncome, calcSaYearlyIncome } from '@propvest/shared';
import { poundsToPence, percentToDecimal, penceToPounds, decimalToPercent } from '@propvest/shared';
import { formatGBP } from '@/lib/utils';

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function SaIncomeSection({ initialData, onNext, onBack }: Props) {
  // Convert stored pence/fraction → human units (£, %) for form display
  const toFormDefaults = (d: any) => ({
    ...d,
    nightlyRatePence: penceToPounds(d.nightlyRatePence),
    occupancyRate: decimalToPercent(d.occupancyRate),
    bookingFeePence: penceToPounds(d.bookingFeePence),
    maintenanceRate: decimalToPercent(d.maintenanceRate),
    otherCostsPence: penceToPounds(d.otherCostsPence),
  });

  const form = useForm<any>({
    resolver: zodResolver(saRevenueSectionSchema) as any,
    defaultValues: initialData ? toFormDefaults(initialData) : {
      nightlyRatePence: 100,
      occupancyRate: 70,
      bookingFeePence: 0,
      maintenanceRate: 5,
      otherCostsPence: 0,
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, watch, formState: { errors, isValid } } = form;

  // Live projection — convert human units to pence/fraction for calc functions
  const nightlyPence = poundsToPence(watch('nightlyRatePence'));
  const occDecimal = percentToDecimal(watch('occupancyRate'));
  const monthlyIncome = calcSaMonthlyIncome(occDecimal, nightlyPence);
  const yearlyIncome = calcSaYearlyIncome(occDecimal, nightlyPence);

  const onSubmit = (raw: any) => {
    // Convert human units (£, %) → stored pence (×100) / decimal (÷100)
    const data = {
      ...raw,
      nightlyRatePence: poundsToPence(raw.nightlyRatePence),
      occupancyRate: percentToDecimal(raw.occupancyRate),
      bookingFeePence: poundsToPence(raw.bookingFeePence),
      maintenanceRate: percentToDecimal(raw.maintenanceRate),
      otherCostsPence: poundsToPence(raw.otherCostsPence),
    };
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">SA Revenue & Income</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Rent per Night (£) *</label>
          <input type="number" min={0} step={0.01} {...register('nightlyRatePence', { valueAsNumber: true })}
            className="input-field w-full" placeholder="100" />
          {errors.nightlyRatePence && <p className="text-red-400 text-xs mt-1">{String(errors.nightlyRatePence.message??'')}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Occupancy (%) *</label>
          <div className="flex gap-2 items-center">
            <input type="number" min={1} max={100} {...register('occupancyRate', { valueAsNumber: true })}
              className="input-field w-full" placeholder="70" />
            <span className="text-slate-400">%</span>
          </div>
          {errors.occupancyRate && <p className="text-red-400 text-xs mt-1">{String(errors.occupancyRate.message??'')}</p>}
        </div>
      </div>

      {/* Live projection */}
      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Live Projection</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-slate-400">Monthly Income</p>
            <p className="text-lg font-semibold gradient-text">{formatGBP(monthlyIncome)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Yearly Income</p>
            <p className="text-lg font-semibold gradient-text">{formatGBP(yearlyIncome)}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-300">Additional Costs</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Booking Fee (£/mo)</label>
            <input type="number" min={0} step={0.01} {...register('bookingFeePence', { valueAsNumber: true })} className="input-field w-full" placeholder="200" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Other Costs (£/mo)</label>
            <input type="number" min={0} step={0.01} {...register('otherCostsPence', { valueAsNumber: true })} className="input-field w-full" placeholder="100" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Maintenance (% of revenue, default 5%)</label>
          <input type="number" min={0} max={100} step={0.1} {...register('maintenanceRate', { valueAsNumber: true })}
            className="input-field w-full max-w-[200px]" placeholder="5" />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}
