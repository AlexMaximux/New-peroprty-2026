'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  BarChart3,
  Building2,
  Shield,
  MessageSquare,
  User,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUnreadCount } from '../lib/api';

type SidebarProps = {
  activeView: 'marketplace' | 'dashboard' | 'messages' | 'agency';
  onViewChange: (view: 'marketplace' | 'dashboard' | 'messages' | 'agency') => void;
};

function useAuth() {
  const [user, setUser] = useState<{ role: string; displayName: string } | null>(null);
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('pv_user') : null;
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { setUser(null); }
    }
  }, []);
  return user;
}

function useUnreadCount() {
  const user = useAuth();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    getUnreadCount().then((r) => setCount(r.count)).catch(() => {});
  }, [user]);
  return count;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuth();
  const unreadCount = useUnreadCount();

  const agencyItems = user?.role === 'AGENCY' ? (
    <Link
      href="/agency"
      onClick={() => onViewChange('agency')}
      className={`
        flex w-full items-center gap-3 py-2.5 px-3
        ${pathname.startsWith('/agency') ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'}
      `}
    >
      <Building2 size={18} />
      <span>Agency Portal</span>
    </Link>
  ) : null;

  const adminItems = user?.role === 'ADMIN' ? (
    <Link
      href="/admin/agencies"
      className={`
        flex w-full items-center gap-3 py-2.5 px-3
        ${pathname.startsWith('/admin') ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'}
      `}
    >
      <Shield size={18} />
      <span>Admin Panel</span>
    </Link>
  ) : null;

  return (
    <aside className="w-64 h-screen sticky top-0 bg-[#0b0f19] border-r border-[#1e293b]/40 flex flex-col">
      {/* Branding */}
      <div className="p-6 border-b border-[#1e293b]/40">
        <h1 className="text-xl font-bold text-primary" style={{ fontFamily: "'DM Serif Display', serif" }}>
          PropVest
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Investment Platform</p>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/"
          className={`
            flex w-full items-center gap-3 py-2.5 px-3
            ${pathname === '/' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'}
          `}
        >
          <LayoutGrid size={18} />
          <span>Marketplace</span>
        </Link>

        <button
          onClick={() => onViewChange('dashboard')}
          className={`
            flex w-full items-center gap-3 py-2.5 px-3
            ${activeView === 'dashboard' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'}
          `}
        >
          <BarChart3 size={18} />
          <span>Dashboard</span>
        </button>

        {agencyItems}
        {adminItems}

        <button
          onClick={() => onViewChange('messages')}
          className={`
            flex w-full items-center gap-3 py-2.5 px-3
            ${activeView === 'messages' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-200'}
          `}
        >
          <MessageSquare size={18} />
          <span>Messages</span>
          {unreadCount > 0 && (
            <span className="ml-auto badge bg-blue-500 text-white text-xs">{unreadCount}</span>
          )}
        </button>
      </nav>

      {/* Bottom items */}
      <div className="p-4 border-t border-[#1e293b]/40 space-y-1">
        <button className="flex w-full items-center gap-3 py-2.5 px-3 text-slate-400 hover:text-slate-200">
          <Sun size={18} />
          <span>Light Mode</span>
        </button>
        {user ? (
          <>
            <div className="flex w-full items-center gap-3 py-2.5 px-3 text-slate-400 hover:text-slate-200">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User size={14} className="text-primary" />
              </div>
              <span className="truncate">{user.displayName}</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('pv_user');
                localStorage.removeItem('pv_access_token');
                localStorage.removeItem('pv_refresh_token');
                window.location.reload();
              }}
              className="flex w-full items-center gap-3 py-2.5 px-3 text-red-400 hover:text-red-300"
            >
              <span className="ml-0">Logout</span>
            </button>
          </>
        ) : (
          <Link href="/login" className="flex w-full items-center gap-3 py-2.5 px-3 text-slate-400 hover:text-slate-200">
            <User size={18} />
            <span>Login</span>
          </Link>
        )}
      </div>
    </aside>
  );
}