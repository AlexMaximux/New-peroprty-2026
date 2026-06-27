'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSectionSchema } from '@propvest/shared';
import { AddressAutocomplete, type PlaceResult } from '@/components/maps/address-autocomplete';

interface Props {
  initialData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const REGIONS = [
  { value: 'NORTH', label: 'North' },
  { value: 'SOUTH', label: 'South' },
  { value: 'MIDLANDS', label: 'Midlands' },
  { value: 'WALES', label: 'Wales' },
  { value: 'SCOTLAND', label: 'Scotland' },
  { value: 'MANUAL', label: 'Manual entry' },
] as const;

const PROPERTY_TYPES = [
  { value: 'TERRACED', label: 'Terraced' },
  { value: 'FLAT', label: 'Flat' },
  { value: 'DETACHED', label: 'Detached' },
  { value: 'SEMI_DETACHED', label: 'Semi-detached' },
  { value: 'OTHER', label: 'Other' },
] as const;

export default function AddressSection({ initialData, onNext, onBack }: Props) {
  const form = useForm<any>({
    resolver: zodResolver(addressSectionSchema) as any,
    defaultValues: initialData ?? {
      postcode: '',
      region: '' as any,
      propertyType: 'TERRACED',
      addressLine1: '',
      city: '',
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isValid } } = form;
  const region = watch('region');
  const propType = watch('propertyType');

  const onPlaceSelected = (place: PlaceResult) => {
    setValue('addressLine1', place.addressLine1, { shouldValidate: true });
    setValue('addressLine2', place.addressLine2 ?? '', { shouldValidate: true });
    setValue('city', place.city, { shouldValidate: true });
    setValue('postcode', place.postcode, { shouldValidate: true });
    if (place.latitude) setValue('latitude', place.latitude);
    if (place.longitude) setValue('longitude', place.longitude);
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <h2 className="text-xl font-semibold">Address</h2>

      {/* Address autocomplete */}
      <div>
        <label className="block text-sm text-slate-300 mb-1">Search Address *</label>
        <AddressAutocomplete onPlaceSelected={onPlaceSelected} className="input-field w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Address Line 1 *</label>
          <input {...register('addressLine1')} className="input-field w-full" placeholder="45 Test Street" />
          {errors.addressLine1 && <p className="text-red-400 text-xs mt-1">{String(errors.addressLine1.message??'')}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Address Line 2</label>
          <input {...register('addressLine2')} className="input-field w-full" placeholder="Area / district" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">City *</label>
          <input {...register('city')} className="input-field w-full" placeholder="Manchester" />
          {errors.city && <p className="text-red-400 text-xs mt-1">{String(errors.city.message??'')}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Postcode *</label>
          <input {...register('postcode')} className="input-field w-full" placeholder="M1 1AA" />
          {errors.postcode && <p className="text-red-400 text-xs mt-1">{String(errors.postcode.message??'')}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">House Number</label>
          <input {...register('houseNumber')} className="input-field w-full" placeholder="45" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Region *</label>
          <select {...register('region')} className="input-field w-full">
            <option value="" disabled>Select region...</option>
            {REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        {region === 'MANUAL' && (
          <div>
            <label className="block text-sm text-slate-300 mb-1">Manual Region *</label>
            <input {...register('manualRegion')} className="input-field w-full" placeholder="e.g. Cornwall" />
            {errors.manualRegion && <p className="text-red-400 text-xs mt-1">{String(errors.manualRegion.message??'')}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Property Type *</label>
          <select {...register('propertyType')} className="input-field w-full">
            {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {propType === 'OTHER' && (
          <div>
            <label className="block text-sm text-slate-300 mb-1">Explain *</label>
            <input {...register('propertyTypeOther')} className="input-field w-full" placeholder="e.g. Bungalow" />
            {errors.propertyTypeOther && <p className="text-red-400 text-xs mt-1">{String(errors.propertyTypeOther.message??'')}</p>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="submit" disabled={!isValid} className="btn-primary disabled:opacity-30">Next</button>
      </div>
    </form>
  );
}
