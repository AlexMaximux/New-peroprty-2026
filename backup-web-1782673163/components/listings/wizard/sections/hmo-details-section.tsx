'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hmoDetailsSectionSchema, type R2rRoomDto } from '@propvest/shared';

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const ROOM_TYPES = [
  { value: 'DOUBLE_EN_SUITE', label: 'Double en-suite' },
  { value: 'DOUBLE_SHARED', label: 'Double shared bathroom' },
  { value: 'SINGLE_EN_SUITE', label: 'Single en-suite' },
  { value: 'SINGLE_SHARED', label: 'Single shared bathroom' },
  { value: 'OTHER', label: 'Other' },
] as const;

export default function HmoDetailsSection({ initialData, onNext, onBack }: Props) {
  const [showFurnishOther, setShowFurnishOther] = useState(
    initialData?.furnishingQuality === 'OTHER' || false,
  );

  // Convert pence back to pounds for form display
  const toFormDefaults = (d: any) => ({
    ...d,
    rooms: d.rooms.map((r: R2rRoomDto) => ({ ...r, monthlyRentPence: Math.round(r.monthlyRentPence / 100) })),
    refurbCostPence: d.refurbCostPence != null ? Math.round(d.refurbCostPence / 100) : null,
  });

  const form = useForm<any>({
    resolver: zodResolver(hmoDetailsSectionSchema) as any,
    defaultValues: initialData ? toFormDefaults(initialData) : {
      isLicensed: true,
      isTenanted: false,
      needsRefurb: false,
      furnished: true,
      furnishingQuality: 'HIGH',
      hasLivingRoom: true,
      parking: 'NO',
      garden: 'NO',
      rooms: [{ name: 'Room 1', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 0 }],
    },
    mode: 'onChange',
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isValid } } = form;
  const isLicensed = watch('isLicensed');
  const isTenanted = watch('isTenanted');
  const needsRefurb = watch('needsRefurb');
  const tenancyType = watch('tenancyType');
  const licenceNote = watch('licenceNote');
  const furnished = watch('furnished');
  const parking = watch('parking');
  const roomsArray = useFieldArray({ control, name: 'rooms' });

  // Clear dependent fields when checkbox gates are unchecked
  useEffect(() => {
    if (!isLicensed) return;
    // Cleared on re-check — leave existing values intact
  }, []); // only on mount
  useEffect(() => {
    if (isLicensed) return;
    setValue('licenceNote', undefined as any);
    setValue('licenceNoteExplanation', undefined as any);
  }, [isLicensed, setValue]);
  useEffect(() => {
    if (isTenanted) return;
    setValue('tenancyType', undefined as any);
    setValue('roomsTenanted', undefined as any);
  }, [isTenanted, setValue]);
  useEffect(() => {
    if (needsRefurb) return;
    setValue('refurbCostPence', undefined as any);
    setValue('refurbQuoteType', undefined as any);
  }, [needsRefurb, setValue]);

  const onSubmit = (raw: any) => {
    // Convert pounds→pence for monetary fields
    const data: any = {
      ...raw,
      rooms: raw.rooms.map((r: R2rRoomDto) => ({ ...r, monthlyRentPence: Math.round(r.monthlyRentPence * 100) })),
      refurbCostPence: raw.refurbCostPence != null ? Math.round(raw.refurbCostPence * 100) : null,
    };
    onNext(data);
  };

  const cbCls = 'h-4 w-4 rounded border-deep-500 bg-deep-700 text-gold-500';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="text-xl font-semibold">HMO Details</h2>

      {/* ── Status checkboxes ── */}
      <div className="glass-card p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-300">Property Status</p>

        {/* Licenced */}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="is-licenced" {...register('isLicensed')} className={cbCls} />
          <label htmlFor="is-licenced" className="text-sm text-slate-300">Licenced</label>
        </div>
        {!isLicensed && (
          <div className="ml-6 pl-4 border-l-2 border-deep-600 space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Licence Note *</label>
              <select {...register('licenceNote')} className="input-field w-full max-w-[300px]">
                <option value="">Select...</option>
                <option value="NOT_REQUIRED">Licence not required</option>
                <option value="EXPIRED">Licence expired</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.licenceNote && <p className="text-red-400 text-xs mt-1">{String(errors.licenceNote.message??'')}</p>}
            </div>
            {licenceNote === 'OTHER' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Explain *</label>
                <input {...register('licenceNoteExplanation')} className="input-field w-full max-w-[400px]" placeholder="Describe..." />
                {errors.licenceNoteExplanation && <p className="text-red-400 text-xs mt-1">{String(errors.licenceNoteExplanation.message??'')}</p>}
              </div>
            )}
          </div>
        )}

        {/* Tenanted */}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="is-tenanted" {...register('isTenanted')} className={cbCls} />
          <label htmlFor="is-tenanted" className="text-sm text-slate-300">Tenanted</label>
        </div>
        {isTenanted && (
          <div className="ml-6 pl-4 border-l-2 border-deep-600 space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tenancy Type *</label>
              <select {...register('tenancyType')} className="input-field w-full max-w-[300px]">
                <option value="">Select...</option>
                <option value="FULL">Full (all rooms tenanted)</option>
                <option value="PART">Part (some rooms tenanted)</option>
              </select>
              {errors.tenancyType && <p className="text-red-400 text-xs mt-1">{String(errors.tenancyType.message??'')}</p>}
            </div>
            {tenancyType === 'PART' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rooms Tenanted *</label>
                <input type="number" min={1} max={roomsArray.fields.length} {...register('roomsTenanted', { valueAsNumber: true })}
                  className="input-field w-full max-w-[200px]" placeholder="2" />
                {errors.roomsTenanted && <p className="text-red-400 text-xs mt-1">{String(errors.roomsTenanted.message??'')}</p>}
                <p className="text-xs text-slate-500 mt-1">Total rooms defined: {roomsArray.fields.length}</p>
              </div>
            )}
          </div>
        )}

        {/* Needs refurb */}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="needs-refurb" {...register('needsRefurb')} className={cbCls} />
          <label htmlFor="needs-refurb" className="text-sm text-slate-300">Needs Refurbishment</label>
        </div>
        {needsRefurb && (
          <div className="ml-6 pl-4 border-l-2 border-deep-600 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Cost (£) *</label>
                <input type="number" min={0} {...register('refurbCostPence', { valueAsNumber: true })}
                  className="input-field w-full" placeholder="50000" />
                {errors.refurbCostPence && <p className="text-red-400 text-xs mt-1">{String(errors.refurbCostPence.message??'')}</p>}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Quote Type *</label>
                <select {...register('refurbQuoteType')} className="input-field w-full">
                  <option value="">Select...</option>
                  <option value="QUOTED">Quoted</option>
                  <option value="ESTIMATED">Estimate</option>
                </select>
                {errors.refurbQuoteType && <p className="text-red-400 text-xs mt-1">{String(errors.refurbQuoteType.message??'')}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Furnished */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Furnished?</label>
          <select {...register('furnished')} className="input-field w-full"
            onChange={(e) => { setValue('furnished', e.target.value === 'true'); }}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        {furnished && (
          <div>
            <label className="block text-sm text-slate-300 mb-1">Furnishing Quality *</label>
            <select {...register('furnishingQuality')} className="input-field w-full"
              onChange={(e) => { setShowFurnishOther(e.target.value === 'OTHER'); }}>
              <option value="HIGH">High</option>
              <option value="GOOD">Good</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="SEMI_FURNISHED">Semi-furnished</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.furnishingQuality && <p className="text-red-400 text-xs mt-1">{String(errors.furnishingQuality.message??'')}</p>}
            {showFurnishOther && (
              <div className="mt-2">
                <input {...register('furnishingQualityOther')} className="input-field w-full" placeholder="Explain..." />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Living room, Parking, Garden */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Living Room?</label>
          <select {...register('hasLivingRoom')} className="input-field w-full"
            onChange={(e) => setValue('hasLivingRoom', e.target.value === 'true')}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Parking</label>
          <select {...register('parking')} className="input-field w-full">
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Garden</label>
          <select {...register('garden')} className="input-field w-full">
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="OTHER">Other (notes)</option>
          </select>
        </div>
      </div>

      {parking === 'YES' && (
        <div>
          <label className="block text-sm text-slate-300 mb-1">Parking Spaces *</label>
          <input type="number" min={1} {...register('parkingSpaces', { valueAsNumber: true })}
            className="input-field w-full max-w-[200px]" placeholder="2" />
          {errors.parkingSpaces && <p className="text-red-400 text-xs mt-1">{String(errors.parkingSpaces.message??'')}</p>}
        </div>
      )}

      {parking === 'OTHER' && (
        <div>
          <label className="block text-sm text-slate-300 mb-1">Parking Details</label>
          <input {...register('parkingOther')} className="input-field w-full" placeholder="e.g. Permit required" />
        </div>
      )}

      {watch('garden') === 'OTHER' && (
        <div>
          <label className="block text-sm text-slate-300 mb-1">Garden Notes</label>
          <textarea {...register('gardenNotes')} className="input-field w-full h-20 resize-none" placeholder="Describe..." />
        </div>
      )}

      {/* Rooms */}
      <div className="border-t border-deep-600 pt-4">
        <p className="text-sm font-semibold text-slate-300 mb-3">Rooms *</p>
        <div className="space-y-3">
          {roomsArray.fields.map((field, idx) => (
            <div key={field.id} className="glass-card p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-slate-300">Room {idx + 1}</span>
                <button type="button" onClick={() => roomsArray.remove(idx)}
                  className="text-red-400 hover:text-red-300 text-sm">Remove</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Name *</label>
                  <input {...register(`rooms.${idx}.name`)} className="input-field w-full" placeholder={`Room ${idx + 1}`} />
                  {(errors as any).rooms?.[idx]?.name && <p className="text-red-400 text-xs mt-1">{String((errors as any).rooms?.[idx]?.name?.message ?? '')}</p>}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select {...register(`rooms.${idx}.roomType`)} className="input-field w-full">
                    {ROOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Monthly Rent (£)</label>
                  <input type="number" min={0} {...register(`rooms.${idx}.monthlyRentPence`, { valueAsNumber: true })}
                    className="input-field w-full" placeholder="500" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => roomsArray.append({ name: `Room ${roomsArray.fields.length + 1}`, roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 0 })}
          className="btn-secondary mt-3">+ Add Room</button>
        {errors.rooms && !Array.isArray(errors.rooms) && <p className="text-red-400 text-xs mt-2">{String(errors.rooms.message??'')}</p>}
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}
