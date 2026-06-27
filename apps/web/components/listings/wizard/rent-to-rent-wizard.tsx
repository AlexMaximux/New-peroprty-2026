'use client';

import { useReducer, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CATEGORY_CONFIG } from '@propvest/shared';
import { presignUpload, confirmMedia } from '@/lib/api';
import type { StagedPhoto } from '@/components/listings/staged-photo-uploader';

import {
  wizardReducer,
  createInitialWizardState,
  type WizardPath,
  type SectionId,
} from './types';

// Section components
import AddressSection from './sections/address-section';
import HmoDetailsSection from './sections/hmo-details-section';
import RentTermSection from './sections/rent-term-section';
import HmoRoomsIncomeSection from './sections/hmo-rooms-income-section';
import SaDetailsSection from './sections/sa-details-section';
import SaIncomeSection from './sections/sa-income-section';
import BlockUnitMixSection from './sections/block-unit-mix-section';
import BlockPerUnitSection from './sections/block-per-unit-section';
import BlockSummarySection from './sections/block-summary-section';
import AgencyDetailsSection from './sections/agency-details-section';
import MediaSection from './sections/media-section';
import HmoSummarySection from './sections/hmo-summary-section';
import SaSummarySection from './sections/sa-summary-section';
// Sell Property sections
import SellOwnershipSection from './sections/sell-ownership-section';
import SellPricingSection from './sections/sell-pricing-section';
import SellCostToBuySection from './sections/sell-cost-to-buy-section';
import SellFinanceSection from './sections/sell-finance-section';
import SellAddValueSection from './sections/sell-add-value-section';
import SellSummarySection from './sections/sell-summary-section';

interface Props {
  onDraftSaved?: (id: string, failedFiles?: string[]) => void;
}

// ── Section registry ──
// Extend this array when adding a new section so guard + tests catch
// missing component registrations.
export const WIZARD_REGISTERED_SECTIONS: SectionId[] = [
  'r2r-address', 'hmo-details', 'rent-term', 'hmo-rooms-income',
  'sa-details', 'sa-income', 'block-unit-mix', 'block-per-unit',
  'agency-details', 'media',
  'hmo-summary', 'sa-summary', 'block-summary',
  // Sell Property
  'sell-ownership', 'sell-pricing', 'sell-cost-to-buy', 'sell-finance',
  'sell-add-value', 'sell-summary',
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pv_access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Rendertown ────────────────────────────────────────────────────────────

function StepIndicator({ steps, currentIndex }: { steps: string[]; currentIndex: number }) {
  return (
    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              i === currentIndex
                ? 'bg-gold-500/20 text-gold-400 ring-1 ring-gold-500/30'
                : i < currentIndex
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-deep-700 text-slate-400',
            )}
          >
            <span className={cn(
              'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
              i <= currentIndex ? 'bg-gold-500 text-deep-900' : 'bg-deep-600 text-slate-400',
            )}>
              {i + 1}
            </span>
            {label}
          </div>
          {i < steps.length - 1 && <div className="w-4 h-px bg-deep-600" />}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function RentToRentWizard({ onDraftSaved }: Props) {
  const router = useRouter();
  const [state, dispatch] = useReducer(wizardReducer, null, createInitialWizardState);

  const { path, currentStepIndex, steps, sectionData, isSubmitting, error } = state;
  const currentStep = steps[currentStepIndex];

  // Staged photos (not persisted in reducer — voluminous binary data)
  const stagedPhotosRef = useMemo<{ current: StagedPhoto[] }>(() => ({ current: [] }), []);

  // Step labels for indicator
  const stepLabels = useMemo(() => {
    const labels: string[] = [];
    for (const s of steps) {
      if (s.kind === 'category-select') labels.push('Category');
      else if (s.kind === 'strategy-select') labels.push('Strategy');
      else if (s.kind === 'section') {
        const map: Record<string, string> = {
          'r2r-address': 'Address',
          'hmo-details': 'HMO Details',
          'rent-term': 'Rent Term',
          'hmo-rooms-income': 'Room Rents',
          'sa-details': 'SA Details',
          'sa-income': 'Revenue',
          'block-unit-mix': 'Unit Mix',
          'block-per-unit': 'Per Unit',
          'block-summary': 'Block Summary',
          'agency-details': 'Agency',
          'media': 'Photos',
          'hmo-summary': 'Summary',
          'sa-summary': 'Summary',
          // Sell Property
          'sell-ownership': 'Ownership',
          'sell-pricing': 'Pricing',
          'sell-cost-to-buy': 'Cost to Buy',
          'sell-finance': 'Finance',
          'sell-add-value': 'Add Value',
          'sell-summary': 'Summary',
        };
        labels.push(map[s.sectionId] ?? s.sectionId);
      } else if (s.kind === 'summary') labels.push('Review');
    }
    return labels;
  }, [steps]);

  const goBack = useCallback(() => {
    dispatch({ type: 'GO_TO_STEP', index: currentStepIndex - 1 });
  }, [currentStepIndex]);

  const goForward = useCallback(() => {
    const next = currentStepIndex + 1;
    // If next step is summary, skip past it to submit
    if (steps[next]?.kind === 'summary') {
      dispatch({ type: 'GO_TO_STEP', index: next });
    } else {
      dispatch({ type: 'GO_TO_STEP', index: next });
    }
  }, [currentStepIndex, steps]);

  // ── Category/Strategy selection ──

  const selectCategory = useCallback((cat: string) => {
    if (cat === 'RENT_TO_RENT') {
      const strategy = path?.strategy ?? 'HMO';
      dispatch({ type: 'SELECT_PATH', path: { category: 'RENT_TO_RENT', strategy } as WizardPath });
      return;
    }
    if (cat === 'SELL_PROPERTY') {
      const strategy = path?.strategy ?? 'SINGLE_LET';
      dispatch({ type: 'SELECT_PATH', path: { category: 'SELL_PROPERTY', strategy } as WizardPath });
      return;
    }
    // For other categories: redirect
    router.push(`/agency/listings/new?cat=${cat}`);
  }, [router, path]);

  const selectStrategy = useCallback((cat: string, strategy: string) => {
    dispatch({ type: 'SELECT_PATH', path: { category: cat as any, strategy: strategy as any } });
    dispatch({ type: 'GO_TO_STEP', index: 2 });
  }, []);

  // ── Section data handlers ──

  const onSectionNext = useCallback((sectionId: SectionId, data: unknown) => {
    dispatch({ type: 'SET_SECTION_DATA', sectionId, data });
    const nextIdx = currentStepIndex + 1;
    dispatch({ type: 'GO_TO_STEP', index: Math.min(nextIdx, steps.length - 1) });
  }, [currentStepIndex, steps.length]);

  // ── R2R Submit ──

  const handleSubmit = useCallback(async () => {
    if (!path) return;
    dispatch({ type: 'SET_SUBMITTING', value: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      // Compose from section data
      const address = sectionData['r2r-address'] as any;
      const agencyDetails = sectionData['agency-details'] as any;

      if (path.strategy === 'HMO') {
        const hmoDetails = sectionData['hmo-details'] as any;
        const rentTerm = sectionData['rent-term'] as any;

        if (!address || !hmoDetails || !rentTerm) {
          throw new Error('Missing required sections');
        }

        const payload = {
          category: 'RENT_TO_RENT',
          strategy: 'HMO',
          status: 'PUBLISHED',
          base: {
            title: `${address.houseNumber ? address.houseNumber + ' ' : ''}${address.addressLine1}`,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 ?? '',
            city: address.city,
            postcode: address.postcode,
            buildingNumber: address.houseNumber ?? '',
            region: address.region === 'MANUAL' ? (address.manualRegion ?? '') : address.region,
            propertyType: address.propertyType,
            propertyTypeOther: address.propertyTypeOther ?? '',
            bedrooms: hmoDetails.rooms.length,
            latitude: address.latitude ?? undefined,
            longitude: address.longitude ?? undefined,
            isLicensed: hmoDetails.isLicensed ?? (hmoDetails.status === 'LICENCED'),
            isTenanted: hmoDetails.isTenanted ?? (hmoDetails.status === 'TENANTED'),
            needsRefurb: hmoDetails.needsRefurb ?? (hmoDetails.status === 'NEEDS_REFURB'),
            refurbQuoteType: (hmoDetails.needsRefurb ?? hmoDetails.status === 'NEEDS_REFURB') ? (hmoDetails.refurbQuoteType ?? undefined) : undefined,
            refurbCostPence: (hmoDetails.needsRefurb ?? hmoDetails.status === 'NEEDS_REFURB') ? (hmoDetails.refurbCostPence ?? undefined) : undefined,
            hasLivingRoom: hmoDetails.hasLivingRoom,
            hasGarden: hmoDetails.garden === 'YES',
            gardenNotes: hmoDetails.gardenNotes ?? '',
            parking: hmoDetails.parking === 'YES' ? String(hmoDetails.parkingSpaces ?? 1) : hmoDetails.parking,
            furnishedStatus: hmoDetails.furnished ? 'FURNISHED' : 'UNFURNISHED',
            furnishingQuality: hmoDetails.furnishingQuality ?? '',
            furnishingNotes: hmoDetails.furnishingQualityOther ?? '',
          },
          hmoRooms: hmoDetails.rooms.map((r: any, i: number) => ({
            name: r.name ?? `Room ${i + 1}`,
            roomType: r.roomType ?? 'DOUBLE_EN_SUITE',
            monthlyRentPence: r.monthlyRentPence,
          })),
          strategySpecificData: {
            rentToLandlordPence: rentTerm.rentToLandlordPence,
            depositPence: rentTerm.depositPence,
            contractLengthMonths: rentTerm.contractLength ?? 12,
            finderFeePence: rentTerm.finderFeePence,
            happyToCoSource: rentTerm.happyToCoSource,
            managementEnabled: rentTerm.managementEnabled,
            managementRatePercent: rentTerm.managementRatePercent,
            billsPence: rentTerm.bills.reduce((s: number, b: any) => s + b.amountPence, 0),
            cleaningPence: rentTerm.cleaningPence,
            agencyDetails: agencyDetails?.agencyDetails ?? '',
            // HMO checkbox fields
            licenceNote: hmoDetails.licenceNote ?? undefined,
            licenceNoteExplanation: hmoDetails.licenceNoteExplanation ?? undefined,
            tenancyType: hmoDetails.tenancyType ?? undefined,
            roomsTenanted: hmoDetails.roomsTenanted ?? undefined,
          },
        };

        await submitListing(payload, stagedPhotosRef.current);
      } else if (path.strategy === 'SA') {
        const saDetails = sectionData['sa-details'] as any;
        const rentTerm = sectionData['rent-term'] as any;
        const saRevenue = sectionData['sa-income'] as any;

        if (!address || !saDetails || !rentTerm || !saRevenue) {
          throw new Error('Missing required sections');
        }

        const payload = {
          category: 'RENT_TO_RENT',
          strategy: 'SA',
          status: 'PUBLISHED',
          base: {
            title: `${address.houseNumber ? address.houseNumber + ' ' : ''}${address.addressLine1}`,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 ?? '',
            city: address.city,
            postcode: address.postcode,
            buildingNumber: address.houseNumber ?? '',
            region: address.region === 'MANUAL' ? (address.manualRegion ?? '') : address.region,
            propertyType: address.propertyType,
            propertyTypeOther: address.propertyTypeOther ?? '',
            bedrooms: saDetails.bedrooms,
            bathrooms: saDetails.bathrooms,
            latitude: address.latitude ?? undefined,
            longitude: address.longitude ?? undefined,
            furnishedStatus: saDetails.furnished ? 'FURNISHED' : 'UNFURNISHED',
            furnishingQuality: saDetails.furnishingQuality ?? '',
            furnishingNotes: saDetails.furnishingQualityOther ?? '',
          },
          strategySpecificData: {
            rentPence: rentTerm.rentToLandlordPence,
            rentToLandlordPence: rentTerm.rentToLandlordPence,
            depositPence: rentTerm.depositPence,
            contractLengthMonths: rentTerm.contractLength ?? 12,
            finderFeePence: rentTerm.finderFeePence,
            happyToCoSource: rentTerm.happyToCoSource,
            managementEnabled: rentTerm.managementEnabled,
            managementRatePercent: rentTerm.managementRatePercent,
            billsPence: rentTerm.bills.reduce((s: number, b: any) => s + b.amountPence, 0),
            cleaningCostPence: rentTerm.cleaningPence,
            maxGuests: saDetails.accommodates,
            furnished: saDetails.furnished,
            furnishingQuality: saDetails.furnishingQuality ?? '',
            nightlyRatePence: saRevenue.nightlyRatePence,
            occupancyRate: saRevenue.occupancyRate,
            bookingFeePence: saRevenue.bookingFeePence ?? 0,
            maintenanceRate: saRevenue.maintenanceRate ?? 0.05,
            otherCostsPence: saRevenue.otherCostsPence ?? 0,
            agencyDetails: agencyDetails?.agencyDetails ?? '',
          },
        };

        await submitListing(payload, stagedPhotosRef.current);
      }

      // Success
      if (onDraftSaved) {
        onDraftSaved('new', []);
      } else {
        router.push('/agency/listings');
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message ?? 'Publish failed' });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  }, [path, sectionData, stagedPhotosRef, onDraftSaved, router]);

  // ── Sell Property Submit ──

  const handleSellSubmit = useCallback(async () => {
    if (!path) return;
    dispatch({ type: 'SET_SUBMITTING', value: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const address = sectionData['r2r-address'] as any;
      const ownership = sectionData['sell-ownership'] as any;
      const pricing = sectionData['sell-pricing'] as any;
      const costToBuy = sectionData['sell-cost-to-buy'] as any;
      const finance = sectionData['sell-finance'] as any;
      const addValue = sectionData['sell-add-value'] as any;
      const agencyDetails = sectionData['agency-details'] as any;

      if (!address || !pricing || !costToBuy) {
        throw new Error('Missing required sections');
      }

      const payload = {
        category: 'SELL_PROPERTY',
        strategy: path.strategy,
        status: 'PUBLISHED',
        base: {
          title: `${address.houseNumber ? address.houseNumber + ' ' : ''}${address.addressLine1}`,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 ?? '',
          city: address.city,
          postcode: address.postcode,
          buildingNumber: address.houseNumber ?? '',
          region: address.region === 'MANUAL' ? (address.manualRegion ?? '') : address.region,
          propertyType: address.propertyType,
          propertyTypeOther: address.propertyTypeOther ?? '',
          latitude: address.latitude ?? undefined,
          longitude: address.longitude ?? undefined,
        },
        strategySpecificData: {
          // Ownership & legal
          ownershipType: ownership?.ownershipType,
          leaseExpiryDate: ownership?.leaseExpiryDate,
          currentRentPence: ownership?.currentRentPence,

          // Pricing
          askingPricePence: pricing.askingPricePence,
          marketValuePence: pricing.marketValuePence,
          estimatedValuePence: pricing.estimatedValuePence,
          propertySize: pricing.propertySize,
          existingRentPence: pricing.existingRentPence,
          potentialRentPence: pricing.potentialRentPence,
          ricsType: pricing.ricsType,

          // Cost to buy
          depositPence: costToBuy.depositPence,
          stampDutyPence: costToBuy.stampDutyPence,
          finderFeePence: costToBuy.finderFeePence,
          legalFeesPence: costToBuy.legalFeesPence,
          otherAcquisitionCostsPence: costToBuy.otherAcquisitionCostsPence,

          // Finance
          mortgageInterestRate: finance?.mortgageInterestRate,
          financeNotes: finance?.financeNotes,

          // Add-value
          addValueOptions: addValue?.addValueOptions,
          refurbCostPence: addValue?.refurbCostPence,
          developmentCostPence: addValue?.developmentCostPence,
          builderInPlace: addValue?.builderInPlace,
          quoteAvailable: addValue?.quoteAvailable,
          estimateAmountPence: addValue?.estimateAmountPence,

          // Agency
          agencyDetails: agencyDetails?.agencyDetails ?? '',
        },
      };

      await submitListing(payload, stagedPhotosRef.current);

      // Success
      if (onDraftSaved) {
        onDraftSaved('new', []);
      } else {
        router.push('/agency/listings');
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message ?? 'Publish failed' });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  }, [path, sectionData, stagedPhotosRef, onDraftSaved, router]);

  const submitListing = async (payload: Record<string, unknown>, photos: StagedPhoto[]) => {
    // POST to API
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

    // Upload photos after listing created
    const failedFiles: string[] = [];
    for (const photo of photos) {
      try {
        const { uploadUrl, fileKey } = await presignUpload(listing.id, photo.file.name, photo.file.type);
        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: photo.file,
          headers: { 'Content-Type': photo.file.type },
        });
        if (!putRes.ok) throw new Error(`HTTP ${putRes.status}`);
        await confirmMedia(listing.id, fileKey, photo.file.type, photo.isPrimary);
      } catch {
        failedFiles.push(photo.file.name);
      }
    }

    // Cleanup object URLs
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));

    if (failedFiles.length > 0) {
      console.warn('Upload failures:', failedFiles);
    }

    // Navigate to new listing
    router.push(`/agency/listings/${listing.id}`);
  };

  // ── Render current step ──

  const renderStep = () => {
    if (!currentStep) return null;

    switch (currentStep.kind) {
      case 'category-select':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-6">Listing Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORY_CONFIG.filter(c => c.category === 'RENT_TO_RENT' || c.category === 'SELL_PROPERTY').map((cat) => (
                <button key={cat.category} type="button"
                  onClick={() => selectCategory(cat.category)}
                  className="glass-card p-5 text-left transition-all duration-200 hover:bg-deep-600 ring-2 ring-gold-400 shadow-glow-gold"
                >
                  <p className="font-semibold text-base">{cat.label}</p>
                  <p className="text-xs text-slate-400 mt-1">{cat.strategies.length} strategies</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'strategy-select': {
        // Determine which category we're selecting strategies for
        const currentCategory = path?.category ?? 'RENT_TO_RENT';
        const strategies = CATEGORY_CONFIG.find(c => c.category === currentCategory)?.strategies ?? [];
        return (
          <div>
            <h2 className="text-xl font-semibold mb-6">Investment Strategy</h2>
            <p className="text-sm text-slate-400 mb-4">
              {CATEGORY_CONFIG.find(c => c.category === currentCategory)?.label ?? currentCategory} — choose a deal structure
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {strategies.map((s) => (
                <button key={s.strategy} type="button"
                  onClick={() => selectStrategy(currentCategory, s.strategy)}
                  className="glass-card p-5 text-left transition-all duration-200 hover:bg-deep-600"
                >
                  <p className="font-semibold text-base">{s.label}</p>
                </button>
              ))}
            </div>
          </div>
        );
      }

      case 'section': {
        const sec = currentStep.sectionId;

        if (sec === 'r2r-address') {
          return <AddressSection initialData={sectionData['r2r-address'] as any} onNext={(d) => onSectionNext('r2r-address', d)} onBack={goBack} />;
        }
        if (sec === 'hmo-details') {
          return <HmoDetailsSection initialData={sectionData['hmo-details'] as any} onNext={(d) => onSectionNext('hmo-details', d)} onBack={goBack} />;
        }
        if (sec === 'rent-term') {
          return <RentTermSection initialData={sectionData['rent-term'] as any} onNext={(d) => onSectionNext('rent-term', d)} onBack={goBack} />;
        }
        if (sec === 'hmo-rooms-income') {
          const hmoDetails = sectionData['hmo-details'] as any;
          return <HmoRoomsIncomeSection rooms={hmoDetails?.rooms ?? []} initialData={sectionData['hmo-rooms-income'] as any}
            onNext={(d) => onSectionNext('hmo-rooms-income', d)} onBack={goBack} />;
        }
        if (sec === 'sa-details') {
          return <SaDetailsSection initialData={sectionData['sa-details'] as any} onNext={(d) => onSectionNext('sa-details', d)} onBack={goBack} />;
        }
        if (sec === 'sa-income') {
          return <SaIncomeSection initialData={sectionData['sa-income'] as any} onNext={(d) => onSectionNext('sa-income', d)} onBack={goBack} />;
        }
        if (sec === 'block-unit-mix') {
          return <BlockUnitMixSection initialData={sectionData['block-unit-mix'] as any} onNext={(d) => onSectionNext('block-unit-mix', d)} onBack={goBack} />;
        }
        if (sec === 'block-per-unit') {
          return <BlockPerUnitSection onNext={(d) => onSectionNext('block-per-unit', d)} onBack={goBack} />;
        }
        if (sec === 'agency-details') {
          return <AgencyDetailsSection onNext={(d) => onSectionNext('agency-details', d)} onBack={goBack} />;
        }
        if (sec === 'media') {
          return <MediaSection initialData={stagedPhotosRef.current} onNext={(photos) => { stagedPhotosRef.current = photos; goForward(); }} onBack={goBack} />;
        }
        if (sec === 'hmo-summary') {
          return (
            <HmoSummarySection
              hmoDetails={sectionData['hmo-details'] as any}
              rentTerm={sectionData['rent-term'] as any}
              onConfirm={handleSubmit}
              onBack={goBack}
              isSubmitting={isSubmitting}
            />
          );
        }
        if (sec === 'sa-summary') {
          return (
            <SaSummarySection
              saDetails={sectionData['sa-details'] as any}
              rentTerm={sectionData['rent-term'] as any}
              saRevenue={sectionData['sa-income'] as any}
              onConfirm={handleSubmit}
              onBack={goBack}
              isSubmitting={isSubmitting}
            />
          );
        }
        if (sec === 'block-summary') {
          return (
            <BlockSummarySection
              blockUnitMix={sectionData['block-unit-mix'] as any}
              onConfirm={handleSubmit}
              onBack={goBack}
              isSubmitting={isSubmitting}
            />
          );
        }
        // ── Sell Property sections ──
        if (sec === 'sell-ownership') {
          return <SellOwnershipSection initialData={sectionData['sell-ownership'] as any} onNext={(d) => onSectionNext('sell-ownership', d)} onBack={goBack} />;
        }
        if (sec === 'sell-pricing') {
          return <SellPricingSection initialData={sectionData['sell-pricing'] as any} onNext={(d) => onSectionNext('sell-pricing', d)} onBack={goBack} />;
        }
        if (sec === 'sell-cost-to-buy') {
          return <SellCostToBuySection initialData={sectionData['sell-cost-to-buy'] as any} onNext={(d) => onSectionNext('sell-cost-to-buy', d)} onBack={goBack} />;
        }
        if (sec === 'sell-finance') {
          return <SellFinanceSection initialData={sectionData['sell-finance'] as any} onNext={(d) => onSectionNext('sell-finance', d)} onBack={goBack} />;
        }
        if (sec === 'sell-add-value') {
          return <SellAddValueSection initialData={sectionData['sell-add-value'] as any} onNext={(d) => onSectionNext('sell-add-value', d)} onBack={goBack} />;
        }
        if (sec === 'sell-summary') {
          return (
            <SellSummarySection
              sellOwnership={sectionData['sell-ownership'] as any}
              sellPricing={sectionData['sell-pricing'] as any}
              sellCostToBuy={sectionData['sell-cost-to-buy'] as any}
              sellFinance={sectionData['sell-finance'] as any}
              sellAddValue={sectionData['sell-add-value'] as any}
              onConfirm={handleSellSubmit}
              onBack={goBack}
              isSubmitting={isSubmitting}
            />
          );
        }

        // Fallback — missing component registration
        if (process.env.NODE_ENV === 'development') {
          console.error(`[Wizard] No registered component for section "${sec}". Add to REGISTERED_SECTIONS array and render case.`);
          return (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 font-medium">Wizard Misconfigured</p>
              <p className="text-red-300 text-sm mt-1">Section &quot;{sec}&quot; has no registered component. Check the REGISTERED_SECTIONS array and renderStep switch.</p>
            </div>
          );
        }
        return <div className="text-slate-400">Section: {sec}</div>;
      }

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator steps={stepLabels} currentIndex={currentStepIndex} />

      <div className="glass-card p-6">
        {renderStep()}
      </div>

      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
