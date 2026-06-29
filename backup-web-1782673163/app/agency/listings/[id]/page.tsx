'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { calcHmoGrossMonthlyIncome } from '@propvest/shared';
import { formatGBP, formatPercent } from '@/lib/utils';
import { ImageGallery } from '@/components/listings/image-gallery';
import { ImageUploader } from '@/components/listings/image-uploader';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

type JwtPayload = { sub: string; email: string; role: string };

interface HmoRoom {
  id: string;
  name: string;
  roomType: string;
  monthlyRentPence: number;
}

interface AgencyListing {
  id: string;
  title: string;
  description: string | null;
  category: string;
  strategy: string | null;
  status: string;
  propertyType: string | null;
  propertyTypeOther: string | null;
  internalRef: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  buildingNumber: string | null;
  region: string | null;
  nation: string | null;
  regionGroup: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floorArea: number | null;
  hasLivingRoom: boolean | null;
  hasGarden: boolean | null;
  gardenNotes: string | null;
  parking: string | null;
  furnishedStatus: string | null;
  furnishingQuality: string | null;
  furnishingNotes: string | null;
  isVacant: boolean | null;
  isTenanted: boolean | null;
  isLicensed: boolean | null;
  needsRefurb: boolean | null;
  refurbQuoteType: string | null;
  refurbCostPence: number | null;
  askingPricePence: number | null;
  marketValuePence: number | null;
  estimatedValuePence: number | null;
  estimatedRoi: number | null;
  strategySpecificData: Record<string, unknown> | null;
  publishedAt: string | null;
  createdAt: string;
  media: { id: string; kind: string; fileKey: string; order: number; url?: string | null; isPrimary?: boolean; mimeType?: string; originalName?: string }[];
  hmoRooms: HmoRoom[];
  portfolioAssets: { id: string; name: string; valuePence: number | null; notes: string | null }[];
  agencyProfile: {
    id: string | null;
    userId: string | null;
    companyName: string | null;
    verificationStatus: string | null;
  } | null;
}

/** Decode JWT access token payload (client-side, no verification — auth enforced server-side). */
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

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge-yellow',
  PUBLISHED: 'badge-green',
  RESERVED: 'badge-blue',
  SOLD: 'badge-red',
  ARCHIVED: 'badge-red',
};

const VIEWABLE_PUBLIC_STATUSES = new Set(['PUBLISHED', 'RESERVED', 'SOLD']);

function MetricRow({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-medium ${gold ? 'text-gold-400' : 'text-white'}`}>{value}</span>
    </div>
  );
}

/** Renders strategy-specific JSONB fields for agency view */
function StrategyDataPanel({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;
  const entries = Object.entries(data).filter(
    ([k, v]) => v != null && v !== '' && !['managementEnabled', 'managementRatePercent'].includes(k),
  );
  if (entries.length === 0) return null;
  return (
    <div className="glass-card p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Strategy Data</h2>
      <div className="space-y-1.5 text-sm">
        {entries.map(([key, value]) => (
          <MetricRow
            key={key}
            label={key
              .replace(/([A-Z])/g, ' $1')
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .replace(/^./, (s) => s.toUpperCase())
              .replace(/ Pence/g, ' (£)')}
            value={
              typeof value === 'number' && (key.endsWith('Pence') || key.endsWith('CostsPence'))
                ? formatGBP(value)
                : String(value)
            }
          />
        ))}
      </div>
    </div>
  );
}

export default function AgencyListingManagePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<AgencyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string | null>(null);

  useEffect(() => {
    // Check sessionStorage for upload errors from create flow
    try {
      const key = `uploadErrors-${params.id}`;
      const stored = sessionStorage.getItem(key);
      if (stored) {
        setUploadErrors(stored);
        sessionStorage.removeItem(key);
      }
    } catch { /* ignore */ }
  }, [params.id]);

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
        return (await res.json()) as AgencyListing;
      })
      .then((data) => {
        const me = decodeJwt(token);
        const ownerUserId = data.agencyProfile?.userId ?? null;
        const isOwner = me?.sub != null && ownerUserId === me.sub;
        const isAdmin = me?.role === 'ADMIN';
        if (!isOwner && !isAdmin) {
          setDenied(true);
          setLoading(false);
          return;
        }
        setListing(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card animate-pulse p-8">
          <div className="mb-4 h-8 w-1/3 rounded bg-deep-700" />
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-deep-700" />
            <div className="h-4 w-1/2 rounded bg-deep-700" />
          </div>
        </div>
      </div>
    );
  }

  // Not found OR not owned → clean 404 via notFound()
  if (denied || !listing) {
    notFound();
  }

  const categoryLabel = listing.category.split('_').join(' ');
  const isHmo = listing.strategy === 'HMO';
  const hmoGrossMonthly =
    isHmo && listing.hmoRooms.length > 0 ? calcHmoGrossMonthlyIncome(listing.hmoRooms) : null;
  const isPubliclyViewable = VIEWABLE_PUBLIC_STATUSES.has(listing.status);

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => router.push('/agency/onboarding')} className="hover:text-white transition">
          Agency
        </button>
        <span>/</span>
        <span className="text-slate-300">{listing.title}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{listing.title}</h1>
          {listing.addressLine1 && (
            <p className="mt-1 text-sm text-slate-400">
              {[listing.buildingNumber, listing.addressLine1, listing.addressLine2, listing.city, listing.region, listing.postcode]
                .filter(Boolean)
                .join(', ')}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`badge ${STATUS_BADGE[listing.status] ?? 'badge-blue'}`}>
              {listing.status}
            </span>
            <span className="badge badge-green">{categoryLabel}</span>
            {listing.strategy && <span className="badge badge-yellow">{listing.strategy}</span>}
            {listing.propertyType && (
              <span className="badge badge-blue">{listing.propertyType.split('_').join(' ')}</span>
            )}
            {listing.propertyTypeOther && (
              <span className="badge badge-blue">{listing.propertyTypeOther}</span>
            )}
            {listing.internalRef && (
              <span className="badge badge-outline">Ref: {listing.internalRef}</span>
            )}
            {listing.needsRefurb && <span className="badge badge-yellow">Needs Refurb</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status note */}
          {listing.status === 'DRAFT' && (
            <div className="glass-card border-l-2 border-gold-500/60 p-4">
              <p className="text-sm text-slate-300">
                This is a draft. Publish it to request it go live — awaiting admin review before it becomes public.
              </p>
            </div>
          )}

          {/* Upload error banner */}
          {uploadErrors && (
            <div className="glass-card border-l-2 border-yellow-500/60 p-4">
              <p className="text-sm text-slate-300">
                <strong className="text-yellow-400">Upload issue:</strong> Some images failed to upload.
                You can retry using the uploader below.
              </p>
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-400">Show failed files</summary>
                <p className="mt-1 text-xs text-slate-400">{uploadErrors}</p>
              </details>
            </div>
          )}

          {/* Image gallery */}
          <div className="glass-card overflow-hidden p-5">
            <ImageGallery images={listing.media} />
            <div className="mt-3 flex items-center justify-between border-t border-deep-700 pt-3">
              <p className="text-xs text-slate-500">{listing.media.length} image(s)</p>
              <button
                onClick={() => setShowUploader(!showUploader)}
                className="text-xs font-medium text-gold-400 hover:text-gold-300 transition"
              >
                {showUploader ? 'Hide uploader' : 'Add images'}
              </button>
            </div>
          </div>

          {/* Inline image uploader */}
          {showUploader && (
            <div className="glass-card p-5">
              <ImageUploader
                listingId={listing.id}
                existingImages={listing.media.map((m) => ({
                  id: m.id,
                  fileKey: m.fileKey,
                  isPrimary: m.isPrimary ?? false,
                  url: m.url,
                }))}
              />
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div className="glass-card p-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">Description</h2>
              <p className="text-sm leading-relaxed text-slate-300">{listing.description}</p>
            </div>
          )}

          {/* HMO Rooms + calc summary */}
          {isHmo && listing.hmoRooms.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Room Configuration ({listing.hmoRooms.length})
              </h2>
              <div className="space-y-2">
                {listing.hmoRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between rounded-lg bg-deep-800 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{room.name}</p>
                      <p className="text-xs text-slate-500">{room.roomType.split('_').join(' ')}</p>
                    </div>
                    <span className="text-sm font-semibold text-gold-400">
                      {formatGBP(room.monthlyRentPence)}/mo
                    </span>
                  </div>
                ))}
                <div className="mt-3 rounded-lg bg-gold-500/5 p-3">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    HMO Summary
                  </h3>
                  <div className="space-y-1.5">
                    <MetricRow label="Rooms" value={String(listing.hmoRooms.length)} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Gross Monthly Income</span>
                      <span className="text-xs font-bold text-gold-400">
                        {hmoGrossMonthly != null ? `${formatGBP(hmoGrossMonthly)}/mo` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Gross Annual Income</span>
                      <span className="text-xs font-medium text-white">
                        {hmoGrossMonthly != null ? `${formatGBP(hmoGrossMonthly * 12)}/yr` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Assets */}
          {listing.portfolioAssets && listing.portfolioAssets.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Portfolio Assets ({listing.portfolioAssets.length})
              </h2>
              <div className="space-y-2">
                {listing.portfolioAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between rounded-lg bg-deep-800 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{asset.name}</p>
                      {asset.notes && <p className="text-xs text-slate-500">{asset.notes}</p>}
                    </div>
                    {asset.valuePence != null && (
                      <span className="text-sm font-semibold text-gold-400">{formatGBP(asset.valuePence)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <StrategyDataPanel data={listing.strategySpecificData} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Key details */}
          <div className="glass-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Key Details</h2>
            <div className="space-y-3">
              {listing.askingPricePence != null && (
                <MetricRow label="Asking Price" value={formatGBP(listing.askingPricePence)} gold />
              )}
              {listing.marketValuePence != null && (
                <MetricRow label="Market Value" value={formatGBP(listing.marketValuePence)} gold />
              )}
              {listing.estimatedValuePence != null && (
                <MetricRow label="Est. Value After" value={formatGBP(listing.estimatedValuePence)} gold />
              )}
              {listing.estimatedRoi != null && (
                <MetricRow label="Estimated ROI" value={formatPercent(Number(listing.estimatedRoi) * 0.01)} />
              )}
              {listing.media && listing.media.length > 0 && (
                <MetricRow label="Media Files" value={`${listing.media.length} file(s)`} />
              )}
              {listing.bedrooms != null && (
                <MetricRow label="Bedrooms" value={String(listing.bedrooms)} />
              )}
              {listing.bathrooms != null && (
                <MetricRow label="Bathrooms" value={String(listing.bathrooms)} />
              )}
              {listing.floorArea != null && (
                <MetricRow label="Floor Area" value={`${listing.floorArea} sq ft`} />
              )}
              {listing.nation && <MetricRow label="Nation" value={listing.nation.split('_').join(' ')} />}
              {listing.city && <MetricRow label="City" value={listing.city} />}
              {listing.furnishedStatus && (
                <MetricRow label="Furnished" value={listing.furnishedStatus.split('_').join(' ')} />
              )}
              {listing.furnishingQuality && (
                <MetricRow label="Furnishing Quality" value={listing.furnishingQuality} />
              )}
              {listing.furnishingNotes && (
                <MetricRow label="Furnishing Notes" value={listing.furnishingNotes} />
              )}
              {listing.parking && <MetricRow label="Parking" value={listing.parking} />}
              {listing.hasLivingRoom != null && (
                <MetricRow label="Living Room" value={listing.hasLivingRoom ? 'Yes' : 'No'} />
              )}
              {listing.hasGarden && (
                <MetricRow label="Garden" value={listing.gardenNotes ?? 'Yes'} />
              )}
              {listing.isVacant != null && (
                <MetricRow label="Vacant" value={listing.isVacant ? 'Yes' : 'No'} />
              )}
              {listing.isTenanted != null && (
                <MetricRow label="Tenanted" value={listing.isTenanted ? 'Yes' : 'No'} />
              )}
              {listing.isLicensed != null && (
                <MetricRow label="Licensed" value={listing.isLicensed ? 'Yes' : 'No'} />
              )}
              {listing.needsRefurb != null && (
                <MetricRow label="Needs Refurb" value={listing.needsRefurb ? 'Yes' : 'No'} />
              )}
              {listing.refurbCostPence != null && (
                <MetricRow label="Refurb Cost" value={formatGBP(listing.refurbCostPence)} />
              )}
              {listing.refurbQuoteType && (
                <MetricRow label="Refurb Quote" value={listing.refurbQuoteType.split('_').join(' ')} />
              )}
            </div>
          </div>

          {/* Agency ownership / verification */}
          <div className="glass-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Ownership</h2>
            <div className="space-y-2">
              <p className="text-sm font-medium">{listing.agencyProfile?.companyName ?? '—'}</p>
              {listing.agencyProfile?.verificationStatus && (
                <p className="text-xs text-slate-400">
                  Agency status: {listing.agencyProfile.verificationStatus}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => router.push(`/agency/listings/${listing.id}/edit`)}
              className="btn-secondary w-full text-sm"
            >
              Edit
            </button>
            {/* Note: /agency/listings/[id]/edit route not yet built — Edit will 404 until that lands. */}
            {isPubliclyViewable && (
              <button
                onClick={() => router.push(`/listings/${listing.id}`)}
                className="btn-primary w-full text-sm"
              >
                View public listing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
