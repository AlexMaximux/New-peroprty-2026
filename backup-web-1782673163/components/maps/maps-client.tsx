'use client';

import { type ReactNode } from 'react';
import { MapsProvider } from '@/components/maps/maps-provider';

export function MapsClient({ children }: { children: ReactNode }) {
  return <MapsProvider>{children}</MapsProvider>;
}
