"use client";

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';

interface Props {
  children: React.ReactNode;
}

export default function LayoutClientWrapper({ children }: Props) {
  const [activeView, setActiveView] = useState<'marketplace' | 'dashboard' | 'messages' | 'agency'>('marketplace');

  return (
    <div className="flex h-screen">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}