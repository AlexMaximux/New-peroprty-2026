'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Building2, TrendingUp, ArrowUpRight } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { formatGBP } from '@/lib/format-gbp';
import { searchListings } from '@/lib/api';

type InvestorDashboardProps = {
  onViewDetails: (id: string) => void;
};

const portfolioChartData = [
  { month: 'Jan', value: 2100 },
  { month: 'Feb', value: 2155 },
  { month: 'Mar', value: 2280 },
  { month: 'Apr', value: 2310 },
  { month: 'May', value: 2390 },
  { month: 'Jun', value: 2450 },
];

const yieldChartData = [
  { name: 'HMO', yield: 14.2 },
  { name: 'Block', yield: 11.5 },
  { name: 'SA', yield: 16.5 },
  { name: 'Refurb', yield: 9.1 },
  { name: 'Land', yield: 0 },
];

export function InvestorDashboard({ onViewDetails }: InvestorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'saved' | 'analysed'>('all');

  const { data: listingsData } = useQuery({
    queryKey: ['listings', 'dashboard'],
    queryFn: () => searchListings({ page: 1, limit: 50 }),
    staleTime: 60_000,
  });

  const properties = (listingsData?.data ?? []).map((p) => {
    const monthlyIncome = p.hmoRooms ? p.hmoRooms.reduce((s, r) => s + r.monthlyRentPence, 0) : 0;
    const grossYield = p.askingPricePence && p.askingPricePence > 0
      ? (monthlyIncome * 12 / p.askingPricePence) * 100
      : undefined;
    return {
      id: p.id,
      type: p.category?.replace(/_/g, ' ') ?? 'Unknown',
      title: p.title,
      address: p.city ?? p.postcode ?? '',
      postcode: p.postcode ?? '',
      image: p.media?.[0]?.url ?? 'https://via.placeholder.com/120x80',
      askingPrice: p.askingPricePence ?? 0,
      grossYield,
      monthlyIncomePence: monthlyIncome,
      status: p.status?.toLowerCase() as any,
    };
  });

  const stats = [
    { label: 'Portfolio Value', value: '£2.45M', sub: '+£165k YTD', icon: Banknote, up: true },
    { label: 'Properties Tracked', value: '12', sub: '3 new this month', icon: Building2, up: true },
    { label: 'Avg. Gross Yield', value: '12.8%', sub: '+1.2pp vs last year', icon: TrendingUp, up: true },
    { label: 'Avg. BMV Discount', value: '21.3%', sub: 'Across portfolio', icon: ArrowUpRight, up: true },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <s.icon size={15} className="text-muted-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                {s.value}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <ArrowUpRight size={10} />
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-foreground">Portfolio Value (£000s)</h3>
              <span className="text-xs text-muted-foreground">Jan – Jun 2024</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={portfolioChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  domain={['dataMin - 100', 'dataMax + 50']}
                />
                <Tooltip
                  formatter={(value) => {
                    if (value === undefined) return '';
                    return `£${value}k`;
                  }}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#portfolioGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-sm text-foreground mb-4">Yield by Strategy</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={yieldChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  formatter={(v) => {
                    if (v === undefined) return '';
                    return `${v}%`;
                  }}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="yield" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex gap-1">
              {(['all', 'saved', 'analysed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'all' ? 'All Deals' : tab === 'saved' ? 'Watchlist' : 'Analysed'}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{properties.length} listings</span>
          </div>
          <div className="divide-y divide-border">
            {properties.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 transition-colors group">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.address}</p>
                </div>
                <div className="hidden md:flex items-center gap-6 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Ask</p>
                    <p className="text-sm font-semibold" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {formatGBP(p.askingPrice, true)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Yield</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {p.grossYield ? `${p.grossYield.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onViewDetails(p.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted"
                >
                  <span className="text-muted-foreground">View</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}