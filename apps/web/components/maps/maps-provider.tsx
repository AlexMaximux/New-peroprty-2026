'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useLoadScript } from '@react-google-maps/api';

interface MapsContextValue {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const MapsContext = createContext<MapsContextValue>({
  isLoaded: false,
  loadError: undefined,
});

const libraries: ('places')[] = ['places'];

export function MapsProvider({ children }: { children: ReactNode }) {
  const { isLoaded, loadError } = useLoadScript({
    id: 'google-maps-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries,
  });

  return (
    <MapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </MapsContext.Provider>
  );
}

export function useMaps(): MapsContextValue {
  return useContext(MapsContext);
}
