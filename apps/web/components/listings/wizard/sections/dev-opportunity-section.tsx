'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { devOpportunitySectionSchema } from '@propvest/shared';

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

export default function DevOpportunitySection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(devOpportunitySectionSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      costOfDevelopmentPence: penceToPounds(initialData.costOfDevelopmentPence),
      estimateAmountPence: penceToPounds(initialData.estimateAmountPence),
    } : {
      costOfDevelopmentPence: '',
      builderInPlace: false,
      quoteAvailable: undefined,
      estimateAmountPence: '',
      legalCostsPence: '',
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, watch, formState: { errors, isValid } } = form;
  const builderInPlace = watch('builderInPlace');

  const onSubmit = (raw: any) => {
    const data: any = {
      ...raw,
      costOfDevelopmentPence: poundsToPence(raw.costOfDevelopmentPence),
      estimateAmountPence: poundsToPence(raw.estimateAmountPence),
      legalCostsPence: poundsToPence(raw.legalCostsPence),
    };
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">Development Opportunity</h2>

      <div className="glass-card p-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Cost of Development (£) *</label>
          <input type="number" min={0} step={0.01} {...register('costOfDevelopmentPence', { valueAsNumber: true })}
            className="input-field w-full max-w-[200px]" placeholder="150000" />
          {errors.costOfDevelopmentPence && <p className="text-red-400 text-xs mt-1">{String(errors.costOfDevelopmentPence.message ?? '')}</p>}
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="builder-toggle" {...register('builderInPlace')}
            className="h-4 w-4 rounded border-deep-500 bg-deep-700 text-gold-500" />
          <label htmlFor="builder-toggle" className="text-sm text-slate-300">Builder in place</label>
        </div>

        {builderInPlace && (
          <div className="space-y-3 pl-6 border-l-2 border-deep-600">
            <div className="flex items-center gap-3">
              <input type="checkbox" {...register('quoteAvailable')}
                className="h-4 w-4 rounded border-deep-500 bg-deep-700 text-gold-500" />
              <span className="text-sm text-slate-300">Quote available</span>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Estimate Amount (£)</label>
              <input type="number" min={0} step={0.01} {...register('estimateAmountPence', { valueAsNumber: true })}
                className="input-field w-full max-w-[200px]" placeholder="200000" />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Legal Costs (£)</label>
        <input type="number" min={0} step={0.01} {...register('legalCostsPence', { valueAsNumber: true })}
          className="input-field w-full max-w-[200px]" placeholder="5000" />
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}