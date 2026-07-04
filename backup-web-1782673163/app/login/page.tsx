'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; displayName: string };
  message?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data: LoginResponse = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Login failed');
        return;
      }

      localStorage.setItem('pv_access_token', data.accessToken);
      localStorage.setItem('pv_refresh_token', data.refreshToken);
      localStorage.setItem('pv_user', JSON.stringify(data.user));

      if (data.user.role === 'ADMIN') router.push('/admin/agencies');
      else if (data.user.role === 'AGENCY') router.push('/agency/onboarding');
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
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="mt-1 text-sm text-slate-400">Access your PropVest account</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
            )}

            <button type="submit" className="btn-primary w-full text-base !py-2.5" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 border-t border-white/5 pt-4 text-center text-xs text-slate-500">
            <p>Test: admin@propvest.test / Passw0rd!</p>
            <p className="mt-0.5">Agency: agency@propvest.test / Passw0rd!</p>
            <p className="mt-0.5">Buyer: buyer@propvest.test / Passw0rd!</p>
          </div>
        </div>
      </div>
    </div>
  );
}