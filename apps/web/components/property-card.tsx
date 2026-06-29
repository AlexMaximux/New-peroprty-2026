'use client';

import { useState } from 'react';
import { Star, MapPin, ChevronRight } from 'lucide-react';
import { formatGBP } from '@/lib/format-gbp';

export type PropertyCardProps = {
  id: string;
  type: string;
  title: string;
  address: string;
  postcode: string;
  image: string;
  askingPrice: number;
  grossYield?: number;
  monthlyRental?: number;
  sourcingFee?: number;
  status: 'available' | 'reserved' | 'sold';
  tags?: string[];
  onViewDetails: (id: string) => void;
};

export function PropertyCard({
  id,
  type,
  title,
  address,
  postcode,
  image,
  askingPrice,
  grossYield,
  monthlyRental,
  sourcingFee,
  status,
  tags,
  onViewDetails,
}: PropertyCardProps) {
  const [starred, setStarred] = useState(false);
  const isSold = status === 'sold';
  const isReserved = status === 'reserved';

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col group hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30 transition-all duration-200">
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={image || 'https://via.placeholder.com/120x80?text=No+Image'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {isSold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm bg-gray-700 px-3 py-1 rounded-full">SOLD</span>
          </div>
        )}
        {isReserved && (
          <div className="absolute top-0 right-0 m-3">
            <span className="text-white text-xs font-semibold bg-amber-600 px-2 py-1 rounded-full">
              RESERVED
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary text-primary-foreground">
            {type}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setStarred((v) => !v);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <Star size={14} className={starred ? 'fill-amber-400 text-amber-400' : 'text-white'} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-semibold text-sm leading-snug text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin size={11} />
            {address} · {postcode}
          </p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
            {formatGBP(askingPrice, true)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 py-2 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Gross Yield</p>
            <p
              className="text-sm font-semibold text-emerald-600 dark:text-emerald-400"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {grossYield ? `${grossYield.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-xs text-muted-foreground">Monthly</p>
            <p className="text-sm font-semibold" style={{ fontFamily: "'DM Mono', monospace" }}>
              {monthlyRental ? formatGBP(monthlyRental, true) : '—'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Src Fee</p>
            <p className="text-sm font-semibold" style={{ fontFamily: "'DM Mono', monospace" }}>
              {sourcingFee ? formatGBP(sourcingFee, true) : '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-xs text-muted-foreground">
            {tags?.includes('BMV') && 'BMV opportunity'}
          </span>
          <button
            onClick={() => onViewDetails(id)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            View Details
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}