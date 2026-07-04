'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getListing, addFavourite, removeFavourite, startConversation } from '@/lib/api';
import { formatGBP, formatPercent } from '@/lib/utils';
import { PropertyMap } from '@/components/maps/property-map';
import { ImageGallery } from '@/components/listings/image-gallery';

interface ListingDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  strategy: string | null;
  status: string;
  propertyType: string | null;
  propertyTypeOther: string | null;
  internalRef: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postcode: string;
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
  estimatedRoi: number | null;
  strategySpecificData: Record<string, unknown> | null;
  publishedAt: string | null;
  createdAt: string;
  media: { id: string; kind: string; fileKey: string; order: number }[];
  hmoRooms: { id: string; name: string; roomType: string; monthlyRentPence: number }[];
  portfolioAssets: { id: string; name: string; valuePence: number | null; notes: string | null }[];
  agencyProfile: {
    companyName: string;
    contactName: string;
    phone: string;
    user: { displayName: string };
  } | null;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavourite, setIsFavourite] = useState(false);
  const [sendingEnquiry, setSendingEnquiry] = useState(false);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    getListing(id)
      .then(setListing)
      .catch((e) => setError(e.message ?? 'Failed to load listing'))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const handleEnquiry = async () => {
    if (!params?.id || sendingEnquiry) return;
    setSendingEnquiry(true);
    try {
      const conv = await startConversation(params.id as string);
      router.push(`/messages/${conv.id}`);
    } catch {
      router.push('/login');
    } finally {
      setSendingEnquiry(false);
    }
  };

  const toggleFav = async () => {
    if (!params?.id) return;
    try {
      if (isFavourite) {
        await removeFavourite(params.id as string);
        setIsFavourite(false);
      } else {
        await addFavourite(params.id as string);
        setIsFavourite(true);
      }
    } catch {
      // Not authenticated — redirect to login
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card animate-pulse p-8">
          <div className="mb-4 h-8 w-1/3 rounded bg-deep-700" />
          <div className="mb-6 h-64 rounded bg-deep-700" />
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-deep-700" />
            <div className="h-4 w-1/2 rounded bg-deep-700" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="page-container">
        <div className="glass-card p-8 text-center">
          <p className="text-lg text-red-400">{error || 'Listing not found'}</p>
          <button onClick={() => router.back()} className="btn-secondary mt-4 text-sm">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const categoryLabel = listing.category.split('_').join(' ');

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => router.push('/browse')} className="hover:text-white transition">
          Browse
        </button>
        <span>/</span>
        <span className="text-slate-300">{listing.title}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{listing.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {[listing.buildingNumber, listing.addressLine1, listing.addressLine2, listing.city, listing.region, listing.postcode]
              .filter(Boolean)
              .join(', ')}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
        <button
          onClick={toggleFav}
          className={`btn-secondary shrink-0 !px-3 !py-2 text-lg ${isFavourite ? 'text-red-400 border-red-400/30' : ''}`}
          title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          {isFavourite ? '❤' : '♡'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Media gallery */}
          <div className="glass-card overflow-hidden p-5">
            <ImageGallery images={listing.media} />
          </div>

          {/* Description */}
          {listing.description && (
            <div className="glass-card p-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">Description</h2>
              <p className="text-sm leading-relaxed text-slate-300">{listing.description}</p>
            </div>
          )}

          {/* HMO Rooms */}
          {listing.hmoRooms.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Room Configuration ({listing.hmoRooms.length})
              </h2>
              <div className="space-y-2">
                {listing.hmoRooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between rounded-lg bg-deep-800 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{room.name}</p>
                      <p className="text-xs text-slate-500">{room.roomType.split('_').join(' ')}</p>
                    </div>
                    <span className="text-sm font-semibold text-gold-400">
                      {formatGBP(room.monthlyRentPence)}/mo
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-gold-500/5 px-3 py-2">
                  <span className="text-sm font-semibold">Total Monthly Income</span>
                  <span className="text-sm font-bold text-gold-400">
                    {formatGBP(listing.hmoRooms.reduce((s, r) => s + r.monthlyRentPence, 0))}/mo
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Assets */}
          {listing.portfolioAssets.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Portfolio Assets
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

          {/* Location map */}
          <div className="glass-card overflow-hidden p-0">
            <div className="p-5 pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Location</h2>
            </div>
            {listing.latitude && listing.longitude ? (
              <PropertyMap
                latitude={listing.latitude}
                longitude={listing.longitude}
                address={`${listing.postcode}, ${listing.city}`}
                className="h-56"
              />
            ) : (
              <div className="flex h-48 items-center justify-center bg-deep-800">
                <div className="text-center text-slate-500">
                  <p className="text-sm">{listing.postcode}, {listing.city}</p>
                  <p className="mt-1 text-xs text-slate-600">No map coordinates available</p>
                </div>
              </div>
            )}
          </div>

          {/* Strategy-specific data */}
          {listing.strategySpecificData && Object.keys(listing.strategySpecificData).length > 0 ? (
            <div className="glass-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Deal Terms
              </h2>
              <div className="space-y-2 text-sm">
                {(listing.strategySpecificData as any).rentTerm != null ? (
                  <MetricRow label="Rent Term" value={String((listing.strategySpecificData as any).rentTerm)} />
                ) : null}
                {(listing.strategySpecificData as any).contractLengthMonths != null ? (
                  <MetricRow label="Contract Length" value={`${(listing.strategySpecificData as any).contractLengthMonths} months`} />
                ) : null}
                {(listing.strategySpecificData as any).finderFeePence != null ? (
                  <MetricRow label="Finder Fee" value={formatGBP((listing.strategySpecificData as any).finderFeePence as number)} gold />
                ) : null}
                {(listing.strategySpecificData as any).agencyDetails ? (
                  <div className="pt-2 border-t border-deep-700">
                    <p className="text-xs text-slate-500 mb-1">Agency Notes</p>
                    <p className="text-sm text-slate-300">{(listing.strategySpecificData as any).agencyDetails}</p>
                  </div>
                ) : null}
                {(listing.strategySpecificData as any).notes ? (
                  <div className="pt-2 border-t border-deep-700">
                    <p className="text-xs text-slate-500 mb-1">Additional Notes</p>
                    <p className="text-sm text-slate-300">{(listing.strategySpecificData as any).notes}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Key metrics */}
          <div className="glass-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Key Metrics</h2>
            <div className="space-y-3">
              {listing.askingPricePence != null && (
                <MetricRow label="Asking Price" value={formatGBP(listing.askingPricePence)} gold />
              )}
              {listing.marketValuePence != null && (
                <MetricRow label="Market Value" value={formatGBP(listing.marketValuePence)} gold />
              )}
              {listing.estimatedRoi != null && (
                <MetricRow label="Estimated ROI" value={formatPercent(Number(listing.estimatedRoi) * 0.01)} green />
              )}
              {listing.refurbCostPence != null && (
                <MetricRow label="Refurb Cost" value={formatGBP(listing.refurbCostPence)} />
              )}
              {listing.bedrooms != null && <MetricRow label="Bedrooms" value={String(listing.bedrooms)} />}
              {listing.bathrooms != null && <MetricRow label="Bathrooms" value={String(listing.bathrooms)} />}
              {listing.floorArea != null && <MetricRow label="Floor Area" value={`${listing.floorArea} sq ft`} />}
              {listing.furnishedStatus && (
                <MetricRow label="Furnished" value={listing.furnishedStatus.split('_').join(' ')} />
              )}
              <MetricRow label="Status" value={listing.status} />
              <MetricRow label="Vacant" value={listing.isVacant ? 'Yes' : listing.isVacant === false ? 'No' : '—'} />
              <MetricRow label="Tenanted" value={listing.isTenanted ? 'Yes' : listing.isTenanted === false ? 'No' : '—'} />
              <MetricRow label="Licensed" value={listing.isLicensed ? 'Yes' : listing.isLicensed === false ? 'No' : '—'} />
              {listing.parking && <MetricRow label="Parking" value={listing.parking} />}
              {listing.hasGarden && <MetricRow label="Garden" value={listing.gardenNotes ?? 'Yes'} />}
              {listing.hasLivingRoom != null && (
                <MetricRow label="Living Room" value={listing.hasLivingRoom ? 'Yes' : 'No'} />
              )}
              {listing.nation && <MetricRow label="Nation" value={listing.nation.split('_').join(' ')} />}
              {listing.furnishingQuality && (
                <MetricRow label="Furnishing Quality" value={listing.furnishingQuality} />
              )}
              {listing.furnishingNotes && (
                <MetricRow label="Furnishing Notes" value={listing.furnishingNotes} />
              )}
              {listing.refurbQuoteType && (
                <MetricRow label="Refurb Quote" value={listing.refurbQuoteType.split('_').join(' ')} />
              )}
            </div>
          </div>

          {/* Agency info */}
          <div className="glass-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Agency</h2>
            <div className="space-y-2">
              <p className="text-sm font-medium">{listing.agencyProfile?.companyName ?? '—'}</p>
              <p className="text-xs text-slate-400">{listing.agencyProfile?.user.displayName}</p>
              {listing.agencyProfile?.phone && (
                <p className="text-xs text-slate-500">{listing.agencyProfile.phone}</p>
              )}
            </div>
          </div>

          {/* Enquire button */}
          <button
            onClick={handleEnquiry}
            disabled={sendingEnquiry}
            className="btn-primary w-full text-sm"
          >
            {sendingEnquiry ? 'Starting conversation...' : 'Send Enquiry'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, gold, green }: { label: string; value: string; gold?: boolean; green?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-medium ${gold ? 'text-gold-400' : green ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}