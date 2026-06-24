'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface AgencyDocument {
  id: string;
  type: string;
  originalName: string;
  createdAt: string;
}

interface AgencyProfile {
  id: string;
  companyName: string;
  companyNumber: string | null;
  address: string;
  contactName: string;
  phone: string;
  website: string | null;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  documents: AgencyDocument[];
}

interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
}

export default function AgencyOnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    companyNumber: '',
    address: '',
    contactName: '',
    phone: '',
    website: '',
  });

  const [docType, setDocType] = useState('COMPANY_REGISTRATION');

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('pv_user') ?? 'null') : null;

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pv_access_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    if (!user || user.role !== 'AGENCY') {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API}/agency/profile`, { headers: getHeaders() });
      if (res.ok) {
        const data: AgencyProfile = await res.json();
        setProfile(data);
        setForm({
          companyName: data.companyName ?? '',
          companyNumber: data.companyNumber ?? '',
          address: data.address ?? '',
          contactName: data.contactName ?? '',
          phone: data.phone ?? '',
          website: data.website ?? '',
        });
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch(`${API}/agency/profile`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          companyName: form.companyName,
          companyNumber: form.companyNumber || undefined,
          address: form.address,
          contactName: form.contactName,
          phone: form.phone,
          website: form.website || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { message?: string };
        throw new Error(data.message ?? 'Failed to save');
      }
      setMessage('Profile saved. Submit documents for verification.');
      fetchProfile();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setError('');
    const fileInput = document.getElementById('doc-upload') as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) { setError('Select a file'); setUploading(false); return; }

    try {
      // 1. Get signed upload URL
      const urlRes = await fetch(`${API}/agency/documents/upload-url`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ type: docType, originalName: file.name, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, fileKey }: UploadUrlResponse = await urlRes.json();

      // 2. Upload directly to MinIO
      const uploadRes = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!uploadRes.ok) throw new Error('Upload to storage failed');

      // 3. Confirm upload
      const confirmRes = await fetch(`${API}/agency/documents/confirm`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ fileKey, originalName: file.name, type: docType }),
      });
      if (!confirmRes.ok) throw new Error('Failed to confirm upload');

      setMessage('Document uploaded!');
      fetchProfile();
      fileInput.value = '';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading…</div>
      </div>
    );
  }

  const statusBadgeClass =
    profile?.verificationStatus === 'APPROVED' ? 'badge-green' :
    profile?.verificationStatus === 'REJECTED' ? 'badge-red' : 'badge-yellow';

  return (
    <div className="page-container max-w-2xl">
      <h1 className="text-3xl font-bold">Agency Onboarding</h1>
      <p className="mt-2 text-sm text-slate-400">Complete your profile and upload verification documents</p>

      {/* Status banner */}
      {profile && (
        <div className="glass-card mt-6 flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className={`status-dot ${
              profile.verificationStatus === 'APPROVED' ? 'status-dot-green' :
              profile.verificationStatus === 'REJECTED' ? 'status-dot-red' : 'status-dot-yellow'
            }`} />
            <span className="text-sm font-medium">
              Status:{' '}
              <span className={statusBadgeClass}>
                {profile.verificationStatus}
              </span>
            </span>
          </div>
          {profile.verificationStatus === 'REJECTED' && profile.rejectionReason && (
            <span className="text-xs text-red-400">Reason: {profile.rejectionReason}</span>
          )}
        </div>
      )}

      {/* Profile form */}
      <form onSubmit={handleSaveProfile} className="glass-card mt-6 space-y-4 p-6">
        <h2 className="text-lg font-semibold">Company Information</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Company Name *</label>
            <input className="input-field" value={form.companyName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, companyName: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Company Number</label>
            <input className="input-field" value={form.companyNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, companyNumber: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Phone *</label>
            <input className="input-field" value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} required />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-300">Registered Address *</label>
          <input className="input-field" value={form.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, address: e.target.value })} required />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Contact Name *</label>
            <input className="input-field" value={form.contactName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, contactName: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Website</label>
            <input className="input-field" value={form.website} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
        {message && <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">{message}</div>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      {/* Document upload */}
      <div className="glass-card mt-6 p-6">
        <h2 className="text-lg font-semibold">Verification Documents</h2>
        <p className="mt-1 text-xs text-slate-400">Upload Company Registration, ID, Proof of Address, etc.</p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Document Type</label>
            <select className="input-field" value={docType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDocType(e.target.value)}>
              <option value="COMPANY_REGISTRATION">Company Registration</option>
              <option value="ID">ID / Passport</option>
              <option value="PROOF_OF_ADDRESS">Proof of Address</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-300">File</label>
            <input id="doc-upload" type="file" className="input-field text-xs file:mr-3 file:rounded file:border-0 file:bg-deep-500 file:px-3 file:py-1 file:text-xs file:text-white" />
          </div>
          <button onClick={handleUpload} className="btn-primary !py-2.5" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>

        {/* Existing documents */}
        {profile && profile.documents.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-slate-400">Uploaded documents:</p>
            {profile.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg bg-deep-700 px-3 py-2 text-sm">
                <div>
                  <span className="badge badge-blue text-xs mr-2">{doc.type}</span>
                  <span>{doc.originalName}</span>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}