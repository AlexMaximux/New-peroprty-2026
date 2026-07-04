'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { searchListings, type ListingSearchResult } from '../lib/api';
import { PropertyCard } from './property-card';

type MarketplaceViewProps = {
  onViewDetails: (id: string) => void;
  filters?: {
    category?: string;
    strategy?: string;
    postcode?: string;
    region?: string;
    priceMin?: number;
    priceMax?: number;
    roiMin?: number;
    roiMax?: number;
    needsRefurb?: boolean;
    excludeSold?: boolean;
    excludeReserved?: boolean;
  };
};

function useAuth() {
  const [user, setUser] = useState<{ role: string } | null>(null);
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('pv_user') : null;
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { setUser(null); }
    }
  }, []);
  return user;
}

// Map API response to PropertyCard props
function mapToPropertyCardProps(item: ListingSearchResult) {
  const askingPrice = item.askingPricePence ?? 0;
  const monthlyRent = item.hmoRooms?.reduce((sum, r) => sum + r.monthlyRentPence, 0) ?? 0;
  const grossYield = askingPrice > 0 ? (monthlyRent * 12) / askingPrice * 100 : undefined;

  return {
    id: item.id,
    type: item.category?.replace(/_/g, ' ') ?? 'Unknown',
    title: item.title,
    address: item.city ?? item.postcode ?? 'Unknown',
    postcode: item.postcode ?? '',
    image: item.media?.[0]?.url ?? '',
    askingPrice,
    grossYield,
    monthlyRental: monthlyRent,
    sourcingFee: 0,
    status: (item.status === 'PUBLISHED' ? 'available' : item.status === 'RESERVED' ? 'reserved' : 'sold') as 'available' | 'reserved' | 'sold',
    tags: item.needsRefurb ? ['BMV', 'Needs Refurb'] : item.strategy ? [item.strategy.replace(/_/g, ' ')] : [],
  };
}

export function MarketplaceView({ onViewDetails, filters = {} }: MarketplaceViewProps) {
  const user = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => searchListings({ ...filters, page: 1, limit: 50 }),
    staleTime: 60_000,
    enabled: !!user, // Only fetch when authenticated
  });

  // If not authenticated, show login message
  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">
            Please log in to view listings
          </p>
          <a href="/login" className="btn-primary">
            Log In
          </a>
        </div>
      </div>
    );
  }

  // If there's an error (and we are authenticated), show an error message
  if (isError) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">
            Unable to load listings. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Fetch listings
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Loading listings...</p>
          <div className="h-[24px] w-[24px] mr-2 inline-block animate-spin rounded-full border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Map data to PropertyCard props
  const properties = data?.data.map(mapToPropertyCardProps) ?? [];

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search listings..."
            className="input input-sm w-full max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Placeholder for view type selector */}
          <div className="btn-secondary btn-xs px-3 py-1">Grid</div>
        </div>
      </div>

      {/* Properties grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.length > 0 ? (
          properties.map((prop) => (
            <PropertyCard
              key={prop.id}
              onViewDetails={onViewDetails}
              {...prop}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No listings found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center">
        {/* Placeholder for pagination */}
        <div className="px-4 py-2">Page {data?.meta.page ?? 1} of {data?.meta.totalPages ?? 0}</div>
      </div>
    </div>
  );
}