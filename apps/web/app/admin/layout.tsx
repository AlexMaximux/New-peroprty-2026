'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('pv_user') ?? 'null');
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, []);

  if (!authorized) return null;

  const links = [
    { href: '/admin/agencies', label: 'Agencies' },
    { href: '/admin/listings', label: 'Listings' },
    { href: '/admin/audit-log', label: 'Audit Log' },
  ];

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="mt-3 flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link text-sm ${pathname === l.href ? 'active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}