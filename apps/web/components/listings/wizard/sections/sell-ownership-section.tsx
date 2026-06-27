'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sellOwnershipSectionSchema } from '@propvest/shared';

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function SellOwnershipSection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(sellOwnershipSectionSchema) as any,
    defaultValues: initialData ?? {
      ownershipType: 'FREEHOLD',
      leaseExpiryDate: '',
      currentRentPence: '',
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, watch, formState: { errors, isValid } } = form;
  const ownershipType = watch('ownershipType');

  const onSubmit = (raw: any) => {
    const data: any = {
      ...raw,
      currentRentPence: raw.currentRentPence && raw.currentRentPence !== '' ? Math.round(Number(raw.currentRentPence) * 100) : undefined,
    };
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">Ownership & Legal</h2>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Ownership Type *</label>
        <select {...register('ownershipType')} className="input-field w-full max-w-[300px]">
          <option value="FREEHOLD">Freehold</option>
          <option value="LEASEHOLD">Leasehold</option>
        </select>
      </div>

      {ownershipType === 'LEASEHOLD' && (
        <div>
          <label className="block text-sm text-slate-300 mb-1">Lease Expiry Date *</label>
          <input {...register('leaseExpiryDate')} className="input-field w-full max-w-[300px]" placeholder="e.g. 2085 or 85 years remaining" />
          {errors.leaseExpiryDate && <p className="text-red-400 text-xs mt-1">{String(errors.leaseExpiryDate.message ?? '')}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm text-slate-300 mb-1">Current Rent (£/mo)</label>
        <input type="number" min={0} {...register('currentRentPence', { valueAsNumber: true })} className="input-field w-full max-w-[200px]" placeholder="1000" />
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}
