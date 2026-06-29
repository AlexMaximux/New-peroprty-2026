'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAgencyListings, type AgencyListingSummary } from '@/lib/api';
import { formatGBP } from '@/lib/utils';

const STATUS_META: Record<string, { label: string; dot: string }> = {
  DRAFT: { label: 'Draft', dot: 'bg-yellow-400' },
  PUBLISHED: { label: 'Published', dot: 'bg-emerald-400' },
  RESERVED: { label: 'Reserved', dot: 'bg-blue-400' },
  SOLD: { label: 'Sold', dot: 'bg-red-400' },
  ARCHIVED: { label: 'Archived', dot: 'bg-slate-500' },
};

export default function AgencyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<AgencyListingSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAgencyListings()
      .then((data) => setListings(data))
      .catch((e) => setError(e.message ?? 'Failed to load listings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card animate-pulse p-8">
          <div className="mb-6 h-6 w-1/4 rounded bg-deep-700" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-20 w-32 shrink-0 rounded bg-deep-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-deep-700" />
                  <div className="h-4 w-1/2 rounded bg-deep-700" />
                  <div className="h-4 w-1/3 rounded bg-deep-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="glass-card p-8 text-center">
          <p className="text-red-400">{error}</p>
          <button onClick={() => router.push('/login')} className="btn-secondary mt-4 text-sm">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
            <span>Agency</span>
            <span>/</span>
            <span className="text-slate-300">Listings</span>
          </div>
          <h1 className="text-2xl font-bold">My Properties</h1>
          <p className="mt-1 text-sm text-slate-400">
            {listings?.length ?? 0} {listings?.length === 1 ? 'listing' : 'listings'}
          </p>
        </div>
        <button
          onClick={() => router.push('/agency/listings/new')}
          className="btn-primary text-sm"
        >
          + New listing
        </button>
      </div>

      {/* Empty state */}
      {(!listings || listings.length === 0) && (
        <div className="glass-card flex flex-col items-center justify-center py-16">
          <svg className="mb-4 h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="mb-1 text-lg font-medium text-slate-300">No properties listed yet</p>
          <p className="mb-6 text-sm text-slate-500">Create your first listing to start attracting investors.</p>
          <button
            onClick={() => router.push('/agency/listings/new')}
            className="btn-primary text-sm"
          >
            + New listing
          </button>
        </div>
      )}

      {/* Listing cards */}
      {listings && listings.length > 0 && (
        <div className="space-y-3">
          {listings.map((listing) => {
            const status = STATUS_META[listing.status] ?? { label: listing.status, dot: 'bg-slate-500' };
            const primaryMedia = listing.media?.find((m: any) => m.isPrimary) ?? listing.media?.[0];
            const enquiryCount = listing._count?.conversations ?? 0;
            const favCount = listing._count?.favourites ?? 0;

            return (
              <div
                key={listing.id}
                className="glass-card flex gap-4 overflow-hidden transition-all duration-200 hover:border-deep-500/50"
              >
                {/* Thumbnail */}
                <div className="relative w-32 shrink-0 overflow-hidden sm:w-40">
                  {primaryMedia?.url ? (
                    <img
                      src={primaryMedia.url}
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-deep-800">
                      <svg className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col justify-center py-3 pr-4">
                  {/* Title row */}
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-white">{listing.title}</h2>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium
                      ${listing.status === 'PUBLISHED' ? 'bg-emerald-500/15 text-emerald-400' : ''}
                      ${listing.status === 'DRAFT' ? 'bg-yellow-500/15 text-yellow-400' : ''}
                      ${listing.status === 'RESERVED' ? 'bg-blue-500/15 text-blue-400' : ''}
                      ${listing.status === 'SOLD' || listing.status === 'ARCHIVED' ? 'bg-red-500/15 text-red-400' : ''}
                    `}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  {/* Location */}
                  <p className="mb-2 truncate text-sm text-slate-500">
                    {[listing.city, listing.postcode].filter(Boolean).join(', ') || 'Location not set'}
                  </p>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                    {listing.askingPricePence != null && (
                      <span className="font-semibold text-gold-400">{formatGBP(listing.askingPricePence)}</span>
                    )}
                    {listing.bedrooms != null && (
                      <span className="text-slate-400">{listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''}</span>
                    )}
                    {listing.bathrooms != null && (
                      <span className="text-slate-400">{listing.bathrooms} bath{listing.bathrooms !== 1 ? 's' : ''}</span>
                    )}
                    <span className="text-slate-500">
                      {listing.hmoRooms?.length ?? 0} room{(listing.hmoRooms?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                    {listing.strategy && (
                      <span className="rounded bg-deep-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {listing.strategy}
                      </span>
                    )}
                    {(enquiryCount > 0 || favCount > 0) && (
                      <span className="text-slate-500">
                        {enquiryCount > 0 && `${enquiryCount} enq`}
                        {enquiryCount > 0 && favCount > 0 && ' · '}
                        {favCount > 0 && `${favCount} fav`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-col justify-center gap-2 pr-4">
                  <button
                    onClick={() => router.push(`/agency/listings/${listing.id}`)}
                    className="btn-secondary !px-3 !py-1.5 text-xs"
                  >
                    View
                  </button>
                  <button
                    onClick={() => router.push(`/agency/listings/${listing.id}/edit`)}
                    className="btn-primary !px-3 !py-1.5 text-xs"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
