'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, MapPin, Phone, Mail, MessageSquare, AlertTriangle } from 'lucide-react';
import { getListing } from '@propvest/api-client';
import { formatGBP } from '@/lib/format-gbp';
import { StatusBadge } from './status-badge';

type PropertyDetailViewProps = {
  listingId: string;
  onBack: () => void;
  onMessage?: () => void;
};

export default function PropertyDetailView({ listingId, onBack, onMessage }: PropertyDetailViewProps) {
  const { data: property, isLoading, isError, error } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => getListing(listingId),
    staleTime: 60_000,
  });

  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-32 bg-muted rounded" />
            <div className="aspect-[16/9] bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft size={16} /> Back to listings
          </button>
          <div className="text-center py-20">
            <p className="text-red-400 font-medium">Failed to load property</p>
            <p className="text-xs text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Property not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Derive values from API response
  const askingPrice = property.askingPricePence ?? 0;
  const marketValue = property.marketValuePence ?? askingPrice;
  const monthlyRent = property.hmoRooms?.reduce((s: number, r: { monthlyRentPence: number }) => s + r.monthlyRentPence, 0) ?? 0;
  const grossYield = askingPrice > 0 ? ((monthlyRent * 12) / askingPrice) * 100 : 0;

  const totalInvestment = askingPrice + (property.refurbCostPence ?? 0) + 0;
  const annualRental = monthlyRent * 12;
  const roi5yr = totalInvestment > 0 ? ((annualRental * 5) / totalInvestment) * 100 : 0;

  const images = [
    property.media?.[0]?.url ?? '',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=520&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=520&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=520&fit=crop&auto=format',
  ].filter(Boolean);

  const financials = [
    { label: 'Asking Price', value: formatGBP(askingPrice), highlight: false },
    {
      label: 'Renovation Estimate',
      value: property.refurbCostPence && property.refurbCostPence > 0 ? formatGBP(property.refurbCostPence) : 'None required',
      highlight: false,
    },
    { label: 'Total Capital Required', value: formatGBP(totalInvestment), highlight: true, color: 'font-bold' },
    { label: 'Monthly Rental Income', value: monthlyRent > 0 ? formatGBP(monthlyRent) : '—', highlight: false },
    { label: 'Annual Rental Income', value: annualRental > 0 ? formatGBP(annualRental) : '—', highlight: false },
    { label: 'Gross Yield', value: grossYield > 0 ? `${grossYield.toFixed(1)}%` : 'N/A', highlight: true, color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
    { label: '5-Year ROI (est.)', value: roi5yr > 0 ? `${roi5yr.toFixed(1)}%` : 'N/A', highlight: false },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} /> Back to listings
        </button>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="rounded-xl overflow-hidden bg-muted aspect-[16/9]">
              {images.length > 0 && (
                <img src={images[activeImage]} alt={property.title} className="w-full h-full object-cover" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === i ? 'border-emerald-500' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:w-80 shrink-0 space-y-4">
            <div>
              <div className="flex gap-2 flex-wrap mb-2">
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary text-primary-foreground">
                  {property.category?.replace(/_/g, ' ')}
                </span>
                {property.strategy && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-500 text-white">
                    {property.strategy.replace(/_/g, ' ')}
                  </span>
                )}
                <StatusBadge status={property.status === 'PUBLISHED' ? 'verified' : property.status === 'SOLD' ? 'rejected' : 'pending'} />
              </div>
              <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {property.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin size={13} />
                {[property.addressLine1, property.city, property.postcode].filter(Boolean).join(', ')}
              </p>
            </div>

            <div className="bg-muted rounded-xl p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Asking Price</p>
                <p className="text-xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {formatGBP(askingPrice, true)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Market Value</p>
                <p className="text-sm line-through text-muted-foreground mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {formatGBP(marketValue, true)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gross Yield</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {grossYield > 0 ? `${grossYield.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monthly Income</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {monthlyRent > 0 ? formatGBP(monthlyRent, true) : '—'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
              {property.bedrooms !== null && (
                <div className="bg-muted rounded-lg py-2">
                  <p className="font-semibold text-foreground text-sm">{property.bedrooms}</p>
                  <p>Bedrooms</p>
                </div>
              )}
              {property.bathrooms !== null && (
                <div className="bg-muted rounded-lg py-2">
                  <p className="font-semibold text-foreground text-sm">{property.bathrooms}</p>
                  <p>Bathrooms</p>
                </div>
              )}
              <div className="bg-muted rounded-lg py-2">
                <p className="font-semibold text-foreground text-sm">{property.floorArea ?? '—'}</p>
                <p>Sq Ft</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-semibold">
                    {property.agencyProfile?.companyName?.slice(0, 2) ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">
                      {property.agencyProfile?.contactName ?? 'Agency Contact'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{property.agencyProfile?.companyName ?? 'Unknown Agency'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-muted transition-colors">
                  <Phone size={12} /> Call
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-muted transition-colors">
                  <Mail size={12} /> Email
                </button>
                {onMessage && (
                  <button
                    onClick={onMessage}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  >
                    <MessageSquare size={12} /> Message
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/50">
              <h3 className="text-sm font-semibold">Financial Breakdown</h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {financials.map((row, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/30'}`}>
                    <td className="px-5 py-2.5 text-muted-foreground text-xs">{row.label}</td>
                    <td
                      className={`px-5 py-2.5 text-right text-xs ${row.color ?? ''}`}
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            {property.description && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3">Property Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
              </div>
            )}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Due Diligence Reminder</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1">
                    Always instruct an independent RICS surveyor and solicitor. Yield figures are estimates only.
                    Past performance is not a guide to future returns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}