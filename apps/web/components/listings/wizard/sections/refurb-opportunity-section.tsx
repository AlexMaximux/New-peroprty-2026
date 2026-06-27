'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { refurbOpportunitySectionSchema } from '@propvest/shared';

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

export default function RefurbOpportunitySection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(refurbOpportunitySectionSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      costToRefurbishPence: penceToPounds(initialData.costToRefurbishPence),
      potentialAddValuePence: penceToPounds(initialData.potentialAddValuePence),
    } : {
      costToRefurbishPence: '',
      potentialAddValuePence: '',
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, formState: { errors, isValid } } = form;

  const onSubmit = (raw: any) => {
    const data: any = {
      ...raw,
      costToRefurbishPence: poundsToPence(raw.costToRefurbishPence),
      potentialAddValuePence: poundsToPence(raw.potentialAddValuePence),
    };
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">Refurbishment Opportunity</h2>

      <div className="glass-card p-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Cost to Refurbish (£) *</label>
          <input type="number" min={0} step={0.01} {...register('costToRefurbishPence', { valueAsNumber: true })}
            className="input-field w-full max-w-[200px]" placeholder="35000" />
          {errors.costToRefurbishPence && <p className="text-red-400 text-xs mt-1">{String(errors.costToRefurbishPence.message ?? '')}</p>}
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Potential Add-Value (£)</label>
          <input type="number" min={0} step={0.01} {...register('potentialAddValuePence', { valueAsNumber: true })}
            className="input-field w-full max-w-[200px]" placeholder="25000" />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}