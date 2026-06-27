'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { portfolioSectionSchema } from '@propvest/shared';

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

export default function PortfolioAssetsSection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(portfolioSectionSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      assets: initialData.assets?.map((a: any) => ({
        ...a,
        valuePence: penceToPounds(a.valuePence),
      })) ?? [],
    } : {
      portfolioTitle: '',
      numberOfProperties: '',
      summary: '',
      notes: '',
      assets: [],
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, watch, formState: { isValid } } = form;
  const assets = watch('assets') ?? [];

  const addAsset = () => {
    const newAsset = { name: '', assetType: '', valuePence: '', notes: '', order: assets.length };
    form.setValue('assets', [...assets, newAsset], { shouldValidate: true });
  };

  const removeAsset = (idx: number) => {
    form.setValue('assets', assets.filter((_: any, i: number) => i !== idx), { shouldValidate: true });
  };

  const updateAsset = (idx: number, field: string, value: any) => {
    const newAssets = [...assets];
    newAssets[idx] = { ...newAssets[idx], [field]: value };
    form.setValue('assets', newAssets, { shouldValidate: true });
  };

  const onSubmit = (raw: any) => {
    const data: any = {
      ...raw,
      assets: raw.assets?.map((a: any) => ({
        ...a,
        valuePence: poundsToPence(a.valuePence),
      })) ?? [],
    };
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">Portfolio Assets</h2>

      <div className="glass-card p-4 space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Portfolio Title</label>
          <input {...register('portfolioTitle')} className="input-field w-full" placeholder="Prime London Portfolio" />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Number of Properties</label>
          <input type="number" min={1} {...register('numberOfProperties', { valueAsNumber: true })}
            className="input-field w-full max-w-[150px]" placeholder="5" />
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Assets</p>
        {assets.map((_asset: any, idx: number) => (
          <div key={idx} className="border border-deep-600 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Asset {idx + 1}</span>
              <button type="button" onClick={() => removeAsset(idx)}
                className="text-xs text-red-400 hover:text-red-300">Remove</button>
            </div>
            <div>
              <input {...register(`assets.${idx}.name` as any)}
                onChange={(e) => updateAsset(idx, 'name', e.target.value)}
                className="input-field w-full text-sm" placeholder="Property address or name" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input {...register(`assets.${idx}.assetType` as any)}
                onChange={(e) => updateAsset(idx, 'assetType', e.target.value)}
                className="input-field text-sm" placeholder="Type (e.g. Flat)" />
              <input type="number" min={0} step={0.01} {...register(`assets.${idx}.valuePence` as any, { valueAsNumber: true })}
                onChange={(e) => updateAsset(idx, 'valuePence', e.target.value)}
                className="input-field text-sm" placeholder="Value (£)" />
            </div>
          </div>
        ))}
        <button type="button" onClick={addAsset}
          className="w-full py-2 border border-dashed border-deep-500 rounded-lg text-sm text-gold-400 hover:bg-deep-700">
          + Add Asset
        </button>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Summary</label>
        <textarea {...register('summary')} rows={3}
          className="input-field w-full" placeholder="Portfolio overview..." />
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Notes</label>
        <textarea {...register('notes')} rows={2}
          className="input-field w-full" placeholder="Additional notes..." />
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}