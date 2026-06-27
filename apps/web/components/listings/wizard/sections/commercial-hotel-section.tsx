'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { commercialHotelSectionSchema } from '@propvest/shared';

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function CommercialHotelSection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(commercialHotelSectionSchema) as any,
    defaultValues: initialData ?? { rooms: '', dailyRatePence: '', occupancyRate: '', notes: '' },
    mode: 'onChange',
  });

  const { register, handleSubmit, formState: { errors, isValid } } = form;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <h2 className="text-xl font-semibold">Hotel Details</h2>

      <div className="glass-card p-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Number of Rooms</label>
          <input type="number" min={1} {...register('rooms', { valueAsNumber: true })}
            className="input-field w-full max-w-[150px]" placeholder="20" />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Daily Rate (£)</label>
          <input type="number" min={0} step={0.01} {...register('dailyRatePence', { valueAsNumber: true })}
            className="input-field w-full max-w-[200px]" placeholder="120" />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Occupancy Rate (%)</label>
          <input type="number" min={0} max={100} step={1} {...register('occupancyRate', { valueAsNumber: true })}
            className="input-field w-full max-w-[150px]" placeholder="75" />
          {errors.occupancyRate && <p className="text-red-400 text-xs mt-1">{String(errors.occupancyRate.message ?? '')}</p>}
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
