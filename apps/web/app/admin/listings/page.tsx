'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface Listing {
  id: string;
  title: string;
  status: string;
  category: string;
  strategy: string;
  askingPricePence: number | null;
  agencyProfile?: { companyName: string; verificationStatus: string };
  _count: { conversations: number; favourites: number };
}

interface ApiError {
  message?: string;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('pv_access_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const fetchListings = async () => {
    const url = filter ? `${API}/admin/listings?status=${filter}` : `${API}/admin/listings`;
    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data: Listing[] = await res.json();
        setListings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id: string, action: 'UNPUBLISH' | 'REINSTATE') => {
    const res = await fetch(`${API}/admin/listings/${id}/moderate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setActionMsg(`Listing ${action === 'UNPUBLISH' ? 'unpublished' : 'reinstated'}`);
      fetchListings();
    } else {
      const d: ApiError = await res.json();
      setActionMsg(`Error: ${d.message}`);
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'PUBLISHED') return 'badge-green';
    if (s === 'DRAFT') return 'badge-yellow';
    if (s === 'SOLD') return 'badge-blue';
    if (s === 'RESERVED') return 'badge-blue';
    if (s === 'ARCHIVED') return 'badge-red';
    return 'badge-yellow';
  };

  if (loading) return <div className="text-slate-400 animate-pulse">Loading listings…</div>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-slate-300">Filter:</span>
        {['', 'PUBLISHED', 'DRAFT', 'ARCHIVED', 'SOLD', 'RESERVED'].map((f) => (
          <button
            key={f}
            className={`text-sm nav-link ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {actionMsg && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{actionMsg}</div>
      )}

      <div className="space-y-3">
        {listings.length === 0 && (
          <div className="glass-card p-6 text-center text-sm text-slate-400">No listings found</div>
        )}
        {listings.map((l) => (
          <div key={l.id} className="glass-card glass-card-hover p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{l.title}</span>
                  <span className={`badge ${statusBadge(l.status)}`}>{l.status}</span>
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {l.agencyProfile?.companyName ?? 'N/A'} · {l.category} · {l.strategy}
                  {l.askingPricePence != null && ` · £${(l.askingPricePence / 100).toLocaleString()}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {l.status === 'PUBLISHED' && (
                  <button onClick={() => handleModerate(l.id, 'UNPUBLISH')} className="btn-danger !text-xs !px-3 !py-1.5">
                    Unpublish
                  </button>
                )}
                {l.status === 'ARCHIVED' && (
                  <button onClick={() => handleModerate(l.id, 'REINSTATE')} className="btn-primary !text-xs !px-3 !py-1.5">
                    Reinstate
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}