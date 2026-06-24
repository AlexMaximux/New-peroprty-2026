'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export default function AgencyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('pv_access_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${API}/admin/agencies/${id}`, { headers });
      const json = await res.json();
      setData(json);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="text-slate-400 animate-pulse">Loading…</div>;
  if (!data) return <div className="text-red-400">Not found</div>;

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold">{data.companyName}</h2>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-400">Email:</span> {data.user.email}</div>
          <div><span className="text-slate-400">Contact:</span> {data.contactName}</div>
          <div><span className="text-slate-400">Phone:</span> {data.phone}</div>
          <div><span className="text-slate-400">Company No:</span> {data.companyNumber ?? 'N/A'}</div>
          <div><span className="text-slate-400">Address:</span> {data.address}</div>
          <div><span className="text-slate-400">Website:</span> {data.website ?? 'N/A'}</div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-3 font-semibold">Documents ({data.documents.length})</h3>
        {data.documents.map((d: any) => (
          <div key={d.id} className="flex items-center justify-between rounded-lg bg-deep-700 px-3 py-2 text-sm">
            <span><span className="badge badge-blue mr-2">{d.type}</span>{d.originalName}</span>
            <span className="text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
        {data.documents.length === 0 && (
          <p className="text-sm text-slate-400">No documents uploaded.</p>
        )}
      </div>

      <div className="glass-card p-6">
        <h3 className="mb-3 font-semibold">Listings ({data.listings.length})</h3>
        {data.listings.map((l: any) => (
          <div key={l.id} className="flex items-center justify-between rounded-lg bg-deep-700 px-3 py-2 text-sm">
            <span>{l.title}</span>
            <span className={`badge ${
              l.status === 'PUBLISHED' ? 'badge-green' : 'badge-yellow'
            }`}>{l.status}</span>
          </div>
        ))}
        {data.listings.length === 0 && (
          <p className="text-sm text-slate-400">No listings created yet.</p>
        )}
      </div>
    </div>
  );
}