'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import NewListingForm from '@/components/listings/new-listing-form';
import type { CreateListingDto } from '@propvest/shared';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type JwtPayload = { sub: string; email: string; role: string };

function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    return { sub: json.sub, email: json.email, role: json.role };
  } catch {
    return null;
  }
}

/** Recursively divide all *Pence number fields by 100 (pence → pounds for form display). */
function penceToPounds(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.map(penceToPounds);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof val === 'number' && key.endsWith('Pence') && val !== 0) {
        result[key] = Math.round(val / 100);
      } else {
        result[key] = penceToPounds(val);
      }
    }
    return result;
  }
  return obj;
}

/** Map API listing response to CreateListingDto shape with pence→pounds conversion. */
function mapApiResponseToFormData(apiData: Record<string, unknown>): CreateListingDto {
  // Extract strategy-specific data (already in pence from API)
  const strategySpecificData = penceToPounds(apiData.strategySpecificData ?? {}) as Record<string, unknown>;

  // Extract hmoRooms (pence → pounds for form)
  const hmoRooms = (apiData.hmoRooms as any[] ?? []).map((room) => ({
    name: room.name ?? '',
    roomType: room.roomType ?? 'DOUBLE_EN_SUITE',
    monthlyRentPence: room.monthlyRentPence ? Math.round(room.monthlyRentPence / 100) : 0,
  }));

  // Extract portfolioAssets (pence → pounds for form)
  const portfolioAssets = (apiData.portfolioAssets as any[] ?? []).map((asset) => ({
    name: asset.name ?? '',
    assetType: asset.assetType ?? '',
    valuePence: asset.valuePence ? Math.round(asset.valuePence / 100) : 0,
    notes: asset.notes ?? '',
    order: asset.order ?? 0,
  }));

  return {
    category: apiData.category as any,
    strategy: apiData.strategy as any ?? null,
    status: apiData.status as any ?? 'DRAFT',
    base: {
      title: (apiData.title as string) ?? '',
      description: apiData.description as string ?? undefined,
      propertyType: apiData.propertyType as any ?? undefined,
      propertyTypeOther: apiData.propertyTypeOther as string ?? undefined,
      internalRef: apiData.internalRef as string ?? undefined,
      addressLine1: (apiData.addressLine1 as string) ?? '',
      addressLine2: apiData.addressLine2 as string ?? undefined,
      city: (apiData.city as string) ?? '',
      postcode: (apiData.postcode as string) ?? '',
      buildingNumber: apiData.buildingNumber as string ?? undefined,
      region: apiData.region as string ?? undefined,
      nation: apiData.nation as any ?? undefined,
      regionGroup: apiData.regionGroup as any ?? undefined,
      latitude: apiData.latitude as number ?? undefined,
      longitude: apiData.longitude as number ?? undefined,
      bedrooms: apiData.bedrooms as number ?? undefined,
      bathrooms: apiData.bathrooms as number ?? undefined,
      floorArea: apiData.floorArea as number ?? undefined,
      hasLivingRoom: apiData.hasLivingRoom as boolean ?? undefined,
      hasGarden: apiData.hasGarden as boolean ?? undefined,
      gardenNotes: apiData.gardenNotes as string ?? undefined,
      parking: apiData.parking as string ?? undefined,
      furnishedStatus: apiData.furnishedStatus as any ?? undefined,
      furnishingQuality: apiData.furnishingQuality as string ?? undefined,
      furnishingNotes: apiData.furnishingNotes as string ?? undefined,
      isVacant: apiData.isVacant as boolean ?? undefined,
      isTenanted: apiData.isTenanted as boolean ?? undefined,
      isLicensed: apiData.isLicensed as boolean ?? undefined,
      needsRefurb: apiData.needsRefurb as boolean ?? undefined,
      refurbQuoteType: apiData.refurbQuoteType as any ?? undefined,
      refurbCostPence: apiData.refurbCostPence as number ?? undefined,
    },
    strategySpecificData: strategySpecificData as Record<string, unknown>,
    hmoRooms,
    portfolioAssets,
    media: [],
  };
}

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [initialData, setInitialData] = useState<CreateListingDto | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pv_access_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    fetch(`${API}/listings/${params.id}`, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();

        // Ownership check
        const me = decodeJwt(token);
        const ownerUserId = data.agencyProfile?.userId ?? null;
        const isOwner = me?.sub != null && ownerUserId === me.sub;
        const isAdmin = me?.role === 'ADMIN';
        if (!isOwner && !isAdmin) {
          setDenied(true);
          setLoading(false);
          return;
        }

        // Map to form shape with pence→pounds conversion
        const formData = mapApiResponseToFormData(data);
        setInitialData(formData);
        setLoading(false);
      })
      .catch(() => {
        setDenied(true);
        setLoading(false);
      });
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card animate-pulse p-8">
          <div className="mb-4 h-8 w-1/3 rounded bg-deep-700" />
          <div className="space-y-3">
            <div className="h-4 w-3/4 rounded bg-deep-700" />
            <div className="h-4 w-1/2 rounded bg-deep-700" />
          </div>
        </div>
      </div>
    );
  }

  if (denied || !initialData) {
    notFound();
  }

  return (
    <div className="page-container">
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => router.push('/agency/listings')} className="hover:text-white transition">
          My Listings
        </button>
        <span>/</span>
        <span className="text-slate-300">Edit</span>
      </div>

      <NewListingForm
        listingId={params.id}
        initialData={initialData}
      />
    </div>
  );
}
