"use client"

import * as React from "react"
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api"

const containerStyle = {
  width: "100%",
  height: "260px",
  borderRadius: "12px",
}

const defaultCenter = {
  lat: 54.5,
  lng: -2.0, // Center of UK
}

// Dark map style matching the PropVest emerald institutional dark theme
const darkMapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#10141a" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#10141a" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#747b85" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#dfe2eb" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#54e98a", opacity: 0.5 }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#1a212d" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212b3b" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#212b3b" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#2d3a4f" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0a0e14" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#475569" }],
    },
  ],
}

interface Props {
  lat: number | null
  lng: number | null
  zoom?: number
}

const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"]

export function PropVestMap({ lat, lng, zoom = 14 }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  const { isLoaded, loadError } = useJsApiLoader({
    id: "propvest-google-map",
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  })

  const center = lat && lng ? { lat, lng } : defaultCenter
  const mapZoom = lat && lng ? zoom : 6

  if (loadError) {
    return (
      <div className="w-full h-[260px] bg-slate-950/60 border border-red-900/30 rounded-xl flex flex-col items-center justify-center text-xs text-red-400 p-4 text-center gap-2">
        <span className="text-sm font-semibold">Map Load Failed</span>
        <span className="text-[10px] text-red-500/80 leading-relaxed">
          Could not initialize Google Maps. Please check your network or API key configuration.
        </span>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[260px] bg-slate-950/60 border border-white/[0.06] rounded-xl flex flex-col items-center justify-center text-xs text-[var(--text-muted)] animate-pulse gap-2">
        <span className="w-5 h-5 rounded-full border-2 border-t-transparent border-[var(--accent)] animate-spin" />
        Loading Google Maps...
      </div>
    )
  }

  return (
    <div className="overflow-hidden border border-white/[0.08] rounded-xl shadow-lg shadow-black/40">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={mapZoom}
        options={darkMapOptions}
      >
        {lat && lng && (
          <Marker
            position={center}
          />
        )}
      </GoogleMap>
    </div>
  )
}
