'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sellCostToBuySectionSchema } from '@propvest/shared';

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

function poundsToPence(v: number | undefined | null): number {
  return v != null ? Math.round(v * 100) : 0;
}
function penceToPounds(v: number | undefined | null): number {
  return v != null ? Math.round(v / 100) : 0;
}

export default function SellCostToBuySection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(sellCostToBuySectionSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      depositPence: penceToPounds(initialData.depositPence),
      stampDutyPence: penceToPounds(initialData.stampDutyPence),
      finderFeePence: penceToPounds(initialData.finderFeePence),
      legalFeesPence: penceToPounds(initialData.legalFeesPence),
      otherAcquisitionCostsPence: penceToPounds(initialData.otherAcquisitionCostsPence),
    } : {
      depositPence: 0,
      stampDutyPence: '',
      finderFeePence: '',
      legalFeesPence: '',
      otherAcquisitionCostsPence: '',
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, formState: { errors, isValid } } = form;

  const onSubmit = (raw: any) => {
    const data: any = {
      ...raw,
      depositPence: poundsToPence(raw.depositPence),
      stampDutyPence: poundsToPence(raw.stampDutyPence),
      finderFeePence: poundsToPence(raw.finderFeePence),
      legalFeesPence: poundsToPence(raw.legalFeesPence),
      otherAcquisitionCostsPence: poundsToPence(raw.otherAcquisitionCostsPence),
    };
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">Cost to Buy</h2>

      <div className="glass-card p-4 space-y-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider">Acquisition Costs</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Deposit (£) *</label>
            <input type="number" min={0} step={0.01} {...register('depositPence', { valueAsNumber: true })}
              className="input-field w-full" placeholder="75000" />
            {errors.depositPence && <p className="text-red-400 text-xs mt-1">{String(errors.depositPence.message ?? '')}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Stamp Duty (£)</label>
            <input type="number" min={0} step={0.01} {...register('stampDutyPence', { valueAsNumber: true })}
              className="input-field w-full" placeholder="15000" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Finder Fee (£)</label>
            <input type="number" min={0} step={0.01} {...register('finderFeePence', { valueAsNumber: true })}
              className="input-field w-full" placeholder="500" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Legal Fees (£)</label>
            <input type="number" min={0} step={0.01} {...register('legalFeesPence', { valueAsNumber: true })}
              className="input-field w-full" placeholder="3000" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Other Acquisition Costs (£)</label>
          <input type="number" min={0} step={0.01} {...register('otherAcquisitionCostsPence', { valueAsNumber: true })}
            className="input-field w-full max-w-[200px]" placeholder="1000" />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}
