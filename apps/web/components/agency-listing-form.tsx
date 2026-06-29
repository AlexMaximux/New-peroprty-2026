'use client';

import { useState } from 'react';
import { MapPin, TrendingUp, Calculator, Check, X, Plus } from 'lucide-react';
import { AgencySectionHeader } from './agency-section-header';
import { createListing } from '@propvest/api-client';
import { PeriodSelect } from './period-select';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type RoomType = 'DOUBLE_EN_SUITE' | 'DOUBLE_SHARED' | 'SINGLE_EN_SUITE' | 'SINGLE_SHARED';

type Room = {
  type: RoomType;
  rent: number;
};

type AgencyListingFormProps = {
  onSuccess?: (listingId: string) => void;
  onCancel?: () => void;
};

type FormState = {
  postcode: string;
  houseNumber: string;
  manualAddress: string;
  region: string;
  propertyType: 'TERRACED' | 'FLAT' | 'DETACHED' | 'SEMI_DETACHED';
  bedrooms: number;
  bathrooms: number;
  isLicensed: boolean;
  isTenanted: boolean;
  needsRefurb: boolean;
  refurbCostPence: number;
  furnished: 'UNFURNISHED' | 'FURNISHED' | 'SEMI_FURNISHED';
  hasLivingRoom: boolean;
  hasParking: boolean;
  hasGarden: boolean;
  rooms: Room[];
  rentToLandlord: number;
  deposit: number;
  contractLength: { value: string; unit: 'years' | 'months' };
  reviewPeriod: { value: string; unit: 'years' | 'months' };
  referenceType: string;
  finderFee: number;
  coSource: boolean;
  billsIncluded: boolean;
  agencyDetails: string;
};

const initialFormState: FormState = {
  postcode: '',
  houseNumber: '',
  manualAddress: '',
  region: '',
  propertyType: 'TERRACED',
  bedrooms: 0,
  bathrooms: 0,
  isLicensed: false,
  isTenanted: false,
  needsRefurb: false,
  refurbCostPence: 0,
  furnished: 'UNFURNISHED',
  hasLivingRoom: false,
  hasParking: false,
  hasGarden: false,
  rooms: [{ type: 'DOUBLE_EN_SUITE', rent: 0 }],
  rentToLandlord: 0,
  deposit: 0,
  contractLength: { value: '', unit: 'years' },
  reviewPeriod: { value: '', unit: 'years' },
  referenceType: '',
  finderFee: 0,
  coSource: false,
  billsIncluded: false,
  agencyDetails: '',
};

export function AgencyListingForm({ onSuccess, onCancel }: AgencyListingFormProps) {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        category: 'RENT_TO_RENT' as const,
        strategy: 'HMO' as const,
        status: 'DRAFT' as const,
        base: {
          title: `HMO Property in ${formData.postcode || formData.region || 'Unknown'}`,
          description: formData.agencyDetails || undefined,
          propertyType: formData.propertyType,
          addressLine1: formData.postcode,
          city: formData.region,
          postcode: formData.postcode,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          hasLivingRoom: formData.hasLivingRoom,
          hasGarden: formData.hasGarden,
          parking: formData.hasParking ? '1' : undefined,
          furnishedStatus: formData.furnished,
          needsRefurb: formData.needsRefurb,
          refurbCostPence: formData.refurbCostPence,
        },
        hmoRooms: formData.rooms.map((r, i) => ({
          name: `Room ${i + 1}`,
          roomType: r.type,
          monthlyRentPence: Math.round(r.rent * 100),
        })),
        strategySpecificData: {
          isLicensed: formData.isLicensed,
          isTenanted: formData.isTenanted,
          rentToLandlordPence: Math.round(formData.rentToLandlord * 100),
          depositPence: Math.round(formData.deposit * 100),
          finderFeePence: Math.round(formData.finderFee * 100),
          referenceRequirement: formData.referenceType ? (formData.referenceType.includes('Easy') ? 'EASY' : formData.referenceType.includes('Full') ? 'FULL' : 'LTD') : undefined,
          billsIncluded: formData.billsIncluded,
          agencyDetails: formData.agencyDetails || undefined,
          happyToCoSource: formData.coSource,
        },
      };

      const result = await createListing(payload);
      return result;
    },
    onSuccess: (data) => {
      setSuccess(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      if (onSuccess) onSuccess(data.id);
    },
    onError: (err: any) => {
      setError(err.message ?? 'Failed to create listing');
      setSuccess(false);
    },
  });

  const totalRoomIncome = formData.rooms.reduce((s, r) => s + r.rent, 0);

  const inputClass =
    'w-full px-3 py-2 text-sm bg-input-background border border-border rounded-lg outline-none focus:border-primary/60 text-foreground placeholder:text-muted-foreground';
  const labelClass = 'block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide';

  const addRoom = () => {
    setFormData((p) => ({ ...p, rooms: [...p.rooms, { type: 'DOUBLE_EN_SUITE', rent: 0 }] }));
  };

  const removeRoom = (i: number) => {
    setFormData((p) => ({ ...p, rooms: p.rooms.filter((_, idx) => idx !== i) }));
  };

  const updateRoom = (i: number, field: keyof Room, val: string | number) => {
    setFormData((p) => ({
      ...p,
      rooms: p.rooms.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)),
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
          R2R HMO Listing
        </h2>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
          Draft
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <p className="text-emerald-400 text-sm font-medium">Listing saved successfully!</p>
        </div>
      )}

      {/* Section 1: Address & Region */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <AgencySectionHeader step={1} title="Address & Region" icon={<MapPin size={14} />} />
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Postcode</label>
              <div className="relative">
                <input
                  value={formData.postcode}
                  onChange={(e) => setFormData((p) => ({ ...p, postcode: e.target.value }))}
                  className={inputClass}
                  placeholder="B11 3AQ"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-1.5 py-0.5 rounded pointer-events-none">
                  Maps API
                </span>
              </div>
            </div>
            <div>
              <label className={labelClass}>House / Flat No.</label>
              <input
                value={formData.houseNumber}
                onChange={(e) => setFormData((p) => ({ ...p, houseNumber: e.target.value }))}
                className={inputClass}
                placeholder="42"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className={labelClass}>Region</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData((p) => ({ ...p, region: e.target.value }))}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Select region...</option>
                {['NORTH', 'SOUTH', 'CENTRAL', 'WALES', 'SCOTLAND'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Property Type</label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData((p) => ({ ...p, propertyType: e.target.value as FormState['propertyType'] }))}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">Select type...</option>
                <option value="TERRACED">Terraced</option>
                <option value="FLAT">Flat</option>
                <option value="DETACHED">Detached</option>
                <option value="SEMI_DETACHED">Semi-Detached</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Bedrooms</label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData((p) => ({ ...p, bedrooms: parseInt(e.target.value) || 0 }))}
                  className={inputClass}
                  placeholder="3"
                />
              </div>
              <div>
                <label className={labelClass}>Bathrooms</label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData((p) => ({ ...p, bathrooms: parseInt(e.target.value) || 0 }))}
                  className={inputClass}
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, isLicensed: !p.isLicensed }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                formData.isLicensed
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {formData.isLicensed && <Check size={11} />} Licensed
            </button>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, isTenanted: !p.isTenanted }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                formData.isTenanted
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {formData.isTenanted && <Check size={11} />} Tenanted
            </button>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, needsRefurb: !p.needsRefurb }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                formData.needsRefurb
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {formData.needsRefurb && <Check size={11} />} Needs Refurb
            </button>
          </div>

          {formData.needsRefurb && (
            <div>
              <label className={labelClass}>Refurb Cost (£)</label>
              <input
                type="number"
                value={formData.refurbCostPence}
                onChange={(e) => setFormData((p) => ({ ...p, refurbCostPence: parseInt(e.target.value) || 0 }))}
                className={inputClass}
                placeholder="15000"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Rooms & Income */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <AgencySectionHeader step={2} title="Rooms & Potential Income" icon={<TrendingUp size={14} />} />
        <div className="p-5 space-y-3">
          <div className="space-y-2.5">
            {formData.rooms.map((room, i) => (
              <div key={i} className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground w-[52px] shrink-0 text-right">
                  Room {i + 1}
                </span>
                <select
                  value={room.type}
                  onChange={(e) => updateRoom(i, 'type', e.target.value)}
                  className="flex-1 min-w-[190px] px-3 py-2 text-sm bg-input-background border border-border rounded-lg outline-none focus:border-primary/60 text-foreground cursor-pointer"
                >
                  <option value="DOUBLE_EN_SUITE">Double en-suite</option>
                  <option value="DOUBLE_SHARED">Double shared</option>
                  <option value="SINGLE_EN_SUITE">Single en-suite</option>
                  <option value="SINGLE_SHARED">Single shared</option>
                </select>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-medium text-muted-foreground">£</span>
                  <input
                    type="number"
                    value={room.rent}
                    onChange={(e) => updateRoom(i, 'rent', parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 text-sm bg-input-background border border-border rounded-lg outline-none focus:border-primary/60"
                    placeholder="650"
                  />
                  <span className="text-xs text-muted-foreground">/mo</span>
                </div>
                {formData.rooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoom(i)}
                    className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-500 hover:border-red-300 transition-colors shrink-0"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRoom}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-dashed border-border rounded-lg hover:border-primary/60 hover:text-primary text-muted-foreground transition-colors"
          >
            <Plus size={13} /> Add Room
          </button>

          {totalRoomIncome > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 mt-1">
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide mb-2.5">
                Potential Income Breakdown
              </p>
              <div className="space-y-1.5">
                {formData.rooms.map((r, i) =>
                  r.rent > 0 ? (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Room {i + 1}</span>
                      <span className="font-semibold tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                        £{r.rent.toLocaleString('en-GB')}/mo
                      </span>
                    </div>
                  ) : null,
                )}
                <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-emerald-200 dark:border-emerald-800/40 mt-1">
                  <span className="text-emerald-800 dark:text-emerald-300">Total Potential Income</span>
                  <span className="text-emerald-700 dark:text-emerald-400 tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                    £{totalRoomIncome.toLocaleString('en-GB')}/mo
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Rent Terms */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <AgencySectionHeader step={3} title="Rent Terms & Financial Summary" icon={<Calculator size={14} />} />
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Rent to Landlord (£/mo)</label>
              <input
                type="number"
                value={formData.rentToLandlord}
                onChange={(e) => setFormData((p) => ({ ...p, rentToLandlord: parseFloat(e.target.value) || 0 }))}
                className={inputClass}
                placeholder="1400"
              />
            </div>
            <div>
              <label className={labelClass}>Deposit (£)</label>
              <input
                type="number"
                value={formData.deposit}
                onChange={(e) => setFormData((p) => ({ ...p, deposit: parseFloat(e.target.value) || 0 }))}
                className={inputClass}
                placeholder="1400"
              />
            </div>
            <div>
              <label className={labelClass}>Contract Length</label>
              <PeriodSelect
                value={formData.contractLength.value}
                unit={formData.contractLength.unit}
                onValueChange={(v) => setFormData((p) => ({ ...p, contractLength: { value: v, unit: p.contractLength.unit } }))}
                onUnitChange={(u) => setFormData((p) => ({ ...p, contractLength: { value: p.contractLength.value, unit: u } }))}
              />
            </div>
            <div>
              <label className={labelClass}>Finder Fee (£)</label>
              <input
                type="number"
                value={formData.finderFee}
                onChange={(e) => setFormData((p) => ({ ...p, finderFee: parseFloat(e.target.value) || 0 }))}
                className={inputClass}
                placeholder="2500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.billsIncluded}
                onChange={(e) => setFormData((p) => ({ ...p, billsIncluded: e.target.checked }))}
                className="w-3.5 h-3.5 accent-emerald-500"
              />
              Bills Included
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.coSource}
                onChange={(e) => setFormData((p) => ({ ...p, coSource: e.target.checked }))}
                className="w-3.5 h-3.5 accent-emerald-500"
              />
              Happy to Co-source
            </label>
          </div>

          <div>
            <label className={labelClass}>Agency Details</label>
            <textarea
              value={formData.agencyDetails}
              onChange={(e) => setFormData((p) => ({ ...p, agencyDetails: e.target.value }))}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Your agency details..."
            />
          </div>

          {/* Financial Summary */}
          <div className="rounded-xl overflow-hidden border border-primary/20 bg-gradient-to-br from-[#0F1D3A] to-[#0A1628]">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/10">
              <Calculator size={14} className="text-emerald-400" />
              <span className="text-sm font-semibold text-white">Financial Summary</span>
            </div>
            <div className="p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Money Needed In</span>
                <span className="text-emerald-400 font-semibold tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                  £{(
                    (formData.deposit || 0) +
                    (formData.rentToLandlord || 0) +
                    (formData.finderFee || 0) +
                    (formData.refurbCostPence || 0)
                  ).toLocaleString('en-GB')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Monthly Profit</span>
                <span className="text-emerald-400 font-semibold tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                  £{(totalRoomIncome - (formData.rentToLandlord || 0)).toLocaleString('en-GB')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={mutation.isPending}
          className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving...' : 'Save Draft'}
        </button>
      </div>
    </div>
  );
}