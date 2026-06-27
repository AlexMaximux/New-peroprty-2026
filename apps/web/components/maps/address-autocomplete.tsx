'use client';

import { useRef, useState, useCallback } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { useMaps } from '@/components/maps/maps-provider';

export interface PlaceResult {
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  region: string | null;
  nation: string | null;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface AddressAutocompleteProps {
  onPlaceSelected: (place: PlaceResult) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  onPlaceSelected,
  defaultValue,
  placeholder = 'Start typing an address...',
  className = '',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useMaps();

  const onLoad = useCallback((ac: google.maps.places.Autocomplete) => {
    setAutocomplete(ac);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    if (!place || !place.geometry || !place.geometry.location) return;

    const addressComponents = place.address_components ?? [];
    const getComponent = (types: string[]): string | null => {
      const comp = addressComponents.find((c) => types.some((t) => c.types.includes(t)));
      return comp?.long_name ?? null;
    };

    const streetNumber = getComponent(['street_number']) ?? '';
    const route = getComponent(['route']) ?? '';
    const sublocality = getComponent(['sublocality', 'sublocality_level_1', 'sublocality_level_2']);
    const city = getComponent(['locality', 'postal_town']) ?? '';
    const postcode = getComponent(['postal_code']) ?? '';
    const region = getComponent(['administrative_area_level_1', 'administrative_area_level_2']);
    const nation = getComponent(['country']) ?? '';
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    const addressLine1 = [streetNumber, route].filter(Boolean).join(' ') || (place.name ?? '');

    onPlaceSelected({
      addressLine1,
      addressLine2: sublocality ?? '',
      city,
      postcode,
      region,
      nation,
      latitude: lat,
      longitude: lng,
      formattedAddress: place.formatted_address ?? addressLine1,
    });
  }, [autocomplete, onPlaceSelected]);

  if (loadError) {
    return (
      <input
        ref={inputRef}
        className={`input-field w-full ${className}`}
        placeholder={`${placeholder} (Map unavailable)`}
        defaultValue={defaultValue}
      />
    );
  }

  if (!isLoaded) {
    return (
      <input
        ref={inputRef}
        className={`input-field w-full animate-pulse ${className}`}
        placeholder="Loading address lookup..."
        disabled
      />
    );
  }

  return (
    <AutocompleteWrapper
      inputRef={inputRef}
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
    />
  );
}

/** Separate component to access Autocomplete ref via onLoad */
function AutocompleteWrapper({
  inputRef,
  onLoad,
  onPlaceChanged,
  defaultValue,
  placeholder,
  className,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onLoad: (ac: google.maps.places.Autocomplete) => void;
  onPlaceChanged: () => void;
  defaultValue?: string;
  placeholder: string;
  className: string;
}) {
  return (
    <>
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        fields={['address_components', 'geometry', 'formatted_address', 'name']}
        types={['address']}
      >
        <input
          ref={inputRef}
          className={`input-field w-full ${className}`}
          placeholder={placeholder}
          defaultValue={defaultValue}
        />
      </Autocomplete>
    </>
  );
}