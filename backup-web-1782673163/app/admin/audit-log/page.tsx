'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  meta: Record<string, any> | null;
  createdAt: string;
  admin: { id: string; email: string; displayName: string };
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('pv_access_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch(`${API}/admin/audit-log`, { headers });
      const data: AuditLogEntry[] = await res.json();
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="text-slate-400 animate-pulse">Loading audit log…</div>;

  return (
    <div>
      <div className="space-y-2">
        {logs.length === 0 && (
          <div className="glass-card p-6 text-center text-sm text-slate-400">No audit log entries</div>
        )}
        {logs.map((l) => (
          <div key={l.id} className="glass-card p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="badge badge-blue">{l.action}</span>
                <span className="text-slate-300">{l.targetType}:{l.targetId.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{l.admin.displayName}</span>
                <span className="text-xs text-slate-500">{new Date(l.createdAt).toLocaleString()}</span>
              </div>
            </div>
            {l.meta && Object.keys(l.meta).length > 0 && (
              <div className="mt-1 text-xs text-slate-400">{JSON.stringify(l.meta)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}