'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; displayName: string };
  message?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'USER' as 'USER' | 'AGENCY',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data: RegisterResponse = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Registration failed');
        return;
      }

      localStorage.setItem('pv_access_token', data.accessToken);
      localStorage.setItem('pv_refresh_token', data.refreshToken);
      localStorage.setItem('pv_user', JSON.stringify(data.user));

      if (data.user.role === 'AGENCY') router.push('/agency/onboarding');
      else router.push('/');
    } catch {
      setError('Connection error. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="mt-1 text-sm text-slate-400">Join PropVest as an investor or agency</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Display Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Your name"
                value={form.displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, displayName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Account Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    form.role === 'USER'
                      ? 'border-gold-500/40 bg-gold-500/10 text-gold-400'
                      : 'border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                  onClick={() => setForm({ ...form, role: 'USER' })}
                >
                  Investor
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    form.role === 'AGENCY'
                      ? 'border-gold-500/40 bg-gold-500/10 text-gold-400'
                      : 'border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                  onClick={() => setForm({ ...form, role: 'AGENCY' })}
                >
                  Agency
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
            )}

            <button type="submit" className="btn-primary w-full text-base !py-2.5" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-gold-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}