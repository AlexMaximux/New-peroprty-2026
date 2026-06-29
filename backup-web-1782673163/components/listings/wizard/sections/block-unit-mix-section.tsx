'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { blockUnitMixSectionSchema } from '@propvest/shared';

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function BlockUnitMixSection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(blockUnitMixSectionSchema) as any,
    defaultValues: initialData ?? {
      totalUnits: 2,
      unitMix: { oneBedCount: 0, twoBedCount: 0, threeBedCount: 0, hmoUnitCount: 0 },
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, watch, formState: { errors, isValid } } = form;
  const total = watch('totalUnits');
  const unitMix = watch('unitMix');

  const sum = (unitMix?.oneBedCount ?? 0) + (unitMix?.twoBedCount ?? 0) + (unitMix?.threeBedCount ?? 0) + (unitMix?.hmoUnitCount ?? 0);
  const match = sum === total;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <h2 className="text-xl font-semibold">Unit Mix</h2>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Total Number of Units *</label>
        <input type="number" min={1} {...register('totalUnits', { valueAsNumber: true })}
          className="input-field w-full max-w-[200px]" placeholder="5" />
        {errors.totalUnits && <p className="text-red-400 text-xs mt-1">{String(errors.totalUnits.message??'')}</p>}
      </div>

      <div className="glass-card p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-300">Unit Type Counts</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">1-Bed</label>
            <input type="number" min={0} {...register('unitMix.oneBedCount', { valueAsNumber: true })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">2-Bed</label>
            <input type="number" min={0} {...register('unitMix.twoBedCount', { valueAsNumber: true })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">3-Bed</label>
            <input type="number" min={0} {...register('unitMix.threeBedCount', { valueAsNumber: true })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">HMO Units</label>
            <input type="number" min={0} {...register('unitMix.hmoUnitCount', { valueAsNumber: true })} className="input-field w-full" />
          </div>
        </div>
        {!match && total > 0 && (
          <p className="text-amber-400 text-xs">Counts ({sum}) must match total units ({total})</p>
        )}
        {errors.unitMix && <p className="text-red-400 text-xs">{String(errors.unitMix.message??'')}</p>}
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid || !match} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}
