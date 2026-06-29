'use client';

import { GoogleMap, Marker } from '@react-google-maps/api';
import { useMaps } from '@/components/maps/maps-provider';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  address: string;
  className?: string;
}

const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '0.75rem' };
const defaultZoom = 15;

export function PropertyMap({ latitude, longitude, address, className = '' }: PropertyMapProps) {
  const { isLoaded, loadError } = useMaps();

  if (loadError) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-deep-800 ${className}`}>
        <div className="text-center text-slate-500">
          <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="mt-2 text-sm">Map unavailable</p>
          <p className="mt-1 text-xs text-slate-600">{address}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex animate-pulse items-center justify-center rounded-xl bg-deep-800 ${className}`}>
        <div className="text-center text-slate-500">
          <div className="mx-auto h-8 w-8 rounded-full bg-deep-700" />
          <p className="mt-2 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  const center = { lat: latitude, lng: longitude };

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={defaultZoom}
      options={{
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1a1b2e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1b2e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
          {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#cbd5e1' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#2d2f4a' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#3b3d5c' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0f172a' }],
          },
          {
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [{ color: '#252742' }],
          },
        ],
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      <Marker
        position={center}
        title={address}
        icon={{
          url: 'data:image/svg+xml,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">' +
            '<circle cx="18" cy="18" r="16" fill="rgba(234,179,8,0.3)" stroke="rgba(234,179,8,0.6)" stroke-width="2"/>' +
            '<circle cx="18" cy="18" r="8" fill="#eab308" stroke="#1a1b2e" stroke-width="2"/>' +
            '</svg>',
          ),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        }}
      />
    </GoogleMap>
  );
}