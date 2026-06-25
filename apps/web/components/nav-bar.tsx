'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function NavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ role: string; displayName: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('pv_user') : null;
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { setUser(null); }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pv_user');
    localStorage.removeItem('pv_access_token');
    setUser(null);
    window.location.href = '/';
  };

  useEffect(() => {
    // Re-check user on path change (after login/register)
    const stored = typeof window !== 'undefined' ? localStorage.getItem('pv_user') : null;
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [pathname]);

  if (loading) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-deep-900/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            <span className="gradient-text">PropVest</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>

          {/* Browse — shown to all authenticated users */}
          {user && (
            <Link href="/browse" className={`nav-link ${pathname.startsWith('/browse') ? 'active' : ''}`}>
              Browse
            </Link>
          )}

          {/* Favourites — shown to all authenticated users */}
          {user && (
            <Link href="/favourites" className={`nav-link ${pathname.startsWith('/favourites') ? 'active' : ''}`}>
              Favourites
            </Link>
          )}

          {/* Messages — shown to all authenticated users */}
          {user && (
            <Link href="/messages" className={`nav-link ${pathname.startsWith('/messages') ? 'active' : ''}`}>
              Messages
            </Link>
          )}

          {user && user.role === 'ADMIN' && (
            <>
              <Link href="/admin/agencies" className={`nav-link ${pathname.startsWith('/admin') ? 'active' : ''}`}>
                Admin
              </Link>
            </>
          )}

          {user && user.role === 'AGENCY' && (
            <>
              <Link href="/agency/listings/new" className={`nav-link ${pathname.startsWith('/agency/listings') ? 'active' : ''}`}>
                New Listing
              </Link>
              <Link href="/agency/onboarding" className={`nav-link ${pathname.startsWith('/agency/onboarding') ? 'active' : ''}`}>
                My Agency
              </Link>
            </>
          )}

          {user ? (
            <div className="ml-4 flex items-center gap-3">
              <span className="text-sm text-slate-300">{user.displayName}</span>
              {user.role === 'ADMIN' && (
                <span className="badge badge-blue text-xs">Admin</span>
              )}
              {user.role === 'AGENCY' && (
                <span className="badge badge-yellow text-xs">Agency</span>
              )}
              <button onClick={handleLogout} className="btn-secondary text-sm !px-3 !py-1.5">
                Logout
              </button>
            </div>
          ) : (
            <div className="ml-4 flex items-center gap-2">
              <Link href="/login" className="btn-secondary text-sm !px-4 !py-1.5">
                Login
              </Link>
              <Link href="/register" className="btn-primary text-sm !px-4 !py-1.5">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}