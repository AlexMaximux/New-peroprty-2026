'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { commercialMixedUseSectionSchema } from '@propvest/shared';

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function CommercialMixedSection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(commercialMixedUseSectionSchema) as any,
    defaultValues: initialData ?? { residentialUnits: '', commercialUnits: '', notes: '' },
    mode: 'onChange',
  });

  const { register, handleSubmit, formState: { isValid } } = form;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <h2 className="text-xl font-semibold">Mixed Use Details</h2>

      <div className="glass-card p-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Residential Units</label>
          <input type="number" min={1} {...register('residentialUnits', { valueAsNumber: true })}
            className="input-field w-full max-w-[150px]" placeholder="3" />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Commercial Units</label>
          <input type="number" min={1} {...register('commercialUnits', { valueAsNumber: true })}
            className="input-field w-full max-w-[150px]" placeholder="2" />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Notes</label>
        <textarea {...register('notes')} rows={2}
          className="input-field w-full" placeholder="Additional details..." />
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}
