"use client"

import * as React from "react"
import { 
  MapPin, 
  Camera, 
  X, 
  Building2, 
  TrendingUp, 
  Banknote, 
  ClipboardCheck,
  Plus,
  Trash2,
  FileText,
  Train,
  Hospital,
  GraduationCap,
  Dumbbell
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import type { HmoFormData, Room } from "./wizard-types"
import { PropVestMap } from "./google-map"
import { geocodeAddress } from "@/lib/api"

interface Props {
  data: HmoFormData
  onChange: (patch: Partial<HmoFormData>) => void
  onSubmit: () => void
  onSaveDraft: () => void
  submitting: boolean
  onBack: () => void
  isAgencyVerified?: boolean
}

const getPoiIcon = (types: string[]) => {
  if (!types || !Array.isArray(types)) return <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
  if (types.includes('university') || types.includes('school')) return <GraduationCap className="w-3.5 h-3.5 text-[var(--accent)]" />
  if (types.includes('hospital')) return <Hospital className="w-3.5 h-3.5 text-red-400" />
  if (types.includes('transit_station') || types.includes('train_station') || types.includes('subway_station')) return <Train className="w-3.5 h-3.5 text-blue-400" />
  if (types.includes('gym')) return <Dumbbell className="w-3.5 h-3.5 text-green-400" />
  return <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
}

export function HmoListingForm({ data, onChange, onSubmit, onSaveDraft, submitting, onBack, isAgencyVerified = false }: Props) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  // Geocoding Coordinates
  const [coordinates, setCoordinates] = React.useState<{ lat: number; lng: number } | null>(
    data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : null
  )
  const [geocoding, setGeocoding] = React.useState(false)

  // Nearby POIs
  const [nearbyPOIs, setNearbyPOIs] = React.useState<any[]>(data.nearbyPlaces || [])
  const [loadingPOIs, setLoadingPOIs] = React.useState(false)

  // Maps and Places Autocomplete Setup
  const [mapsLoaded, setMapsLoaded] = React.useState(false)
  const autocompleteInputRef = React.useRef<HTMLInputElement | null>(null)
  const postcodeInputRef = React.useRef<HTMLInputElement | null>(null)
  const autocompleteRef = React.useRef<any>(null)
  const postcodeAutocompleteRef = React.useRef<any>(null)

  React.useEffect(() => {
    if (typeof window !== "undefined" && (window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
      setMapsLoaded(true)
      return
    }
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
        setMapsLoaded(true)
        clearInterval(interval)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const initialFetchSkipped = React.useRef(false)

  React.useEffect(() => {
    if (!coordinates || !mapsLoaded) {
      return
    }

    if (!initialFetchSkipped.current && data.latitude === coordinates.lat && data.longitude === coordinates.lng && data.nearbyPlaces && data.nearbyPlaces.length > 0) {
      initialFetchSkipped.current = true
      return
    }

    let isMounted = true
    setLoadingPOIs(true)

    const fetchPOIs = async () => {
      const maps = (window as any).google.maps
      if (!maps || !maps.places) return

      const service = new maps.places.PlacesService(document.createElement('div'))

      const searchType = (type: string): Promise<any[]> => {
        return new Promise((resolve) => {
          service.nearbySearch({
            location: coordinates,
            radius: 5000,
            type: type
          }, (results: any[], status: string) => {
            if (status === maps.places.PlacesServiceStatus.OK && results) {
              resolve(results)
            } else {
              resolve([])
            }
          })
        })
      }

      try {
        const typesToSearch = ['university', 'hospital', 'transit_station', 'lodging', 'school', 'gym']
        const allResults = await Promise.all(typesToSearch.map(t => searchType(t)))
        
        const flatResults = allResults.flat()
        const uniquePlaces = new Map()
        
        flatResults.forEach(place => {
          const reviewsCount = place.user_ratings_total || 0
          if (reviewsCount >= 100 && !uniquePlaces.has(place.place_id)) {
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            
            const R = 3958.8 
            const rlat1 = coordinates.lat * (Math.PI/180)
            const rlat2 = lat * (Math.PI/180)
            const difflat = rlat2 - rlat1
            const difflon = (lng - coordinates.lng) * (Math.PI/180)
            
            const d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)))
            
            place.distanceMiles = d
            uniquePlaces.set(place.place_id, place)
          }
        })

        if (isMounted) {
          const sorted = Array.from(uniquePlaces.values()).sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 10)
          
          const formattedPOIs = sorted.map(p => ({
            name: p.name,
            place_id: p.place_id,
            types: p.types,
            distanceMiles: p.distanceMiles
          }))
          
          setNearbyPOIs(formattedPOIs)
          onChange({ nearbyPlaces: formattedPOIs })
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (isMounted) setLoadingPOIs(false)
      }
    }

    fetchPOIs()

    return () => { isMounted = false }
  }, [coordinates, mapsLoaded])

  const handlePlaceSelected = React.useCallback((place: any) => {
    if (!place || !place.geometry || !place.geometry.location) return

    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    setCoordinates({ lat, lng })

    // Parse address components
    const components = place.address_components || []
    const getComponent = (types: string[]): string | null => {
      const comp = components.find((c: any) => types.some((t) => c.types.includes(t)))
      return comp?.long_name ?? null
    }

    const streetNumber = getComponent(["street_number"]) ?? ""
    const route = getComponent(["route"]) ?? ""
    const city = getComponent(["locality", "postal_town"]) ?? ""
    const postcode = getComponent(["postal_code"]) ?? ""
    const region = getComponent(["administrative_area_level_1", "administrative_area_level_2"])

    const updates: Partial<HmoFormData> = {}

    if (postcode) updates.postcode = postcode
    if (streetNumber) updates.houseNumber = streetNumber
    
    if (region) {
      const mappedRegion = region.toLowerCase()
      if (["north", "south", "central", "wales", "scotland"].includes(mappedRegion)) {
        updates.region = mappedRegion as any
      }
    }

    // Build manual address: "Street Number Street Name, City" or formatted_address
    const streetAddress = [streetNumber, route].filter(Boolean).join(" ")
    const fullAddressLine = [streetAddress, city].filter(Boolean).join(", ")
    updates.manualAddress = fullAddressLine || place.formatted_address || ""

    onChange(updates)
  }, [onChange])

  React.useEffect(() => {
    if (mapsLoaded) {
      const maps = (window as any).google.maps
      if (maps && maps.places) {
        // 1. Address Lookup Autocomplete (No type restriction to allow streets & postcodes)
        if (autocompleteInputRef.current && !autocompleteRef.current) {
          console.log("Initializing Address Lookup Autocomplete...")
          const autocomplete = new maps.places.Autocomplete(autocompleteInputRef.current, {
            componentRestrictions: { country: "gb" },
            fields: ["address_components", "geometry", "formatted_address", "name"],
          })

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace()
            console.log("Address Lookup selected place:", place)
            handlePlaceSelected(place)
          })

          autocompleteRef.current = autocomplete
        }

        // 2. Postcode input Autocomplete (Allows postcodes to show dropdown suggestions)
        if (postcodeInputRef.current && !postcodeAutocompleteRef.current) {
          console.log("Initializing Postcode Autocomplete...")
          const postcodeAutocomplete = new maps.places.Autocomplete(postcodeInputRef.current, {
            componentRestrictions: { country: "gb" },
            fields: ["address_components", "geometry", "formatted_address", "name"],
          })

          postcodeAutocomplete.addListener("place_changed", () => {
            const place = postcodeAutocomplete.getPlace()
            console.log("Postcode input selected place:", place)
            handlePlaceSelected(place)
          })

          postcodeAutocompleteRef.current = postcodeAutocomplete
        }
      }
    }
  }, [mapsLoaded, handlePlaceSelected])

  // Geocode address when postcode is filled
  const triggerGeocode = React.useCallback(async (postcode: string) => {
    if (!postcode || postcode.trim().length < 5) return
    setGeocoding(true)
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
      let lat: number | null = null
      let lng: number | null = null
      let region: string | null = null

      // 1. Attempt using Google Maps JS SDK Geocoder (so referrer restrictions work correctly and no CORS)
      if (typeof window !== "undefined" && (window as any).google && (window as any).google.maps) {
        try {
          const geocoder = new (window as any).google.maps.Geocoder()
          const sdkResult = await new Promise<any>((resolve, reject) => {
            geocoder.geocode({ address: postcode }, (results: any, status: any) => {
              if (status === "OK" && results && results.length > 0) {
                resolve(results[0])
              } else {
                reject(new Error(`Geocoding status: ${status}`))
              }
            })
          })
          if (sdkResult) {
            lat = sdkResult.geometry.location.lat()
            lng = sdkResult.geometry.location.lng()
            const regionComp = sdkResult.address_components.find((c: any) =>
              c.types.includes("administrative_area_level_1") || c.types.includes("administrative_area_level_2")
            )
            if (regionComp) region = regionComp.long_name
          }
        } catch (sdkErr) {
          console.warn("JS SDK Geocoding failed, trying fetch:", sdkErr)
        }
      }

      // 2. Fallback to direct client-side fetch if SDK failed or wasn't available
      if ((lat === null || lng === null) && apiKey) {
        try {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postcode)}&key=${apiKey}`)
          if (res.ok) {
            const geocodeResult = await res.json()
            if (geocodeResult.status === "OK" && geocodeResult.results.length > 0) {
              const addressObj = geocodeResult.results[0]
              lat = addressObj.geometry.location.lat
              lng = addressObj.geometry.location.lng
              
              // Extract region from components
              const regionComp = addressObj.address_components.find((c: any) =>
                c.types.includes("administrative_area_level_1") || c.types.includes("administrative_area_level_2")
              )
              if (regionComp) region = regionComp.long_name
            }
          }
        } catch (clientErr) {
          console.warn("Client-side geocoding fetch failed:", clientErr)
        }
      }

      // 2. Fallback to backend API if client-side geocoding did not return lat/lng
      if (lat === null || lng === null) {
        try {
          const geo = await geocodeAddress(postcode)
          if (geo.results && geo.results.length > 0) {
            const result = geo.results[0]
            if (result) {
              lat = result.latitude ?? lat
              lng = result.longitude ?? lng
              region = result.region ?? null
            }
          }
        } catch (geoErr) {
          console.warn("Backend geocoding failed:", geoErr)
        }
      }

      if (lat !== null && lng !== null) {
        setCoordinates({ lat, lng })
        if (region) {
          const mappedRegion = region.toLowerCase()
          if (["north", "south", "central", "wales", "scotland"].includes(mappedRegion)) {
            onChange({ region: mappedRegion as any })
          }
        }
      }
    } catch (err) {
      console.error("Geocoding failed:", err)
    } finally {
      setGeocoding(false)
    }
  }, [onChange])

  // Geocode on initial render or postcode change if coordinates not yet resolved
  React.useEffect(() => {
    if (data.postcode && data.postcode.trim().length >= 5 && !coordinates && !geocoding) {
      triggerGeocode(data.postcode)
    }
  }, [data.postcode, coordinates, geocoding, triggerGeocode])

  // Geocode on blur
  const handlePostcodeBlur = () => {
    triggerGeocode(data.postcode)
  }

  // File zone handlers
  const handleMediaAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length) {
      onChange({ mediaFiles: [...data.mediaFiles, ...files] })
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeMedia = (index: number) => {
    onChange({ mediaFiles: data.mediaFiles.filter((_, i) => i !== index) })
  }

  // Room additions
  const addRoom = () => {
    const nextId = (data.rooms.length + 1).toString()
    const newRoom: Room = { id: nextId, type: "Double En-Suite", monthlyRent: 0 }
    onChange({ rooms: [...data.rooms, newRoom] })
  }

  const updateRoom = (id: string, patch: Partial<Room>) => {
    onChange({
      rooms: data.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })
  }

  const removeRoom = (id: string) => {
    if (data.rooms.length <= 1) return
    onChange({ rooms: data.rooms.filter((r) => r.id !== id) })
  }

  // Financial calculations
  const totalRoomIncome = data.rooms.reduce((s, r) => s + r.monthlyRent, 0)
  const monthlyGrossProfit = totalRoomIncome - data.rentToLandlord

  // Maintenance Cost: dynamic % of Room Income, default 5%
  const monthlyMaintenance = data.runMaintenanceTicked
    ? Math.round(totalRoomIncome * (data.runMaintenancePercent / 100))
    : 0

  // Management Cost: dynamic % of Room Income, default 10%
  const monthlyManagement = data.managementAvailable
    ? Math.round(totalRoomIncome * (data.managementFeePercent / 100))
    : 0

  // Management Fee Calculation for Managed Scenario (Section 4 Display & Projections):
  // If management is NOT available, count fee as 10%. If available, use the fee percent set.
  const finalManagementPercent = data.managementAvailable ? data.managementFeePercent : 10
  const finalManagementFee = Math.round(totalRoomIncome * (finalManagementPercent / 100))

  // Y1 Running Cost (Self Managed) - includes rent to landlord, utility, tax, cleaning, amortized finder fee, maintenance, others
  const runningCostSelfManageY1 = (
    data.rentToLandlord +
    (data.runUtilityTicked ? data.runUtilityCost : 0) +
    (data.runCouncilTaxTicked ? data.runCouncilTaxCost : 0) +
    (data.runCleaningTicked ? data.runCleaningCost : 0) +
    Math.round(data.finderFee / 12) +
    monthlyMaintenance +
    (data.runOtherTicked ? data.runOtherCost : 0)
  )

  // Y1 Running Cost (Managed) - uses finalManagementFee
  const runningCostManagedY1 = runningCostSelfManageY1 + finalManagementFee

  // Y2 Running Cost (Self Managed) - NO FINDER FEE, includes rent to landlord
  const runningCostSelfManageY2 = (
    data.rentToLandlord +
    (data.runUtilityTicked ? data.runUtilityCost : 0) +
    (data.runCouncilTaxTicked ? data.runCouncilTaxCost : 0) +
    (data.runCleaningTicked ? data.runCleaningCost : 0) +
    monthlyMaintenance +
    (data.runOtherTicked ? data.runOtherCost : 0)
  )

  // Y2 Running Cost (Managed) - NO FINDER FEE
  const runningCostManagedY2 = runningCostSelfManageY2 + finalManagementFee

  // Total Money Needed In
  const moneyNeeded = data.rentToLandlord + data.deposit + data.finderFee + data.refurbCost

  // Y1 Net Profits & ROIs
  const profitY1SelfManage = (totalRoomIncome - runningCostSelfManageY1) * 12
  const roiY1SelfManage = moneyNeeded > 0 ? (profitY1SelfManage / moneyNeeded) * 100 : 0

  const profitY1Managed = (totalRoomIncome - runningCostManagedY1) * 12
  const roiY1Managed = moneyNeeded > 0 ? (profitY1Managed / moneyNeeded) * 100 : 0

  // Y2 Net Profits & ROIs (No Finder Fee)
  const profitY2SelfManage = (totalRoomIncome - runningCostSelfManageY2) * 12
  const roiY2SelfManage = moneyNeeded > 0 ? (profitY2SelfManage / moneyNeeded) * 100 : 0

  const profitY2Managed = (totalRoomIncome - runningCostManagedY2) * 12
  const roiY2Managed = moneyNeeded > 0 ? (profitY2Managed / moneyNeeded) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <button onClick={onBack} className="text-xs font-semibold text-[var(--text-muted)] hover:text-white mb-1 flex items-center gap-1">
            ← Back to strategies
          </button>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">R2R HMO Listing</h2>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#3398db] bg-[#3398db]/15 px-2.5 py-1 rounded border border-[#3398db]/30 shadow-sm shadow-[#3398db]/10">
          Draft
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 0: Title & Subheading */}
          <div className="bg-slate-950/40 border border-white/[0.06] p-6 rounded-xl space-y-5 animate-fade-in">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--secondary-container)] text-white flex items-center justify-center text-xs">0</span>
              <FileText className="w-4 h-4 text-[var(--accent)]" />
              Listing Details (Title &amp; Sub Heading)
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Listing Title
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => onChange({ title: e.target.value })}
                  placeholder="e.g., 5 Bed HMO with High Yield Sourced in Birmingham"
                  className="flex h-9 w-full rounded-md border border-white/[0.08] bg-slate-900/50 px-3 py-1 text-xs outline-none transition-colors placeholder:text-slate-500 focus-visible:border-[var(--accent)]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Sub Heading / Description
                </label>
                <Textarea
                  value={data.description}
                  onChange={(e) => onChange({ description: e.target.value })}
                  placeholder="Provide a brief summary or subheading description of this R2R HMO listing..."
                  className="min-h-[80px] border border-white/[0.08] bg-slate-900/50 text-xs placeholder:text-slate-500 focus-visible:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          {/* Section 1: Address & Region */}
          <div className="bg-slate-950/40 border border-white/[0.06] p-6 rounded-xl space-y-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--secondary-container)] text-white flex items-center justify-center text-xs">1</span>
              <MapPin className="w-4 h-4 text-[var(--accent)]" />
              Address &amp; Region
            </h3>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                Address Lookup (Google Autocomplete)
                <span className="text-[8px] bg-[var(--accent-subtle)] text-[var(--accent)] px-1.5 py-0.5 rounded border border-[var(--accent-border)] font-bold tracking-normal uppercase">
                  {mapsLoaded ? "Active" : "Loading..."}
                </span>
              </label>
              <input
                ref={autocompleteInputRef}
                placeholder="Start typing your UK address to auto-fill..."
                className="flex h-9 w-full rounded-md border border-white/[0.08] bg-slate-900/50 px-3 py-1 text-xs outline-none transition-colors placeholder:text-slate-500 focus-visible:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Postcode</label>
                <div className="relative">
                  <input
                    ref={postcodeInputRef}
                    placeholder="e.g. B11 3AQ"
                    value={data.postcode}
                    onChange={(e) => onChange({ postcode: e.target.value })}
                    onBlur={handlePostcodeBlur}
                    className="flex h-9 w-full rounded-md border border-white/[0.08] bg-slate-900/50 px-3 py-1 text-xs outline-none transition-colors placeholder:text-slate-500 focus-visible:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 pr-20 bg-slate-900/50 border-white/[0.08]"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--accent-subtle)] text-[var(--accent)] text-[8px] px-1.5 py-0.5 font-bold rounded border border-[var(--accent-border)]">
                    {geocoding ? "Checking..." : "Maps API"}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">House / Flat No.</label>
                <Input
                  placeholder="e.g. 42"
                  value={data.houseNumber}
                  onChange={(e) => onChange({ houseNumber: e.target.value })}
                  className="bg-slate-900/50 border-white/[0.08]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Region</label>
              <Select value={data.region} onValueChange={(v) => onChange({ region: v as any })}>
                <SelectTrigger className="bg-slate-900/50 border-white/[0.08]"><SelectValue placeholder="Select region..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="central">Central</SelectItem>
                  <SelectItem value="wales">Wales</SelectItem>
                  <SelectItem value="scotland">Scotland</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Manual Address</label>
              <Textarea
                placeholder="Full street address, town, county..."
                value={data.manualAddress}
                onChange={(e) => onChange({ manualAddress: e.target.value })}
                rows={2}
                className="bg-slate-900/50 border-white/[0.08] text-xs"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Property Type</label>
                <Select value={data.propertyType} onValueChange={(v) => onChange({ propertyType: v as any })}>
                  <SelectTrigger className="bg-slate-900/50 border-white/[0.08]"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terraced">Terraced</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="detached">Detached</SelectItem>
                    <SelectItem value="semi">Semi-Detached</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {data.propertyType === "other" && (
                <div className="space-y-1.5 animate-slide-down">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Explain property type</label>
                  <Input
                    placeholder="Describe property type"
                    value={data.otherPropertyExplain}
                    onChange={(e) => onChange({ otherPropertyExplain: e.target.value })}
                    className="bg-slate-900/50 border-white/[0.08]"
                  />
                </div>
              )}
            </div>

            {/* Media */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Media — Pictures &amp; Video</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-white/[0.08] hover:border-[var(--accent-border)] rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/20 group"
              >
                <Camera className="w-6 h-6 text-[var(--text-faint)] mx-auto mb-2 group-hover:text-[var(--accent)] transition-colors" />
                <p className="text-xs text-[var(--text-muted)] font-semibold">Drag &amp; drop files here</p>
                <p className="text-[10px] text-[var(--text-faint)] mt-1">or <span className="text-[var(--accent)] hover:underline">browse to upload</span> — JPG, PNG, MP4 up to 500MB</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaAdd} />

              {data.mediaFiles.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2 animate-fade-in">
                  {data.mediaFiles.map((file, i) => (
                    <div key={`new-${i}`} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-900/50 border border-white/[0.06]">
                      {file.type.startsWith("image/") ? (
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--text-muted)]">Video</div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeMedia(i) }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {(data.existingMedia || []).length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2 animate-fade-in">
                  {(data.existingMedia || []).map((file: any, i: number) => (
                    <div key={`existing-${i}`} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-900/50 border border-white/[0.06]">
                      {file.kind === 'PHOTO' && file.url ? (
                        <img src={file.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--text-muted)]">Video</div>
                      )}
                      {/* Note: Delete logic for existing media can be added later if needed */}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: HMO Details */}
          <div className="bg-slate-950/40 border border-white/[0.06] p-6 rounded-xl space-y-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--secondary-container)] text-white flex items-center justify-center text-xs">2</span>
              <Building2 className="w-4 h-4 text-[var(--accent)]" />
              HMO Details
            </h3>

            {/* Status Chips */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Property Status (Select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Licensed", key: "statusLicensed" as const },
                  { label: "Tenanted", key: "statusTenanted" as const },
                  { label: "Needs Refurb", key: "statusNeedsRefurb" as const },
                ].map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => onChange({ [chip.key]: !data[chip.key] })}
                    className={`px-4 py-1.5 text-xs font-bold rounded border transition-all cursor-pointer ${
                      data[chip.key]
                        ? "bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)] font-bold"
                        : "bg-slate-900/40 text-[var(--text-muted)] border-white/[0.06] hover:bg-white/[0.02]"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* License details */}
            {!data.statusLicensed && (
              <div className="space-y-1.5 p-4 bg-red-500/[0.02] border border-red-500/10 rounded-xl animate-slide-down">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Reason for no license</label>
                <Select
                  value={data.licenseStatusReason}
                  onValueChange={(v) => onChange({ licenseStatusReason: v as any })}
                >
                  <SelectTrigger className="bg-slate-900/50 border-white/[0.08] text-xs">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_needed">Not needed</SelectItem>
                    <SelectItem value="expired">Expired / Renewal required</SelectItem>
                    <SelectItem value="applied_pending">Applied / Pending decision</SelectItem>
                    <SelectItem value="other">Other / Not yet applied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tenancy details */}
            {data.statusTenanted && (
              <div className="grid gap-4 sm:grid-cols-2 p-4 bg-sky-500/[0.02] border border-sky-500/10 rounded-xl animate-slide-down">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Tenancy Status</label>
                  <Select
                    value={data.tenancyStatus}
                    onValueChange={(v) => onChange({ tenancyStatus: v as any })}
                  >
                    <SelectTrigger className="bg-slate-900/50 border-white/[0.08] text-xs">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fully_tenanted">Fully Tenanted</SelectItem>
                      <SelectItem value="part_tenanted">Part Tenanted</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Tenancy Details / Explanation</label>
                  <Input
                    placeholder="e.g. 4 rooms tenanted, ASTs in place..."
                    value={data.tenancyDetails || ""}
                    onChange={(e) => onChange({ tenancyDetails: e.target.value })}
                    className="bg-slate-900/50 border-white/[0.08] text-xs"
                  />
                </div>
              </div>
            )}

            {/* Refurb details */}
            {data.statusNeedsRefurb && (
              <div className="grid gap-4 sm:grid-cols-2 p-4 bg-amber-500/[0.02] border border-amber-500/10 rounded-xl animate-slide-down">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Cost of Refurb (£)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 5000"
                    value={data.refurbCost || ""}
                    onChange={(e) => onChange({ refurbCost: parseInt(e.target.value) || 0 })}
                    className="bg-slate-900/50 border-white/[0.08]"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Cost Type</label>
                  <div className="flex rounded-lg overflow-hidden border border-white/[0.08] p-0.5 bg-slate-950/40 w-fit h-9 items-center">
                    <button
                      type="button"
                      onClick={() => onChange({ refurbIsQuoted: true })}
                      className={`px-4 py-1 text-xs font-bold transition-all cursor-pointer rounded ${data.refurbIsQuoted ? "bg-[var(--secondary-container)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
                    >
                      Quoted
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ refurbIsQuoted: false })}
                      className={`px-4 py-1 text-xs font-bold transition-all cursor-pointer rounded ${!data.refurbIsQuoted ? "bg-[var(--secondary-container)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
                    >
                      Estimated
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Furnished */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Furnished</label>
                <Select value={data.furnished} onValueChange={(v) => onChange({ furnished: v as any })}>
                  <SelectTrigger className="bg-slate-900/50 border-white/[0.08]"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unfurnished">Unfurnished</SelectItem>
                    <SelectItem value="semi">Semi-Furnished</SelectItem>
                    <SelectItem value="furnished">Furnished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {data.furnished === "furnished" && (
                <div className="space-y-1.5 animate-slide-down">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Quality</label>
                  <Select value={data.furnishQuality} onValueChange={(v) => onChange({ furnishQuality: v as any })}>
                    <SelectTrigger className="bg-slate-900/50 border-white/[0.08]"><SelectValue placeholder="Select quality..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Quality</SelectItem>
                      <SelectItem value="good">Good Quality</SelectItem>
                      <SelectItem value="medium">Medium Quality</SelectItem>
                      <SelectItem value="low">Low Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Yes/No Toggles */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Living Room */}
              <div className="flex flex-col gap-2 p-3.5 bg-slate-900/30 border border-white/[0.06] rounded-xl">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Living Room</span>
                <div className="flex rounded-lg overflow-hidden border border-white/[0.08] p-0.5 bg-slate-950/40 w-full h-8 items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onChange({ hasLivingRoom: true })}
                    className={`flex-1 py-1 text-[11px] font-bold transition-all cursor-pointer rounded text-center ${data.hasLivingRoom === true ? "bg-[var(--secondary-container)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ hasLivingRoom: false })}
                    className={`flex-1 py-1 text-[11px] font-bold transition-all cursor-pointer rounded text-center ${data.hasLivingRoom === false ? "bg-[var(--secondary-container)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Parking */}
              <div className="flex flex-col gap-2 p-3.5 bg-slate-900/30 border border-white/[0.06] rounded-xl">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Parking</span>
                <div className="flex rounded-lg overflow-hidden border border-white/[0.08] p-0.5 bg-slate-950/40 w-full h-8 items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onChange({ hasParking: true })}
                    className={`flex-1 py-1 text-[11px] font-bold transition-all cursor-pointer rounded text-center ${data.hasParking === true ? "bg-[var(--secondary-container)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ hasParking: false })}
                    className={`flex-1 py-1 text-[11px] font-bold transition-all cursor-pointer rounded text-center ${data.hasParking === false ? "bg-[var(--secondary-container)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Garden */}
              <div className="flex flex-col gap-2 p-3.5 bg-slate-900/30 border border-white/[0.06] rounded-xl">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Garden</span>
                <div className="flex rounded-lg overflow-hidden border border-white/[0.08] p-0.5 bg-slate-950/40 w-full h-8 items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onChange({ hasGarden: true })}
                    className={`flex-1 py-1 text-[11px] font-bold transition-all cursor-pointer rounded text-center ${data.hasGarden === true ? "bg-[var(--secondary-container)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ hasGarden: false })}
                    className={`flex-1 py-1 text-[11px] font-bold transition-all cursor-pointer rounded text-center ${data.hasGarden === false ? "bg-[var(--secondary-container)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            {/* Parking details */}
            {data.hasParking === true && (
              <div className="grid gap-4 sm:grid-cols-2 p-4 bg-slate-900/20 border border-white/[0.04] rounded-xl animate-slide-down">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Parking Spaces</label>
                  <Input
                    type="number"
                    placeholder="e.g. 2"
                    value={data.parkingSpaces || ""}
                    onChange={(e) => onChange({ parkingSpaces: parseInt(e.target.value) || 0 })}
                    className="bg-slate-900/50 border-white/[0.08]"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Explain Parking Requirement</label>
                  <Input
                    placeholder="e.g. Driveway, Permit required"
                    value={data.parkingOtherExplain}
                    onChange={(e) => onChange({ parkingOtherExplain: e.target.value })}
                    className="bg-slate-900/50 border-white/[0.08]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Rooms & Potential Income */}
          <div className="bg-slate-950/40 border border-white/[0.06] p-6 rounded-xl space-y-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--secondary-container)] text-white flex items-center justify-center text-xs">3</span>
              <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
              Rooms &amp; Potential Income
            </h3>

            {/* Room List */}
            <div className="space-y-3">
              {data.rooms.map((room, i) => (
                <div key={room.id} className="flex gap-3 items-center p-3 bg-slate-900/30 border border-white/[0.06] rounded-xl animate-fade-in">
                  <span className="w-7 h-7 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] text-xs font-bold flex-shrink-0">
                    Room {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Select value={room.type} onValueChange={(v) => updateRoom(room.id, { type: v })}>
                      <SelectTrigger className="bg-slate-900/50 border-white/[0.08] h-9 text-xs"><SelectValue placeholder="Select room type..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Double En-Suite">Double En-Suite</SelectItem>
                        <SelectItem value="Single En-Suite">Single En-Suite</SelectItem>
                        <SelectItem value="Double Shared Bathroom">Double Shared Bathroom</SelectItem>
                        <SelectItem value="Single Shared Bathroom">Single Shared Bathroom</SelectItem>
                        <SelectItem value="Studio">Studio</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {room.type === "Other" && (
                    <div className="flex-[0.8] min-w-0 animate-slide-down">
                      <Input
                        placeholder="Explain room type"
                        value={room.customType || ""}
                        onChange={(e) => updateRoom(room.id, { customType: e.target.value })}
                        className="bg-slate-900/50 border-white/[0.08] h-9 text-xs"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-[var(--text-muted)]">£</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={room.monthlyRent || ""}
                      onChange={(e) => updateRoom(room.id, { monthlyRent: parseInt(e.target.value) || 0 })}
                      className="w-24 bg-slate-900/50 border-white/[0.08] h-9 text-right text-xs font-mono font-bold"
                      min={0}
                    />
                    <span className="text-[10px] text-[var(--text-muted)]">/mo</span>
                  </div>
                  {data.rooms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoom(room.id)}
                      className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addRoom}
              className="w-full border-dashed border-white/[0.08] text-[var(--text-primary)] hover:border-[var(--accent-border)] hover:bg-white/[0.02] flex items-center justify-center gap-1 text-xs"
            >
              <Plus className="w-4 h-4" /> Add Room
            </Button>

            {/* Potential Income Breakdown */}
            <div className="bg-slate-950/40 border border-white/[0.06] rounded-xl p-4">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Potential Income Breakdown</p>
              {totalRoomIncome > 0 ? (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--text-muted)]">Total Room Income</span>
                  <span className="text-sm font-mono font-bold text-[var(--accent)]">£{totalRoomIncome.toLocaleString()}/month</span>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic">Enter room rents above to calculate potential income</p>
              )}
            </div>
          </div>

          {/* Section 4: Financials */}
          <div className="bg-slate-950/40 border border-white/[0.06] p-6 rounded-xl space-y-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--secondary-container)] text-white flex items-center justify-center text-xs">4</span>
              <Banknote className="w-4 h-4 text-[var(--accent)]" />
              Financials
            </h3>

            {/* Rent to Landlord + Deposit */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Rent to Landlord (£/month)</label>
                <Input
                  type="number"
                  placeholder="e.g. 1200"
                  value={data.rentToLandlord || ""}
                  onChange={(e) => onChange({ rentToLandlord: parseInt(e.target.value) || 0 })}
                  className="bg-slate-900/50 border-white/[0.08]"
                  min={0}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Deposit (£)</label>
                <Input
                  type="number"
                  placeholder="e.g. 3600"
                  value={data.deposit || ""}
                  onChange={(e) => onChange({ deposit: parseInt(e.target.value) || 0 })}
                  className="bg-slate-900/50 border-white/[0.08]"
                  min={0}
                />
              </div>
            </div>

            {/* Contract Length + Review Period */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Contract Length</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="3"
                    value={data.contractLength || ""}
                    onChange={(e) => onChange({ contractLength: parseInt(e.target.value) || 1 })}
                    className="bg-slate-900/50 border-white/[0.08] flex-1"
                    min={1}
                  />
                  <Select value={data.contractLengthUnit} onValueChange={(v) => onChange({ contractLengthUnit: v as any })}>
                    <SelectTrigger className="w-28 bg-slate-900/50 border-white/[0.08]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="years">Years</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Review After</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="1"
                    value={data.reviewAfter || ""}
                    onChange={(e) => onChange({ reviewAfter: parseInt(e.target.value) || 1 })}
                    className="bg-slate-900/50 border-white/[0.08] flex-1"
                    min={1}
                  />
                  <Select value={data.reviewAfterUnit} onValueChange={(v) => onChange({ reviewAfterUnit: v as any })}>
                    <SelectTrigger className="w-28 bg-slate-900/50 border-white/[0.08]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="years">Years</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Reference Type */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Reference Type</label>
                <Select value={data.referenceType} onValueChange={(v) => onChange({ referenceType: v as any })}>
                  <SelectTrigger className="bg-slate-900/50 border-white/[0.08]"><SelectValue placeholder="Select reference type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ltd">LTD Contract</SelectItem>
                    <SelectItem value="easy">Easy Reference</SelectItem>
                    <SelectItem value="full">Full Reference</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {data.referenceType === "other" && (
                <div className="space-y-1.5 animate-slide-down">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Explain Reference</label>
                  <Input
                    placeholder="Describe reference requirements"
                    value={data.referenceOtherExplain}
                    onChange={(e) => onChange({ referenceOtherExplain: e.target.value })}
                    className="bg-slate-900/50 border-white/[0.08]"
                  />
                </div>
              )}
            </div>

            {/* Finder Fee + Co-Source */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Finder Fee (£)</label>
                <Input
                  type="number"
                  placeholder="e.g. 2500"
                  value={data.finderFee || ""}
                  onChange={(e) => onChange({ finderFee: parseInt(e.target.value) || 0 })}
                  className="bg-slate-900/50 border-white/[0.08]"
                  min={0}
                />
              </div>
              <div className="flex items-end pb-2.5">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="co-source"
                    checked={data.happyToCoSource}
                    onCheckedChange={(checked: boolean) => onChange({ happyToCoSource: !!checked })}
                  />
                  <label htmlFor="co-source" className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                    Happy to co-source
                  </label>
                </div>
              </div>
            </div>

            {/* Running Costs */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Running Costs (Paid by Deal Buyer Monthly)</label>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Tick the running costs that apply and enter the monthly amount.</p>
              </div>

              <div className="space-y-3 bg-slate-900/20 border border-white/[0.06] rounded-xl p-4">
                {/* Utility */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="runUtility"
                      checked={data.runUtilityTicked}
                      onCheckedChange={(checked: boolean) => onChange({ runUtilityTicked: !!checked })}
                    />
                    <label htmlFor="runUtility" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">Utility</label>
                  </div>
                  {data.runUtilityTicked && (
                    <div className="flex items-center gap-1.5 animate-slide-down">
                      <span className="text-xs text-[var(--text-muted)]">£</span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={data.runUtilityCost || ""}
                        onChange={(e) => onChange({ runUtilityCost: parseInt(e.target.value) || 0 })}
                        className="w-24 text-right bg-slate-900/50 border-white/[0.08] h-8 text-xs font-mono font-bold"
                        min={0}
                      />
                      <span className="text-[10px] text-[var(--text-muted)]">/mo</span>
                    </div>
                  )}
                </div>

                {/* Council Tax */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="runCouncilTax"
                      checked={data.runCouncilTaxTicked}
                      onCheckedChange={(checked: boolean) => onChange({ runCouncilTaxTicked: !!checked })}
                    />
                    <label htmlFor="runCouncilTax" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">Council Tax</label>
                  </div>
                  {data.runCouncilTaxTicked && (
                    <div className="flex items-center gap-1.5 animate-slide-down">
                      <span className="text-xs text-[var(--text-muted)]">£</span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={data.runCouncilTaxCost || ""}
                        onChange={(e) => onChange({ runCouncilTaxCost: parseInt(e.target.value) || 0 })}
                        className="w-24 text-right bg-slate-900/50 border-white/[0.08] h-8 text-xs font-mono font-bold"
                        min={0}
                      />
                      <span className="text-[10px] text-[var(--text-muted)]">/mo</span>
                    </div>
                  )}
                </div>

                {/* Cleaning */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="runCleaning"
                      checked={data.runCleaningTicked}
                      onCheckedChange={(checked: boolean) => onChange({ runCleaningTicked: !!checked })}
                    />
                    <label htmlFor="runCleaning" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">Cleaning</label>
                  </div>
                  {data.runCleaningTicked && (
                    <div className="flex items-center gap-1.5 animate-slide-down">
                      <span className="text-xs text-[var(--text-muted)]">£</span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={data.runCleaningCost || ""}
                        onChange={(e) => onChange({ runCleaningCost: parseInt(e.target.value) || 0 })}
                        className="w-24 text-right bg-slate-900/50 border-white/[0.08] h-8 text-xs font-mono font-bold"
                        min={0}
                      />
                      <span className="text-[10px] text-[var(--text-muted)]">/mo</span>
                    </div>
                  )}
                </div>

                {/* Maintenance */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="runMaintenance"
                      checked={data.runMaintenanceTicked}
                      onCheckedChange={(checked: boolean) => onChange({ runMaintenanceTicked: !!checked })}
                    />
                    <label htmlFor="runMaintenance" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">Maintenance</label>
                  </div>
                  {data.runMaintenanceTicked && (
                    <div className="flex items-center gap-1.5 animate-slide-down">
                      <Input
                        type="number"
                        placeholder="5"
                        value={data.runMaintenancePercent || ""}
                        onChange={(e) => onChange({ runMaintenancePercent: parseInt(e.target.value) || 0 })}
                        className="w-16 text-right bg-slate-900/50 border-white/[0.08] h-8 text-xs font-mono font-bold"
                        min={0}
                      />
                      <span className="text-xs text-[var(--text-muted)]">%</span>
                      <span className="text-xs text-[var(--accent)] font-semibold font-mono pl-2">
                        (£{monthlyMaintenance}/mo)
                      </span>
                    </div>
                  )}
                </div>

                {/* Finder Fee (Amortized) */}
                <div className="flex items-center justify-between gap-4 border-t border-white/[0.04] pt-2">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">Finder Fee (Amortized /12)</span>
                  <span className="text-xs font-mono text-[var(--text-primary)] font-bold">
                    £{Math.round(data.finderFee / 12)}<span className="text-[10px] text-[var(--text-muted)]">/mo</span>
                  </span>
                </div>

                {/* Monthly Rent (Rent to Landlord) */}
                <div className="flex items-center justify-between gap-4 border-t border-white/[0.04] pt-2">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">Monthly Rent</span>
                  <span className="text-xs font-mono text-[var(--text-primary)] font-bold">
                    £{(data.rentToLandlord || 0).toLocaleString()}<span className="text-[10px] text-[var(--text-muted)]">/mo</span>
                  </span>
                </div>

                {/* Others */}
                <div className="flex flex-col gap-2 border-t border-white/[0.04] pt-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="runOther"
                        checked={data.runOtherTicked}
                        onCheckedChange={(checked: boolean) => onChange({ runOtherTicked: !!checked })}
                      />
                      <label htmlFor="runOther" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">Others</label>
                    </div>
                    {data.runOtherTicked && (
                      <div className="flex items-center gap-1.5 animate-slide-down">
                        <span className="text-xs text-[var(--text-muted)]">£</span>
                        <Input
                          type="number"
                          placeholder="0"
                          value={data.runOtherCost || ""}
                          onChange={(e) => onChange({ runOtherCost: parseInt(e.target.value) || 0 })}
                          className="w-24 text-right bg-slate-900/50 border-white/[0.08] h-8 text-xs font-mono font-bold"
                          min={0}
                        />
                        <span className="text-[10px] text-[var(--text-muted)]">/mo</span>
                      </div>
                    )}
                  </div>
                  {data.runOtherTicked && (
                    <Input
                      placeholder="Explain other costs"
                      value={data.runOtherExplain}
                      onChange={(e) => onChange({ runOtherExplain: e.target.value })}
                      className="bg-slate-900/50 border-white/[0.08] text-xs h-8 animate-slide-down"
                    />
                  )}
                </div>
              </div>

              {/* Management Toggle & Fee Input */}
              <div className="space-y-3 border-t border-white/[0.04] pt-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-900/30 border border-white/[0.06] rounded-xl">
                  <span className="text-xs font-bold text-[var(--text-primary)]">Management Available</span>
                  <div className="flex rounded-lg overflow-hidden border border-white/[0.08] p-0.5 bg-slate-950/40 w-32 h-8 items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onChange({ managementAvailable: true })}
                      className={`flex-1 py-1 text-[11px] font-bold transition-all cursor-pointer rounded text-center ${data.managementAvailable === true ? "bg-[var(--secondary-container)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ managementAvailable: false })}
                      className={`flex-1 py-1 text-[11px] font-bold transition-all cursor-pointer rounded text-center ${data.managementAvailable === false ? "bg-[var(--secondary-container)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {data.managementAvailable && (
                  <div className="flex items-center justify-between gap-4 p-3 bg-slate-900/20 border border-white/[0.06] rounded-xl animate-slide-down">
                    <label className="text-xs font-semibold text-[var(--text-primary)]">Management Fee (%)</label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        placeholder="10"
                        value={data.managementFeePercent || ""}
                        onChange={(e) => onChange({ managementFeePercent: parseInt(e.target.value) || 0 })}
                        className="w-16 text-right bg-slate-900/50 border-white/[0.08] h-8 text-xs font-mono font-bold"
                        min={0}
                      />
                      <span className="text-xs text-[var(--text-muted)]">%</span>
                      <span className="text-xs text-[var(--accent)] font-semibold font-mono pl-2">
                        (£{monthlyManagement}/mo)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Sum Box (Split into 2 Parts: Self Managed vs Managed) */}
              <div className="space-y-4 border-t border-white/[0.04] pt-4 animate-fade-in">
                {/* Year One */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                    Total Monthly Running Costs Y1 <span className="text-slate-500 font-semibold">(with Finder Fee)</span>
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Self Managed Part */}
                    <div className="bg-red-950/20 border border-red-500/10 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider block">Self Managed</span>
                        <span className="text-[9px] text-[var(--text-muted)] italic block mt-0.5">Excludes management fee</span>
                      </div>
                      <span className="text-base font-mono tabular-nums text-red-400 font-extrabold mt-2.5 block">
                        £{runningCostSelfManageY1.toLocaleString()}/mo
                      </span>
                    </div>

                    {/* Managed Part */}
                    <div className="bg-red-950/20 border border-red-500/10 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider block">Fully Managed</span>
                        <span className="text-[9px] text-[var(--text-muted)] italic block mt-0.5">
                          Includes {finalManagementPercent}% fee (£{finalManagementFee}/mo)
                        </span>
                      </div>
                      <span className="text-base font-mono tabular-nums text-red-400 font-extrabold mt-2.5 block">
                        £{runningCostManagedY1.toLocaleString()}/mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Year Two */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                    Total Monthly Running Costs Y2+ <span className="text-slate-500 font-semibold">(No Finder Fee)</span>
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Self Managed Part */}
                    <div className="bg-red-950/20 border border-red-500/10 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider block">Self Managed</span>
                        <span className="text-[9px] text-[var(--text-muted)] italic block mt-0.5">Excludes management fee</span>
                      </div>
                      <span className="text-base font-mono tabular-nums text-red-400 font-extrabold mt-2.5 block">
                        £{runningCostSelfManageY2.toLocaleString()}/mo
                      </span>
                    </div>

                    {/* Managed Part */}
                    <div className="bg-red-950/20 border border-red-500/10 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider block">Fully Managed</span>
                        <span className="text-[9px] text-[var(--text-muted)] italic block mt-0.5">
                          Includes {finalManagementPercent}% fee (£{finalManagementFee}/mo)
                        </span>
                      </div>
                      <span className="text-base font-mono tabular-nums text-red-400 font-extrabold mt-2.5 block">
                        £{runningCostManagedY2.toLocaleString()}/mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5 border-t border-white/[0.04] pt-4">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Additional Notes <span className="text-slate-600">(optional override)</span></label>
              <Textarea
                placeholder="Any additional information for potential investors..."
                value={data.additionalNotes}
                onChange={(e) => onChange({ additionalNotes: e.target.value })}
                rows={3}
                className="bg-slate-900/50 border-white/[0.08] text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right Sticky Sidebar: Map & Key Financial Metrics */}
        <div className="space-y-6 lg:sticky lg:top-6">
          {/* Map Card */}
          <div className="bg-slate-950/40 border border-white/[0.06] p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Property Location</span>
              {coordinates ? (
                <span className="text-[10px] text-[var(--accent)] font-semibold flex items-center gap-1">● Active Marker</span>
              ) : (
                <span className="text-[10px] text-[var(--text-faint)] italic">UK Map Default</span>
              )}
            </div>
            <PropVestMap lat={coordinates?.lat || null} lng={coordinates?.lng || null} />
          </div>

          {/* Nearby Busy Places / POIs */}
          {(coordinates || nearbyPOIs.length > 0) && (
            <div className="bg-slate-950/40 border border-white/[0.06] p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider">Top 10 Nearby Places</span>
                {loadingPOIs && (
                  <span className="text-[10px] text-[var(--text-muted)] animate-pulse">Loading...</span>
                )}
              </div>
              
              {!loadingPOIs && nearbyPOIs.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                  {nearbyPOIs.map((poi: any, idx: number) => (
                    <div key={poi.place_id || idx} className="flex justify-between items-center bg-white/[0.02] border border-white/[0.04] p-2 rounded-lg text-xs">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <div className="shrink-0">
                          {getPoiIcon(poi.types)}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="font-semibold text-[var(--text-primary)] truncate">{poi.name}</span>
                          <span className="text-[9px] text-[var(--text-muted)] capitalize truncate">
                            {poi.types?.slice(0,2).join(', ').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[var(--accent)] shrink-0 bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded border border-[var(--accent-border)]">
                        {poi.distanceMiles ? `${poi.distanceMiles.toFixed(1)} mi` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : !loadingPOIs ? (
                <div className="text-xs text-[var(--text-muted)] italic py-2 text-center">
                  No key places found nearby.
                </div>
              ) : null}
            </div>
          )}

          {/* Sticky Financial Summary Card */}
          <div className="bg-slate-950/40 border border-white/[0.06] p-5 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[var(--accent)]" />
              Financial Summary Projections
            </h4>
            
            <div className="space-y-3 text-xs">
              {/* Basic Stats */}
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/[0.04] text-[11px]">
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] uppercase font-semibold">Money Needed In</p>
                  <p className="font-mono text-xs font-bold text-[var(--text-primary)]">£{moneyNeeded.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] uppercase font-semibold">Monthly Gross Profit</p>
                  <p className="font-mono text-xs font-bold text-[var(--accent)]">£{monthlyGrossProfit.toLocaleString()}</p>
                </div>
              </div>

              {/* Year One */}
              <div className="space-y-1.5">
                <p className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/[0.04] w-fit">
                  Year One Potential Profit (with Finder Fee)
                </p>
                <div className="grid grid-cols-2 gap-2.5 pl-0.5">
                  <div className="space-y-0.5">
                    <p className="text-[8px] text-[var(--text-muted)] font-semibold uppercase">Self Manage</p>
                    <p className="font-mono text-xs font-bold text-[var(--accent)]">£{profitY1SelfManage.toLocaleString()}/yr</p>
                    <p className="text-[9px] text-[var(--text-faint)]">ROI: <span className="font-bold text-white">{roiY1SelfManage.toFixed(1)}%</span></p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[8px] text-[var(--text-muted)] font-semibold uppercase">Managed ({data.managementFeePercent}%)</p>
                    <p className="font-mono text-xs font-bold text-[var(--accent)]">£{profitY1Managed.toLocaleString()}/yr</p>
                    <p className="text-[9px] text-[var(--text-faint)]">ROI: <span className="font-bold text-white">{roiY1Managed.toFixed(1)}%</span></p>
                  </div>
                </div>
              </div>

              {/* Year Two */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/[0.04] w-fit">
                  Year Two Potential Profit (No Finder Fee)
                </p>
                <div className="grid grid-cols-2 gap-2.5 pl-0.5">
                  <div className="space-y-0.5">
                    <p className="text-[8px] text-[var(--text-muted)] font-semibold uppercase">Self Manage</p>
                    <p className="font-mono text-xs font-bold text-[var(--accent)]">£{profitY2SelfManage.toLocaleString()}/yr</p>
                    <p className="text-[9px] text-[var(--text-faint)]">ROI: <span className="font-bold text-white">{roiY2SelfManage.toFixed(1)}%</span></p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[8px] text-[var(--text-muted)] font-semibold uppercase">Managed ({data.managementFeePercent}%)</p>
                    <p className="font-mono text-xs font-bold text-[var(--accent)]">£{profitY2Managed.toLocaleString()}/yr</p>
                    <p className="text-[9px] text-[var(--text-faint)]">ROI: <span className="font-bold text-white">{roiY2Managed.toFixed(1)}%</span></p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between py-2 border-t border-white/[0.04] text-[10px] text-[var(--text-muted)]">
                <span>Total Active Rooms</span>
                <span className="font-bold text-white">{data.rooms.length} Rooms</span>
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={onSubmit}
                disabled={submitting}
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold h-10 text-xs"
              >
                {submitting ? "Submitting..." : isAgencyVerified ? "Submit Listing" : "Submit for Review"}
              </Button>
              <Button
                variant="outline"
                onClick={onSaveDraft}
                disabled={submitting}
                className="w-full border-white/[0.08] text-[var(--text-primary)] hover:bg-white/[0.02] h-10 text-xs"
              >
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
