'use client';

import { useState, useMemo, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createListingSchema,
  type CreateListingDto,
  type HmoRoomDto,
  CATEGORY_CONFIG,
  SECTION_DEFS,
  getSections,
  isCategoryLevel,
  type StrategyConfig,
  calcHmoGrossMonthlyIncome,
  calcHmoMonthlyOperatingCosts,
  calcHmoMonthlyProfit,
  calcSaMonthlyIncome,
  calcSaYearlyIncome,
  calcSaBreakEvenOccupancy,
  calcSaProfit,
} from '@propvest/shared';
import { cn, formatGBP, formatPercent, poundsToPence } from '@/lib/utils';
import { AddressAutocomplete, type PlaceResult } from '@/components/maps/address-autocomplete';

// ── Types ───────────────────────────────────────────────────────────────────

type FormData = CreateListingDto;

interface StepConfig {
  id: string;
  label: string;
}

interface NewListingFormProps {
  onDraftSaved?: (id: string) => void;
}

// ── API helpers ───────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pv_access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Step list builder ─────────────────────────────────────────────────────────

function buildSteps(
  selectedCategory: string | null,
  selectedStrategy: string | null,
): StepConfig[] {
  const steps: StepConfig[] = [{ id: 'category', label: 'Category' }];

  if (!selectedCategory) return steps;

  const cat = CATEGORY_CONFIG.find((c) => c.category === selectedCategory);
  if (cat && cat.strategies.length > 0) {
    steps.push({ id: 'strategy', label: 'Strategy' });
  }

  // If no strategy selected and category needs one, stop
  if (!selectedStrategy && !isCategoryLevel(selectedCategory)) {
    return steps;
  }

  const sections = getSections(selectedCategory, selectedStrategy);
  for (const sectionId of sections) {
    const def = SECTION_DEFS[sectionId];
    if (def) {
      steps.push({ id: `section-${sectionId}`, label: def.label });
    }
  }

  steps.push({ id: 'summary', label: 'Summary' });
  return steps;
}

// ── Inline HMO Room Calculator ───────────────────────────────────────────────
// Exported for component testing.
// All props come from form state (user enters pounds → stored as pounds).
// poundsToPence() converts to pence before calling calc fns. formatGBP() converts
// back for display.

export function HmoRoomCalculator({
  rooms,
  rentToLandlordPence,
  billsPence,
  cleaningPence,
}: {
  rooms: HmoRoomDto[];
  rentToLandlordPence?: number;
  billsPence?: number;
  cleaningPence?: number;
}) {
  if (rooms.length === 0) return null;

  // Convert form pounds→pence before calc
  const roomsPence = rooms.map((r) => ({ monthlyRentPence: poundsToPence(r.monthlyRentPence) }));
  const grossIncome = calcHmoGrossMonthlyIncome(roomsPence);
  const totalRentPence = roomsPence.reduce((s, r) => s + r.monthlyRentPence, 0);
  const opCosts = calcHmoMonthlyOperatingCosts({
    rentToLandlordPence: poundsToPence(rentToLandlordPence),
    billsPence: poundsToPence(billsPence),
    cleaningPence: poundsToPence(cleaningPence),
    grossIncomePence: totalRentPence,
  });
  const profit = calcHmoMonthlyProfit(totalRentPence, opCosts);

  return (
    <div className="glass-card p-4 mt-3">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">HMO Room Summary</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <p className="text-sm text-slate-400">Rooms</p>
          <p className="text-lg font-semibold">{rooms.length}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Gross Monthly Income</p>
          <p className="text-lg font-semibold gradient-text">{formatGBP(grossIncome)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Monthly Profit</p>
          <p className={cn('text-lg font-semibold', profit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {formatGBP(profit)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Inline SA Calculator ─────────────────────────────────────────────────────
// Props come from form state (pounds). poundsToPence() converts before calc fns.

function SaCalculator({
  nightlyRatePence,
  occupancyRate,
  rentPence,
  billsPence,
  bookingFeePence,
  cleaningCostPence,
  managementCostPence,
  otherCostsPence,
}: {
  nightlyRatePence: number;
  occupancyRate: number;
  rentPence: number;
  billsPence?: number;
  bookingFeePence?: number;
  cleaningCostPence?: number;
  managementCostPence?: number;
  otherCostsPence?: number;
}) {
  // Convert form pounds→pence before calc
  const nightlyPence = poundsToPence(nightlyRatePence);
  const rentP = poundsToPence(rentPence);
  const billsP = poundsToPence(billsPence);
  const bookingP = poundsToPence(bookingFeePence);
  const cleaningP = poundsToPence(cleaningCostPence);
  const managementP = poundsToPence(managementCostPence);
  const otherP = poundsToPence(otherCostsPence);

  const monthlyIncome = calcSaMonthlyIncome(occupancyRate, nightlyPence);
  const yearlyIncome = calcSaYearlyIncome(occupancyRate, nightlyPence);
  const totalCosts = rentP + billsP + bookingP + cleaningP + managementP + otherP;
  const profit = calcSaProfit(monthlyIncome, totalCosts);
  const breakEven = calcSaBreakEvenOccupancy(totalCosts, nightlyPence);

  return (
    <div className="glass-card p-4 mt-3">
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">SA Projections</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <p className="text-sm text-slate-400">Monthly Income</p>
          <p className="text-lg font-semibold gradient-text">{formatGBP(monthlyIncome)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Yearly Income</p>
          <p className="text-lg font-semibold gradient-text">{formatGBP(yearlyIncome)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Monthly Costs</p>
          <p className="text-lg font-semibold">{formatGBP(totalCosts)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Break-Even Occupancy</p>
          <p className="text-lg font-semibold">{formatPercent(breakEven)}</p>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-deep-600">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Monthly Profit</span>
          <span className={cn('text-lg font-semibold', profit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {formatGBP(profit)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function NewListingForm({ onDraftSaved }: NewListingFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const steps = useMemo(
    () => buildSteps(selectedCategory, selectedStrategy),
    [selectedCategory, selectedStrategy],
  );

  const isLastStep = currentStep >= steps.length - 1;
  const activeCategoryConfig = CATEGORY_CONFIG.find((c) => c.category === selectedCategory);

  // ── React Hook Form ──

  const form = useForm<FormData>({
    resolver: zodResolver(createListingSchema) as any,
    mode: 'onChange',
    defaultValues: {
      category: undefined,
      strategy: undefined,
      status: 'DRAFT',
      base: {},
      hmoRooms: [],
      portfolioAssets: [],
      media: [],
      strategySpecificData: {},
    },
  });

  const { register, watch, control, getValues, setValue } = form;

  // Field arrays for repeatable groups
  const hmoRoomArray = useFieldArray({
    control,
    name: 'hmoRooms',
  });

  const portfolioAssetArray = useFieldArray({
    control,
    name: 'portfolioAssets',
  });

  // Watched values for calculators
  const hmoRooms = watch('hmoRooms') ?? [];
  const ssd = watch('strategySpecificData') ?? {};

  // ── Navigation ──

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, steps.length]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const selectCategory = useCallback((cat: string) => {
    setSelectedCategory(cat);
    setSelectedStrategy(null);
    (setValue as any)('category', cat);
    (setValue as any)('strategy', null);
    setCurrentStep(1);
  }, [setValue]);

  const onPlaceSelected = useCallback((place: PlaceResult) => {
    setValue('base.addressLine1', place.addressLine1, { shouldValidate: true });
    setValue('base.addressLine2', place.addressLine2, { shouldValidate: true });
    setValue('base.city', place.city, { shouldValidate: true });
    setValue('base.postcode', place.postcode, { shouldValidate: true });
  }, [setValue]);

  const selectStrategy = useCallback((strat: string) => {
    setSelectedStrategy(strat);
    (setValue as any)('strategy', strat);
    const sections = getSections(selectedCategory!, strat);
    // Advance past strategy to first content section (or summary if none)
    setCurrentStep(sections.length > 0 ? 2 : steps.length - 1);
  }, [selectedCategory, setValue, steps.length]);

  // ── Submit ──

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED' = 'DRAFT') => {
    setIsSubmitting(true);
    setSaveError(null);

    try {
      const values = getValues();
      // Convert all *Pence fields from pounds→pence for API
      const payload: Record<string, unknown> = {
        ...JSON.parse(JSON.stringify(values), (_key: string, val: unknown) =>
          typeof val === 'number' && val !== 0 && _key.endsWith('Pence') ? Math.round(val * 100) : val,
        ),
        category: selectedCategory!,
        strategy: selectedStrategy ?? null,
        status,
      };

      const res = await fetch(`${API_BASE}/listings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Save failed' }));
        throw new Error(err.message ?? err.details ?? 'Save failed');
      }

      const listing = await res.json();
      if (onDraftSaved) onDraftSaved(listing.id);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step renderers ──

  const renderCategoryStep = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Listing Category</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORY_CONFIG.filter((c) => c.category !== 'COMMERCIAL').map((cat) => (
          <button
            key={cat.category}
            type="button"
            onClick={() => selectCategory(cat.category)}
            className={cn(
              'glass-card p-5 text-left transition-all duration-200',
              selectedCategory === cat.category
                ? 'ring-2 ring-gold-400 shadow-glow-gold'
                : 'hover:bg-deep-600',
            )}
          >
            <p className="font-semibold text-base">{cat.label}</p>
            <p className="text-xs text-slate-400 mt-1">
              {cat.strategies.length > 0
                ? `${cat.strategies.length} strategies`
                : 'Category-level'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStrategyStep = () => {
    if (!activeCategoryConfig) return null;
    return (
      <div>
        <h2 className="text-xl font-semibold mb-6">Investment Strategy</h2>
        <p className="text-sm text-slate-400 mb-4">
          {activeCategoryConfig.label} — choose a deal structure
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeCategoryConfig.strategies.map((strat: StrategyConfig) => (
            <button
              key={strat.strategy}
              type="button"
              onClick={() => selectStrategy(strat.strategy)}
              className={cn(
                'glass-card p-5 text-left transition-all duration-200',
                selectedStrategy === strat.strategy
                  ? 'ring-2 ring-gold-400 shadow-glow-gold'
                  : 'hover:bg-deep-600',
              )}
            >
              <p className="font-semibold text-base">{strat.label}</p>
              <p className="text-xs text-slate-400 mt-1">
                {strat.sections.filter((s) => s !== 'base-info' && s !== 'agency-network').length}{' '}
                section(s)
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderBaseInfoStep = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Property Information</h2>
      <div className="space-y-5">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Listing Title *</label>
          <input
            {...register('base.title')}
            className="input-field w-full"
            placeholder="e.g. 3-bed HMO in Manchester"
          />
          {form.formState.errors.base?.title && (
            <p className="text-red-400 text-xs mt-1">{form.formState.errors.base.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Address Line 1 *</label>
            <AddressAutocomplete
              onPlaceSelected={onPlaceSelected}
              placeholder="Search for a UK address"
              className="input-field w-full"
            />
            {/* Hidden input for react-hook-form validation */}
            <input type="hidden" {...register('base.addressLine1')} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Address Line 2</label>
            <input
              {...register('base.addressLine2')}
              className="input-field w-full"
              placeholder="Area / district"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">City *</label>
            <input {...register('base.city')} className="input-field w-full" placeholder="e.g. Manchester" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Postcode *</label>
            <input
              {...register('base.postcode')}
              className="input-field w-full"
              placeholder="e.g. M1 1AA"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Building Number</label>
            <input
              {...register('base.buildingNumber')}
              className="input-field w-full"
              placeholder="e.g. 45"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Bedrooms</label>
            <input
              type="number"
              {...register('base.bedrooms', { valueAsNumber: true })}
              className="input-field w-full"
              placeholder="3"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Bathrooms</label>
            <input
              type="number"
              {...register('base.bathrooms', { valueAsNumber: true })}
              className="input-field w-full"
              placeholder="1"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Property Type</label>
            <select {...register('base.propertyType')} className="input-field w-full">
              <option value="">Select...</option>
              <option value="TERRACED">Terraced</option>
              <option value="FLAT">Flat</option>
              <option value="DETACHED">Detached</option>
              <option value="SEMI_DETACHED">Semi-detached</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Description</label>
          <textarea
            {...register('base.description')}
            className="input-field w-full h-24 resize-none"
            placeholder="Describe the property..."
          />
        </div>
      </div>
    </div>
  );

  const renderHmoRoomsStep = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Room Configuration</h2>
      <p className="text-sm text-slate-400 mb-4">Add each room in the property</p>

      <div className="space-y-3">
        {hmoRoomArray.fields.map((field, index) => (
          <div key={field.id} className="glass-card p-4">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-medium text-slate-300">Room {index + 1}</span>
              <button
                type="button"
                onClick={() => hmoRoomArray.remove(index)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name</label>
                <input
                  {...register(`hmoRooms.${index}.name`)}
                  className="input-field w-full"
                  placeholder="Room 1"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Type</label>
                <select {...register(`hmoRooms.${index}.roomType`)} className="input-field w-full">
                  <option value="DOUBLE_EN_SUITE">Double en-suite</option>
                  <option value="DOUBLE_SHARED">Double shared</option>
                  <option value="SINGLE_EN_SUITE">Single en-suite</option>
                  <option value="SINGLE_SHARED">Single shared</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Monthly Rent (£)</label>
                <input
                  type="number"
                  {...register(`hmoRooms.${index}.monthlyRentPence`, { valueAsNumber: true })}
                  className="input-field w-full"
                  placeholder="500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => hmoRoomArray.append({ name: '', roomType: 'DOUBLE_EN_SUITE', monthlyRentPence: 0 })}
        className="btn-secondary mt-3"
      >
        + Add Room
      </button>

      <HmoRoomCalculator
        rooms={hmoRooms as HmoRoomDto[]}
        rentToLandlordPence={(ssd as any).rentToLandlordPence}
        billsPence={(ssd as any).billsPence}
        cleaningPence={(ssd as any).cleaningPence}
      />
    </div>
  );

  const renderSaRevenueStep = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">SA Revenue & Costs</h2>
      <p className="text-sm text-slate-400 mb-4">Serviced Accommodation financial inputs</p>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Nightly Rate (£) *</label>
            <input
              type="number"
              step="0.01"
              {...register('strategySpecificData.nightlyRatePence', { valueAsNumber: true })}
              className="input-field w-full"
              placeholder="100"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Occupancy Rate (%) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              {...register('strategySpecificData.occupancyRate', { valueAsNumber: true })}
              className="input-field w-full"
              placeholder="0.70"
            />
          </div>
        </div>

        <div className="border-t border-deep-600 pt-4">
          <p className="text-sm text-slate-300 mb-3">Operating Costs</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Rent (£) *</label>
              <input
                type="number"
                {...register('strategySpecificData.rentPence', { valueAsNumber: true })}
                className="input-field w-full"
                placeholder="1500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Bills (£)</label>
              <input
                type="number"
                {...register('strategySpecificData.billsPence', { valueAsNumber: true })}
                className="input-field w-full"
                placeholder="300"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Booking Fee (£)</label>
              <input
                type="number"
                {...register('strategySpecificData.bookingFeePence', { valueAsNumber: true })}
                className="input-field w-full"
                placeholder="200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Cleaning (£)</label>
              <input
                type="number"
                {...register('strategySpecificData.cleaningCostPence', { valueAsNumber: true })}
                className="input-field w-full"
                placeholder="150"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Management (£)</label>
              <input
                type="number"
                {...register('strategySpecificData.managementCostPence', { valueAsNumber: true })}
                className="input-field w-full"
                placeholder="250"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Other Costs (£)</label>
              <input
                type="number"
                {...register('strategySpecificData.otherCostsPence', { valueAsNumber: true })}
                className="input-field w-full"
                placeholder="100"
              />
            </div>
          </div>
        </div>
      </div>

      <SaCalculator
        nightlyRatePence={(ssd as any).nightlyRatePence ?? 0}
        occupancyRate={(ssd as any).occupancyRate ?? 0}
        rentPence={(ssd as any).rentPence ?? 0}
        billsPence={(ssd as any).billsPence}
        bookingFeePence={(ssd as any).bookingFeePence}
        cleaningCostPence={(ssd as any).cleaningCostPence}
        managementCostPence={(ssd as any).managementCostPence}
        otherCostsPence={(ssd as any).otherCostsPence}
      />
    </div>
  );

  const renderSellPricingStep = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Sell Property — Pricing</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Asking Price (£)</label>
          <input
            type="number"
            {...register('strategySpecificData.askingPricePence', { valueAsNumber: true })}
            className="input-field w-full"
            placeholder="250000"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Market Value (£)</label>
          <input
            type="number"
            {...register('strategySpecificData.marketValuePence', { valueAsNumber: true })}
            className="input-field w-full"
            placeholder="275000"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Deposit (£)</label>
          <input
            type="number"
            {...register('strategySpecificData.depositPence', { valueAsNumber: true })}
            className="input-field w-full"
            placeholder="62500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Mortgage Interest Rate</label>
          <input
            type="number"
            step="0.001"
            {...register('strategySpecificData.mortgageInterestRate', { valueAsNumber: true })}
            className="input-field w-full"
            placeholder="0.045"
          />
        </div>
      </div>
    </div>
  );

  const renderLeaseBaseStep = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Lease Option Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Price (£) *</label>
          <input
            type="number"
            {...register('strategySpecificData.pricePence', { valueAsNumber: true })}
            className="input-field w-full"
            placeholder="150000"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Potential Income (£)</label>
          <input
            type="number"
            {...register('strategySpecificData.potentialIncomePence', { valueAsNumber: true })}
            className="input-field w-full"
            placeholder="12000"
          />
        </div>
      </div>
    </div>
  );

  const renderPortfolioAssetsStep = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Portfolio Assets</h2>
      <p className="text-sm text-slate-400 mb-4">Add each property in the portfolio</p>

      <div className="space-y-3">
        {portfolioAssetArray.fields.map((field, index) => (
          <div key={field.id} className="glass-card p-4">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-medium text-slate-300">Asset {index + 1}</span>
              <button
                type="button"
                onClick={() => portfolioAssetArray.remove(index)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name</label>
                <input
                  {...register(`portfolioAssets.${index}.name`)}
                  className="input-field w-full"
                  placeholder="Property 1"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Value (£)</label>
                <input
                  type="number"
                  {...register(`portfolioAssets.${index}.valuePence`, { valueAsNumber: true })}
                  className="input-field w-full"
                  placeholder="200000"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Notes</label>
                <input
                  {...register(`portfolioAssets.${index}.notes`)}
                  className="input-field w-full"
                  placeholder="e.g. 3-bed freehold"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => portfolioAssetArray.append({ name: '', valuePence: 0, notes: '', order: 0 })}
        className="btn-secondary mt-3"
      >
        + Add Asset
      </button>
    </div>
  );

  const renderRentTermsStep = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Commercial Terms</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Rent Term</label>
          <input
            {...register('strategySpecificData.rentTerm')}
            className="input-field w-full"
            placeholder="e.g. 12 months"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Rent to Landlord (£)</label>
          <input
            type="number"
            {...register('strategySpecificData.rentToLandlordPence', { valueAsNumber: true })}
            className="input-field w-full"
            placeholder="1500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Deposit (£)</label>
          <input
            type="number"
            {...register('strategySpecificData.depositPence', { valueAsNumber: true })}
            className="input-field w-full"
            placeholder="1500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Contract Length (months)</label>
          <input
            type="number"
            {...register('strategySpecificData.contractLengthMonths', { valueAsNumber: true })}
            className="input-field w-full"
            placeholder="12"
          />
        </div>
      </div>
    </div>
  );

  const renderAgencyNetworkStep = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Agency & Network</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Agency Details</label>
          <textarea
            {...register('strategySpecificData.agencyDetails')}
            className="input-field w-full h-20 resize-none"
            placeholder="Your agency or sourcer details..."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Finder Fee (£)</label>
            <input
              type="number"
              {...register('strategySpecificData.finderFeePence', { valueAsNumber: true })}
              className="input-field w-full"
              placeholder="5000"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" {...register('strategySpecificData.coSourceAllowed')} />
            <span className="text-sm text-slate-300">Happy to co-source</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    const step = steps[currentStep];
    if (!step) return null;

    switch (step.id) {
      case 'category':
        return renderCategoryStep();
      case 'strategy':
        return renderStrategyStep();
      case 'section-base-info':
        return renderBaseInfoStep();
      case 'section-hmo-rooms':
        return renderHmoRoomsStep();
      case 'section-sa-revenue':
        return renderSaRevenueStep();
      case 'section-sell-pricing':
      case 'section-sell-cost-to-buy':
      case 'section-sell-ownership':
        return renderSellPricingStep();
      case 'section-lease-base':
        return renderLeaseBaseStep();
      case 'section-portfolio-assets':
        return renderPortfolioAssetsStep();
      case 'section-rent-terms':
        return renderRentTermsStep();
      case 'section-agency-network':
        return renderAgencyNetworkStep();
      default: {
        const sectionId = step.id.replace('section-', '');
        const sectionDef = SECTION_DEFS[sectionId];
        return (
          <div>
            <h2 className="text-xl font-semibold mb-3">{sectionDef?.label ?? sectionId}</h2>
            <p className="text-sm text-slate-400">Fields for this section will appear here.</p>
          </div>
        );
      }
    }
  };

  const renderSummary = () => {
    const hmoIncome =
      hmoRooms.length > 0
        ? calcHmoGrossMonthlyIncome(
            (hmoRooms as HmoRoomDto[]).map((r) => ({ monthlyRentPence: poundsToPence(r.monthlyRentPence) })),
          )
        : null;
    const ssdAny = ssd as Record<string, any>;

    return (
      <div>
        <h2 className="text-xl font-semibold mb-6">Review & Submit</h2>
        <div className="space-y-4">
          {/* Category & Strategy */}
          <div className="glass-card p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Category</p>
                <p className="text-base font-medium mt-1">
                  {CATEGORY_CONFIG.find((c) => c.category === selectedCategory)?.label ?? selectedCategory}
                </p>
              </div>
              {selectedStrategy && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Strategy</p>
                  <p className="text-base font-medium mt-1">
                    {activeCategoryConfig?.strategies.find((s) => s.strategy === selectedStrategy)?.label ??
                      selectedStrategy}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* HMO rooms summary */}
          {hmoRooms.length > 0 && (
            <div className="glass-card p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">
                {hmoRooms.length} Room(s)
              </p>
              <div className="space-y-1">
                {hmoRooms.map((room: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{room.name || `Room ${i + 1}`}</span>
                    <span className="text-slate-300">{formatGBP(poundsToPence(room.monthlyRentPence))}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-deep-600 mt-2 pt-2 flex justify-between text-sm">
                <span className="font-medium">Gross Monthly Income</span>
                <span className="gradient-text font-semibold">{formatGBP(hmoIncome!)}</span>
              </div>
            </div>
          )}

          {/* SA summary */}
          {ssdAny.nightlyRatePence && ssdAny.occupancyRate && (
            <div className="glass-card p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">SA Projection</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span>Monthly Income</span>
                <span className="text-right gradient-text font-medium">
                  {formatGBP(calcSaMonthlyIncome(ssdAny.occupancyRate, poundsToPence(ssdAny.nightlyRatePence)))}
                </span>
                <span>Yearly Income</span>
                <span className="text-right gradient-text font-medium">
                  {formatGBP(calcSaYearlyIncome(ssdAny.occupancyRate, poundsToPence(ssdAny.nightlyRatePence)))}
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {saveError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{saveError}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Main render ──

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                i === currentStep
                  ? 'bg-gold-500/20 text-gold-400 ring-1 ring-gold-500/30'
                  : i < currentStep
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-deep-700 text-slate-400',
              )}
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                  i <= currentStep ? 'bg-gold-500 text-deep-900' : 'bg-deep-600 text-slate-400',
                )}
              >
                {i + 1}
              </span>
              {step.label}
            </div>
            {i < steps.length - 1 && <div className="w-4 h-px bg-deep-600" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="glass-card p-6">
        {steps[currentStep]?.id === 'summary' ? renderSummary() : renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 0}
          className="btn-secondary disabled:opacity-30"
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          {selectedCategory && (
            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              disabled={isSubmitting}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-30"
            >
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
          )}

          {isLastStep ? (
            <button
              type="button"
              onClick={() => handleSave('PUBLISHED')}
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={!selectedCategory}
              className="btn-primary disabled:opacity-30"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}