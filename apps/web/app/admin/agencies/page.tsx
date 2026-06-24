'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface Agency {
  id: string;
  companyName: string;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  user: { id: string; email: string; displayName: string };
  documents: { id: string; type: string; originalName: string }[];
  _count: { listings: number };
}

interface ApiError {
  message?: string;
}

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('pv_access_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => {
    fetchAgencies();
  }, [filter]);

  const fetchAgencies = async () => {
    const url = filter ? `${API}/admin/agencies?status=${filter}` : `${API}/admin/agencies`;
    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data: Agency[] = await res.json();
        setAgencies(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const res = await fetch(`${API}/admin/agencies/${id}/approve`, {
      method: 'POST',
      headers,
      body: '{}',
    });
    if (res.ok) {
      setActionMsg('Agency approved');
      fetchAgencies();
    } else {
      const d: ApiError = await res.json();
      setActionMsg(`Error: ${d.message}`);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      setActionMsg('Rejection reason is required');
      return;
    }
    const res = await fetch(`${API}/admin/agencies/${id}/reject`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason: rejectReason }),
    });
    if (res.ok) {
      setActionMsg('Agency rejected');
      setRejectTarget(null);
      setRejectReason('');
      fetchAgencies();
    } else {
      const d: ApiError = await res.json();
      setActionMsg(`Error: ${d.message}`);
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'APPROVED') return 'badge-green';
    if (s === 'REJECTED') return 'badge-red';
    return 'badge-yellow';
  };

  if (loading) {
    return <div className="text-slate-400 animate-pulse">Loading agencies…</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-slate-300">Filter:</span>
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
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
        {agencies.length === 0 && (
          <div className="glass-card p-6 text-center text-sm text-slate-400">No agencies found</div>
        )}
        {agencies.map((a) => (
          <div key={a.id} className="glass-card glass-card-hover p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">{a.companyName}</span>
                  <span className={`badge ${statusBadge(a.verificationStatus)}`}>
                    {a.verificationStatus}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {a.user.email} · {a.user.displayName} · {a._count.listings} listings · {a.documents.length} docs
                </div>
                {a.rejectionReason && (
                  <div className="mt-1 text-xs text-red-400">Reason: {a.rejectionReason}</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {a.verificationStatus === 'PENDING' && (
                  <>
                    <button onClick={() => handleApprove(a.id)} className="btn-primary !text-xs !px-3 !py-1.5">
                      Approve
                    </button>
                    <button onClick={() => setRejectTarget(a.id)} className="btn-danger !text-xs !px-3 !py-1.5">
                      Reject
                    </button>
                  </>
                )}
                <Link href={`/admin/agencies/${a.id}`} className="btn-secondary !text-xs !px-3 !py-1.5">
                  View
                </Link>
              </div>
            </div>

            {rejectTarget === a.id && (
              <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
                <input
                  className="input-field flex-1"
                  placeholder="Rejection reason (required)"
                  value={rejectReason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectReason(e.target.value)}
                  autoFocus
                />
                <button onClick={() => handleReject(a.id)} className="btn-danger !text-xs !px-3 !py-1.5">
                  Confirm Reject
                </button>
                <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="btn-secondary !text-xs !px-3 !py-1.5">
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}