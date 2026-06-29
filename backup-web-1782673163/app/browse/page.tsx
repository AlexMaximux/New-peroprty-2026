'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { searchListings, type ListingSearchResult, type SearchFilters } from '@/lib/api';
import { formatGBP } from '@/lib/utils';

export default function BrowsePageWrapper() {
  return (
    <Suspense fallback={
      <div className="page-container">
        <div className="glass-card p-8 text-center text-slate-400">Loading listings...</div>
      </div>
    }>
      <BrowsePageContent />
    </Suspense>
  );
}

const CATEGORIES = [
  { value: 'RENT_TO_RENT', label: 'Rent to Rent' },
  { value: 'LEASE_OPTION', label: 'Lease Option' },
  { value: 'SELL_PROPERTY', label: 'Sell Property' },
  { value: 'PORTFOLIO', label: 'Portfolio' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'DEVELOPMENT_OPPORTUNITY', label: 'Development' },
  { value: 'REFURB_OPPORTUNITY', label: 'Refurb Opportunity' },
];

const PROPERTY_TYPES = [
  { value: 'TERRACED', label: 'Terraced' },
  { value: 'FLAT', label: 'Flat' },
  { value: 'DETACHED', label: 'Detached' },
  { value: 'SEMI_DETACHED', label: 'Semi-Detached' },
  { value: 'OTHER', label: 'Other' },
];

const STRATEGIES = [
  { value: 'HMO', label: 'HMO' },
  { value: 'SA', label: 'Serviced Accommodation' },
  { value: 'SINGLE_LET', label: 'Single Let' },
  { value: 'HIGH_ROI', label: 'High ROI' },
  { value: 'CASH_PURCHASE', label: 'Cash Purchase' },
  { value: 'BMV', label: 'Below Market Value' },
  { value: 'FLAT_CONVERSION', label: 'Flat Conversion' },
  { value: 'ADD_BEDROOM', label: 'Add Bedroom' },
  { value: 'EXTENSION', label: 'Extension' },
  { value: 'LOFT_CONVERSION', label: 'Loft Conversion' },
];

function BrowsePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<ListingSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    limit: 20,
    excludeSold: true,
    excludeReserved: true,
  });

  // Init filters from URL on mount
  useEffect(() => {
    const fromUrl: SearchFilters = { ...filters };
    if (searchParams.get('category')) fromUrl.category = searchParams.get('category')!;
    if (searchParams.get('strategy')) fromUrl.strategy = searchParams.get('strategy')!;
    if (searchParams.get('propertyType')) fromUrl.propertyType = searchParams.get('propertyType')!;
    if (searchParams.get('postcode')) fromUrl.postcode = searchParams.get('postcode')!;
    if (searchParams.get('region')) fromUrl.region = searchParams.get('region')!;
    if (searchParams.get('priceMin')) fromUrl.priceMin = Number(searchParams.get('priceMin'));
    if (searchParams.get('priceMax')) fromUrl.priceMax = Number(searchParams.get('priceMax'));
    if (searchParams.get('roiMin')) fromUrl.roiMin = Number(searchParams.get('roiMin'));
    if (searchParams.get('roiMax')) fromUrl.roiMax = Number(searchParams.get('roiMax'));
    if (searchParams.get('page')) fromUrl.page = Number(searchParams.get('page'));
    if (searchParams.get('needsRefurb')) fromUrl.needsRefurb = searchParams.get('needsRefurb') === 'true';
    if (searchParams.get('excludeSold')) fromUrl.excludeSold = searchParams.get('excludeSold') !== 'false';
    if (searchParams.get('excludeReserved')) fromUrl.excludeReserved = searchParams.get('excludeReserved') !== 'false';
    setFilters(fromUrl);
  }, []);

  const fetchResults = useCallback(async (f: SearchFilters) => {
    setLoading(true);
    try {
      const res = await searchListings(f);
      setResults(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(filters);
    // Update URL
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== true) {
        if (key === 'excludeSold' && !value) params.set(key, 'false');
        else if (key === 'excludeReserved' && !value) params.set(key, 'false');
        else if (key === 'excludeSold' && value) return;
        else if (key === 'excludeReserved' && value) return;
        else if (key === 'page' && value === 1) return;
        else params.set(key, String(value));
      }
    });
    const qs = params.toString();
    router.replace(`/browse${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [filters, fetchResults, router]);

  const updateFilter = (key: keyof SearchFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20, excludeSold: true, excludeReserved: true });
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters =
    filters.category || filters.strategy || filters.propertyType ||
    filters.postcode || filters.region || filters.priceMin || filters.priceMax ||
    filters.roiMin || filters.roiMax || filters.needsRefurb !== undefined ||
    filters.excludeSold === false || filters.excludeReserved === false;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Browse Listings</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {total} {total === 1 ? 'deal' : 'deals'} available
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary text-xs !px-3 !py-1.5">
              Clear
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary text-xs !px-3 !py-1.5 ${showFilters ? 'active' : ''}`}
          >
            Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar */}
        {showFilters && (
          <aside className="w-full shrink-0 space-y-5 sm:w-64">
            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category</h3>
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => updateFilter('category', undefined)}
                  className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                    !filters.category ? 'bg-gold-500/10 text-gold-400' : 'text-slate-300 hover:bg-deep-700'
                  }`}
                >
                  All Categories
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => updateFilter('category', c.value)}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                      filters.category === c.value ? 'bg-gold-500/10 text-gold-400' : 'text-slate-300 hover:bg-deep-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Strategy</h3>
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => updateFilter('strategy', undefined)}
                  className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                    !filters.strategy ? 'bg-gold-500/10 text-gold-400' : 'text-slate-300 hover:bg-deep-700'
                  }`}
                >
                  All Strategies
                </button>
                {STRATEGIES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateFilter('strategy', s.value)}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                      filters.strategy === s.value ? 'bg-gold-500/10 text-gold-400' : 'text-slate-300 hover:bg-deep-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Property Type</h3>
              <div className="mt-2 space-y-1">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => updateFilter('propertyType', filters.propertyType === t.value ? undefined : t.value)}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                      filters.propertyType === t.value ? 'bg-gold-500/10 text-gold-400' : 'text-slate-300 hover:bg-deep-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Location</h3>
              <div className="mt-2 space-y-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Postcode</label>
                  <input
                    className="input-field text-sm"
                    placeholder="e.g. M1 1AA"
                    value={filters.postcode ?? ''}
                    onChange={(e) => updateFilter('postcode', e.target.value || undefined)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Region</label>
                  <input
                    className="input-field text-sm"
                    placeholder="e.g. Manchester"
                    value={filters.region ?? ''}
                    onChange={(e) => updateFilter('region', e.target.value || undefined)}
                  />
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Price Range</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Min (&pound;)</label>
                  <input
                    className="input-field text-sm"
                    type="number"
                    placeholder="0"
                    value={filters.priceMin ? Math.round(filters.priceMin / 100) : ''}
                    onChange={(e) => updateFilter('priceMin', e.target.value ? Number(e.target.value) * 100 : undefined)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Max (&pound;)</label>
                  <input
                    className="input-field text-sm"
                    type="number"
                    placeholder="Any"
                    value={filters.priceMax ? Math.round(filters.priceMax / 100) : ''}
                    onChange={(e) => updateFilter('priceMax', e.target.value ? Number(e.target.value) * 100 : undefined)}
                  />
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">ROI</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Min %</label>
                  <input
                    className="input-field text-sm"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                    value={filters.roiMin ?? ''}
                    onChange={(e) => updateFilter('roiMin', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Max %</label>
                  <input
                    className="input-field text-sm"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Any"
                    value={filters.roiMax ?? ''}
                    onChange={(e) => updateFilter('roiMax', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</h3>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-gold-500"
                    checked={filters.needsRefurb ?? false}
                    onChange={(e) => updateFilter('needsRefurb', e.target.checked || undefined)}
                  />
                  Needs Refurbishment
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-gold-500"
                    checked={filters.excludeSold ?? true}
                    onChange={(e) => updateFilter('excludeSold', e.target.checked)}
                  />
                  Exclude Sold
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-gold-500"
                    checked={filters.excludeReserved ?? true}
                    onChange={(e) => updateFilter('excludeReserved', e.target.checked)}
                  />
                  Exclude Reserved
                </label>
              </div>
            </div>
          </aside>
        )}

        {/* Results */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card animate-pulse p-4">
                  <div className="mb-3 h-40 rounded-lg bg-deep-700" />
                  <div className="mb-2 h-4 w-3/4 rounded bg-deep-700" />
                  <div className="h-3 w-1/2 rounded bg-deep-700" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
              <p className="text-lg font-medium text-slate-300">No listings found</p>
              <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or search criteria</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-primary mt-4 text-sm">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="glass-card glass-card-hover overflow-hidden"
                  >
                    {/* Media thumbnail */}
                    <div className="relative h-44 bg-deep-800">
                      {listing.media.length > 0 ? (
                        <div className="flex h-full items-center justify-center text-slate-600">
                          <span className="text-xs">{listing.media.length} photo(s)</span>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg className="h-10 w-10 text-deep-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {listing.needsRefurb && (
                        <span className="absolute top-2 right-2 badge badge-yellow text-xs">Refurb</span>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold">{listing.title}</h3>
                        {listing.estimatedRoi != null && (
                          <span className="badge badge-green shrink-0 text-xs">
                            {Number(listing.estimatedRoi).toFixed(1)}% ROI
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {listing.city}{listing.region ? `, ${listing.region}` : ''} &middot; {listing.category.replace(/_/g, ' ')}
                        {listing.strategy ? ` &middot; ${listing.strategy}` : ''}
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-bold text-gold-400">
                          {formatGBP(listing.askingPricePence)}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {listing.bedrooms != null && <span>{listing.bedrooms} bed</span>}
                          {listing.bathrooms != null && <span>{listing.bathrooms} bath</span>}
                        </div>
                      </div>

                      {listing.hmoRooms.length > 0 && (
                        <div className="mt-2 border-t border-white/5 pt-2 text-xs text-slate-500">
                          <span>{listing.hmoRooms.length} rooms &middot; Total rent:{' '}
                            {formatGBP(listing.hmoRooms.reduce((s, r) => s + r.monthlyRentPence, 0))}/mo
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => goToPage((filters.page ?? 1) - 1)}
                    disabled={(filters.page ?? 1) <= 1}
                    className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-30"
                  >
                    Prev
                  </button>

                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                    const start = Math.max(1, Math.min((filters.page ?? 1) - 3, totalPages - 6));
                    const page = start + i;
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          (filters.page ?? 1) === page
                            ? 'bg-gold-500/15 text-gold-400'
                            : 'text-slate-400 hover:bg-deep-700 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goToPage((filters.page ?? 1) + 1)}
                    disabled={(filters.page ?? 1) >= totalPages}
                    className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}