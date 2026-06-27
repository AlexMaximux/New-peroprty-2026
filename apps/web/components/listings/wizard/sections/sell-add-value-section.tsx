'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sellAddValueSectionSchema } from '@propvest/shared';

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

const ADD_VALUE_OPTIONS = [
  { value: 'REFURB', label: 'Refurbishment' },
  { value: 'FULL_REFURB', label: 'Full Refurbishment' },
  { value: 'EXTENSION', label: 'Extension' },
  { value: 'LOFT_CONVERSION', label: 'Loft / Roof Conversion' },
  { value: 'HMO_CONVERSION', label: 'Convert to HMO' },
  { value: 'FLAT_CONVERSION', label: 'Convert to Flats' },
  { value: 'ADD_BEDROOM', label: 'Add Bedroom' },
  { value: 'OTHER', label: 'Other' },
] as const;

export default function SellAddValueSection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(sellAddValueSectionSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      refurbCostPence: penceToPounds(initialData.refurbCostPence),
      developmentCostPence: penceToPounds(initialData.developmentCostPence),
      estimateAmountPence: penceToPounds(initialData.estimateAmountPence),
    } : {
      addValueOptions: [],
      refurbCostPence: '',
      developmentCostPence: '',
      builderInPlace: false,
      quoteAvailable: undefined,
      estimateAmountPence: '',
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, watch, formState: { errors, isValid } } = form;
  const builderInPlace = watch('builderInPlace');
  const selectedOptions = watch('addValueOptions') ?? [];

  const toggleOption = (value: string) => {
    const current: string[] = form.getValues('addValueOptions') ?? [];
    if (current.includes(value)) {
      form.setValue('addValueOptions', current.filter((v) => v !== value), { shouldValidate: true });
    } else {
      form.setValue('addValueOptions', [...current, value], { shouldValidate: true });
    }
  };

  const onSubmit = (raw: any) => {
    const data: any = {
      ...raw,
      refurbCostPence: poundsToPence(raw.refurbCostPence),
      developmentCostPence: poundsToPence(raw.developmentCostPence),
      estimateAmountPence: poundsToPence(raw.estimateAmountPence),
    };
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">Add-Value Potential</h2>

      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Value-Add Options</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ADD_VALUE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedOptions.includes(opt.value)}
                onChange={() => toggleOption(opt.value)}
                className="h-4 w-4 rounded border-deep-500 bg-deep-700 text-gold-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="glass-card p-4 space-y-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider">Costs & Quotes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Refurbishment Cost (£)</label>
            <input type="number" min={0} step={0.01} {...register('refurbCostPence', { valueAsNumber: true })}
              className="input-field w-full" placeholder="50000" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Development Cost (£)</label>
            <input type="number" min={0} step={0.01} {...register('developmentCostPence', { valueAsNumber: true })}
              className="input-field w-full" placeholder="100000" />
          </div>
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
                className="input-field w-full max-w-[200px]" placeholder="50000" />
            </div>
          </div>
        )}
        {errors.quoteAvailable && <p className="text-red-400 text-xs mt-1">{String(errors.quoteAvailable.message ?? '')}</p>}
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}
