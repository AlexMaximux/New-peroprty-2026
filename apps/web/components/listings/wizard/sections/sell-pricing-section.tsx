'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sellPricingSectionSchema } from '@propvest/shared';

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

export default function SellPricingSection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(sellPricingSectionSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      askingPricePence: penceToPounds(initialData.askingPricePence),
      marketValuePence: penceToPounds(initialData.marketValuePence),
      estimatedValuePence: penceToPounds(initialData.estimatedValuePence),
      existingRentPence: penceToPounds(initialData.existingRentPence),
      potentialRentPence: penceToPounds(initialData.potentialRentPence),
    } : {
      askingPricePence: 0,
      marketValuePence: '',
      estimatedValuePence: '',
      propertySize: '',
      existingRentPence: '',
      potentialRentPence: '',
      ricsType: '',
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, formState: { errors, isValid } } = form;

  const onSubmit = (raw: any) => {
    const data: any = {
      ...raw,
      askingPricePence: poundsToPence(raw.askingPricePence),
      marketValuePence: poundsToPence(raw.marketValuePence),
      estimatedValuePence: poundsToPence(raw.estimatedValuePence),
      existingRentPence: poundsToPence(raw.existingRentPence),
      potentialRentPence: poundsToPence(raw.potentialRentPence),
    };
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">Pricing</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Asking Price (£) *</label>
          <input type="number" min={0} step={0.01} {...register('askingPricePence', { valueAsNumber: true })}
            className="input-field w-full" placeholder="300000" />
          {errors.askingPricePence && <p className="text-red-400 text-xs mt-1">{String(errors.askingPricePence.message ?? '')}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Market Value (£)</label>
          <input type="number" min={0} step={0.01} {...register('marketValuePence', { valueAsNumber: true })}
            className="input-field w-full" placeholder="250000" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Estimated Value (£)</label>
          <input type="number" min={0} step={0.01} {...register('estimatedValuePence', { valueAsNumber: true })}
            className="input-field w-full" placeholder="275000" />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Property Size</label>
          <input {...register('propertySize')} className="input-field w-full" placeholder="e.g. 1,200 sq ft" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Existing Rent (£/mo)</label>
          <input type="number" min={0} step={0.01} {...register('existingRentPence', { valueAsNumber: true })}
            className="input-field w-full" placeholder="1000" />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Potential Rent (£/mo)</label>
          <input type="number" min={0} step={0.01} {...register('potentialRentPence', { valueAsNumber: true })}
            className="input-field w-full" placeholder="1500" />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">RICS Valuation Type</label>
        <input {...register('ricsType')} className="input-field w-full max-w-[400px]" placeholder="e.g. Red Book valuation" />
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}
