'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFavourites, type FavouriteResult } from '@/lib/api';
import { formatGBP } from '@/lib/utils';

export default function FavouritesPage() {
  const [favourites, setFavourites] = useState<FavouriteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFavourites = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getFavourites();
      setFavourites(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load favourites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, []);

  const refresh = () => {
    fetchFavourites();
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card animate-pulse p-8">
          <div className="mb-4 h-8 w-1/3 rounded bg-deep-700" />
          <div className="space-y-3">
            <div className="h-24 rounded bg-deep-700" />
            <div className="h-24 rounded bg-deep-700" />
            <div className="h-24 rounded bg-deep-700" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Favourites</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {favourites.length} {favourites.length === 1 ? 'saved deal' : 'saved deals'}
          </p>
        </div>
        {favourites.length > 0 && (
          <Link href="/browse" className="btn-secondary text-xs !px-4 !py-1.5">
            Browse Listings
          </Link>
        )}
      </div>

      {error && (
        <div className="glass-card mb-6 border border-red-400/20 p-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={refresh} className="btn-secondary mt-3 text-xs !px-4 !py-1.5">
            Try Again
          </button>
        </div>
      )}

      {!error && favourites.length === 0 && (
        <div className="glass-card p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-slate-300">No favourites yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Start browsing deals and save your favourites for quick access.
          </p>
          <Link href="/browse" className="btn-primary mt-6 inline-block text-sm">
            Browse Deals
          </Link>
        </div>
      )}

      {!error && favourites.length > 0 && (
        <div className="space-y-3">
          {favourites.map((fav) => {
            const l = fav.listing;
            const askingPrice = l.askingPricePence != null ? formatGBP(l.askingPricePence) : null;
            const roi = l.estimatedRoi != null ? `${Number(l.estimatedRoi).toFixed(1)}%` : null;
            const categoryLabel = l.category.replace(/_/g, ' ');
            const totalMonthly = l.hmoRooms.reduce((s, r) => s + r.monthlyRentPence, 0);

            return (
              <Link
                key={`${fav.userId}-${fav.listingId}`}
                href={`/listings/${l.id}`}
                className="glass-card group flex items-start gap-4 p-4 transition hover:border-gold-500/30"
              >
                {/* Thumbnail placeholder */}
                <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-deep-800 text-xs text-slate-600">
                  {l.media.length > 0 ? (
                    <span className="text-center">
                      <svg className="mx-auto h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="mt-1 block">{l.media.length}</span>
                    </span>
                  ) : (
                    <span>No image</span>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold group-hover:text-gold-400 transition">
                        {l.title}
                      </h3>
                      <p className="truncate text-xs text-slate-500">
                        {l.city}{l.region ? `, ${l.region}` : ''} · {l.postcode}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {askingPrice && (
                        <p className="text-sm font-bold text-gold-400">{askingPrice}</p>
                      )}
                      {roi && (
                        <p className="text-xs font-semibold text-emerald-400">{roi} ROI</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="badge badge-green text-xs">{categoryLabel}</span>
                    {l.strategy && (
                      <span className="badge badge-yellow text-xs">{l.strategy}</span>
                    )}
                    {l.propertyType && (
                      <span className="badge badge-blue text-xs">
                        {l.propertyType.replace(/_/g, ' ')}
                      </span>
                    )}
                    {l.bedrooms != null && (
                      <span className="text-xs text-slate-400">{l.bedrooms} bed</span>
                    )}
                    {l.bathrooms != null && (
                      <span className="text-xs text-slate-400">{l.bathrooms} bath</span>
                    )}
                    {totalMonthly > 0 && (
                      <span className="text-xs text-gold-400">
                        {formatGBP(totalMonthly)}/mo income
                      </span>
                    )}
                  </div>
                </div>

                {/* Saved date */}
                <div className="hidden shrink-0 self-center text-xs text-slate-600 sm:block">
                  Saved {new Date(fav.createdAt).toLocaleDateString()}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}