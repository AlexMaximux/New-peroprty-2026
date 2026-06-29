'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { rentTermSectionSchema } from '@propvest/shared';

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

export default function RentTermSection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(rentTermSectionSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      rentToLandlordPence: penceToPounds(initialData.rentToLandlordPence),
      depositPence: penceToPounds(initialData.depositPence),
      finderFeePence: penceToPounds(initialData.finderFeePence),
      cleaningPence: penceToPounds(initialData.cleaningPence),
      bills: initialData.bills.map((b: { label: string; amountPence: number }) => ({ ...b, amountPence: penceToPounds(b.amountPence) })),
    } : {
      rentToLandlordPence: 0,
      depositPence: 0,
      contractLength: undefined,
      referencingType: 'LTD',
      finderFeePence: 0,
      happyToCoSource: false,
      bills: [],
      managementEnabled: true,
      managementRatePercent: 10,
      cleaningPence: 0,
    },
    mode: 'onChange',
  });

  const { register, control, handleSubmit, watch, formState: { errors, isValid } } = form;
  const mgmtEnabled = watch('managementEnabled');
  const referencingType = watch('referencingType');
  const billsArray = useFieldArray({ control, name: 'bills' });

  const onSubmit = (raw: any) => {
    const data: any = {
      ...raw,
      rentToLandlordPence: poundsToPence(raw.rentToLandlordPence),
      depositPence: poundsToPence(raw.depositPence),
      finderFeePence: poundsToPence(raw.finderFeePence),
      cleaningPence: poundsToPence(raw.cleaningPence),
      bills: raw.bills.map((b: { label: string; amountPence: number }) => ({ ...b, amountPence: poundsToPence(b.amountPence) })),
    };
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">Rent Term</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Rent to Landlord (£/mo) *</label>
          <input type="number" min={0} {...register('rentToLandlordPence', { valueAsNumber: true })} className="input-field w-full" placeholder="1500" />
          {errors.rentToLandlordPence && <p className="text-red-400 text-xs mt-1">{String(errors.rentToLandlordPence.message??'')}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Deposit (£) *</label>
          <input type="number" min={0} {...register('depositPence', { valueAsNumber: true })} className="input-field w-full" placeholder="1500" />
          {errors.depositPence && <p className="text-red-400 text-xs mt-1">{String(errors.depositPence.message??'')}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Contract Length (months) *</label>
          <input type="number" min={1} {...register('contractLength', { valueAsNumber: true })}
            className="input-field w-full" placeholder="12" />
          {errors.contractLength && <p className="text-red-400 text-xs mt-1">{String(errors.contractLength.message??'')}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Review Period</label>
          <input {...register('reviewPeriod')} className="input-field w-full" placeholder="e.g. 6 months" />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-300 mb-1">Referencing Type *</label>
        <select {...register('referencingType')} className="input-field w-full max-w-[300px]">
          <option value="LTD">LTD Company Contract</option>
          <option value="LIGHT">Light Reference</option>
          <option value="FULL">Full Reference</option>
          <option value="OTHER">Other</option>
        </select>
        {referencingType === 'OTHER' && (
          <div className="mt-2">
            <input {...register('referencingOther')} className="input-field w-full max-w-[300px]" placeholder="Specify..." />
            {errors.referencingOther && <p className="text-red-400 text-xs mt-1">{String(errors.referencingOther.message??'')}</p>}
          </div>
        )}
      </div>

      {/* Sourcing */}
      <div className="glass-card p-4 space-y-4">
        <p className="text-sm font-semibold text-slate-300">Sourcing</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Finder Fee (£)</label>
            <input type="number" min={0} {...register('finderFeePence', { valueAsNumber: true })} className="input-field w-full" placeholder="1000" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" {...register('happyToCoSource')} className="h-4 w-4 rounded border-deep-500 bg-deep-700 text-gold-500" />
            <span className="text-sm text-slate-300">Happy to co-source</span>
          </div>
        </div>
      </div>

      {/* Bills */}
      <div className="border-t border-deep-600 pt-4">
        <p className="text-sm font-semibold text-slate-300 mb-3">Bills</p>
        <div className="space-y-3">
          {billsArray.fields.map((field, idx) => (
            <div key={field.id} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Bill Type</label>
                <input {...register(`bills.${idx}.label`)} className="input-field w-full" placeholder="e.g. Utility" />
              </div>
              <div className="w-32">
                <label className="block text-xs text-slate-400 mb-1">£/mo</label>
                <input type="number" min={0} {...register(`bills.${idx}.amountPence`, { valueAsNumber: true })} className="input-field w-full" placeholder="200" />
              </div>
              <button type="button" onClick={() => billsArray.remove(idx)} className="text-red-400 hover:text-red-300 text-sm pb-1">✕</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => billsArray.append({ label: '', amountPence: 0 })}
          className="btn-secondary mt-2 text-sm">+ Add Bill</button>
      </div>

      {/* Management + Cleaning */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="mgmt-toggle" {...register('managementEnabled')}
            className="h-4 w-4 rounded border-deep-500 bg-deep-700 text-gold-500" />
          <label htmlFor="mgmt-toggle" className="text-sm text-slate-300">Include Management Fee</label>
        </div>
        {mgmtEnabled && (
          <div>
            <label className="block text-sm text-slate-300 mb-1">Management Rate (%)</label>
            <input type="number" min={0} max={100} step={0.5} {...register('managementRatePercent', { valueAsNumber: true })}
              className="input-field w-full max-w-[200px]" placeholder="10" />
          </div>
        )}
        <div>
          <label className="block text-sm text-slate-300 mb-1">Cleaning (£/mo)</label>
          <input type="number" min={0} {...register('cleaningPence', { valueAsNumber: true })}
            className="input-field w-full max-w-[200px]" placeholder="100" />
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}
