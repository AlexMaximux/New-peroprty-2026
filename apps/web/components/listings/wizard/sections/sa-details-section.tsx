'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saDetailsSectionSchema } from '@propvest/shared';

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function SaDetailsSection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(saDetailsSectionSchema) as any,
    defaultValues: initialData ?? {
      bedrooms: 1,
      bathrooms: 1,
      accommodates: 2,
      furnished: true,
      furnishingQuality: 'GOOD',
      manualOverride: false,
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = form;
  const furnished = watch('furnished');
  const furnishingQuality = watch('furnishingQuality');

  const onSubmit = (raw: any) => {
    // Convert NaN → undefined for optional AirDNA fields
    const data = {
      ...raw,
      airdnaNightlyRatePence: raw.airdnaNightlyRatePence != null && !Number.isNaN(raw.airdnaNightlyRatePence)
        ? raw.airdnaNightlyRatePence : undefined,
      airdnaOccupancyRate: raw.airdnaOccupancyRate != null && !Number.isNaN(raw.airdnaOccupancyRate)
        ? raw.airdnaOccupancyRate : undefined,
    };
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">SA Property Details</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Bedrooms *</label>
          <input type="number" min={1} {...register('bedrooms', { valueAsNumber: true })} className="input-field w-full" placeholder="2" />
          {errors.bedrooms && <p className="text-red-400 text-xs mt-1">{String(errors.bedrooms.message??'')}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Bathrooms *</label>
          <input type="number" min={1} {...register('bathrooms', { valueAsNumber: true })} className="input-field w-full" placeholder="1" />
          {errors.bathrooms && <p className="text-red-400 text-xs mt-1">{String(errors.bathrooms.message??'')}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Max Guests *</label>
          <input type="number" min={1} {...register('accommodates', { valueAsNumber: true })} className="input-field w-full" placeholder="4" />
          {errors.accommodates && <p className="text-red-400 text-xs mt-1">{String(errors.accommodates.message??'')}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Furnished?</label>
        <select {...register('furnished')} className="input-field w-full max-w-[200px]"
          onChange={(e) => setValue('furnished', e.target.value === 'true')}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      {furnished && (
        <div>
          <label className="block text-sm text-slate-300 mb-1">Furnishing Quality *</label>
          <select {...register('furnishingQuality')} className="input-field w-full max-w-[300px]">
            <option value="HIGH">High</option>
            <option value="GOOD">Good</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="SEMI_FURNISHED">Semi-furnished</option>
            <option value="OTHER">Other</option>
          </select>
          {furnishingQuality === 'OTHER' && (
            <div className="mt-2">
              <input {...register('furnishingQualityOther')} className="input-field w-full max-w-[300px]" placeholder="Explain..." />
            </div>
          )}
          {errors.furnishingQuality && <p className="text-red-400 text-xs mt-1">{String(errors.furnishingQuality.message??'')}</p>}
        </div>
      )}

      <div className="glass-card p-4">
        <p className="text-sm font-semibold text-slate-300 mb-2">AirDNA Data</p>
        <p className="text-xs text-slate-400 mb-3">Estimated market rates from AirDNA by beds + postcode (manual override available).</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nightly Rate (£) — Suggested</label>
            <input type="number" {...register('airdnaNightlyRatePence', { valueAsNumber: true })} className="input-field w-full" placeholder="Auto-filled" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Occupancy (%) — Suggested</label>
            <input type="number" min={0} max={1} step={0.01} {...register('airdnaOccupancyRate', { valueAsNumber: true })} className="input-field w-full" placeholder="0.70" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input type="checkbox" id="manual-override" {...register('manualOverride')} className="h-4 w-4 rounded border-deep-500 bg-deep-700 text-gold-500" />
          <label htmlFor="manual-override" className="text-xs text-slate-400">Manual override — skip API lookup</label>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}
