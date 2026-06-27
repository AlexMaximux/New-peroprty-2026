'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { commercialShopSectionSchema } from '@propvest/shared';

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function CommercialShopSection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(commercialShopSectionSchema) as any,
    defaultValues: initialData ?? { floorArea: '', annualRentPence: '', leaseYears: '', notes: '' },
    mode: 'onChange',
  });

  const { register, handleSubmit, formState: { isValid } } = form;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <h2 className="text-xl font-semibold">Shop Details</h2>

      <div className="glass-card p-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Floor Area (sq ft)</label>
          <input {...register('floorArea')} className="input-field w-full" placeholder="1200" />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Annual Rent (£)</label>
          <input type="number" min={0} step={0.01} {...register('annualRentPence', { valueAsNumber: true })}
            className="input-field w-full max-w-[200px]" placeholder="24000" />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Lease Years</label>
          <input type="number" min={1} {...register('leaseYears', { valueAsNumber: true })}
            className="input-field w-full max-w-[150px]" placeholder="9" />
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
