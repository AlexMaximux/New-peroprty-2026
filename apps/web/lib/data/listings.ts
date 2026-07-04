/**
 * Mock listing data for the PropVest marketplace
 * All monetary values in pence
 */

export interface Listing {
  id: string
  title: string
  address: string
  postcode: string
  city: string
  region: string
  propertyType: string
  strategy: "HMO" | "SA" | "Block" | "Refurb" | "Commercial" | "Land" | "Portfolio"
  category: "Rent to Rent" | "Lease Option" | "Sell Property" | "Portfolio" | "Commercial" | "Development Opportunity" | "Refurb Opportunity"
  askingPricePence: number
  marketValuePence: number
  grossYield: number
  monthlyRentPence: number
  sourcingFeePence: number
  refurbType?: "Light Refurb" | "Heavy Refurb"
  refurbCostPence?: number
  bmvPercentage: number
  status: "AVAILABLE" | "RESERVED" | "SOLD"
  images: string[] // placeholder gradients
  agency: {
    id: string
    name: string
    verified: boolean
    logo?: string
  }
  bedrooms: number
  bathrooms: number
  description: string
  features: string[]
}

export const mockListings: Listing[] = [
  {
    id: "lst-001",
    title: "Residential Plot",
    address: "Arnold Road",
    postcode: "NG5 6LW",
    city: "Nottingham",
    region: "East Midlands",
    propertyType: "Land",
    strategy: "Land",
    category: "Sell Property",
    askingPricePence: 19500000,
    marketValuePence: 30000000,
    grossYield: 0,
    monthlyRentPence: 0,
    sourcingFeePence: 500000,
    bmvPercentage: 35,
    status: "AVAILABLE",
    images: [
      "linear-gradient(135deg, #1a2a1a 0%, #0f1f0f 100%)",
      "linear-gradient(135deg, #1f2a1a 0%, #0f1f10 100%)",
    ],
    agency: {
      id: "ag-001",
      name: "Northern Deals Ltd",
      verified: true,
    },
    bedrooms: 0,
    bathrooms: 0,
    description: "Prime residential development plot with planning permission for 4 detached homes. Excellent location with strong demand.",
    features: ["Planning Permission Granted", "Utilities Connected", "No Chain"],
  },
  {
    id: "lst-002",
    title: "3-Bed Terrace",
    address: "Harehills Lane",
    postcode: "LS8 4DN",
    city: "Leeds",
    region: "Yorkshire & Humber",
    propertyType: "Terraced",
    strategy: "Refurb",
    category: "Refurb Opportunity",
    askingPricePence: 14800000,
    marketValuePence: 21500000,
    grossYield: 9.1,
    monthlyRentPence: 100000,
    sourcingFeePence: 400000,
    refurbType: "Heavy Refurb",
    refurbCostPence: 4200000,
    bmvPercentage: 31.2,
    status: "AVAILABLE",
    images: [
      "linear-gradient(135deg, #2a1a0f 0%, #1f1008 100%)",
      "linear-gradient(135deg, #2f1f10 0%, #1a0f08 100%)",
    ],
    agency: {
      id: "ag-002",
      name: "PropertySource UK",
      verified: true,
    },
    bedrooms: 3,
    bathrooms: 1,
    description: "Three-bedroom terrace in high-yield Leeds area. Requires full refurbishment but offers excellent returns post-works.",
    features: ["High Rental Demand", "Near Universities", "Good Transport Links"],
  },
  {
    id: "lst-003",
    title: "Former Office Building",
    address: "Sheffield City Centre",
    postcode: "S1 4GF",
    city: "Sheffield",
    region: "Yorkshire & Humber",
    propertyType: "Commercial",
    strategy: "Commercial",
    category: "Commercial",
    askingPricePence: 18500000,
    marketValuePence: 24500000,
    grossYield: 10.2,
    monthlyRentPence: 200000,
    sourcingFeePence: 600000,
    refurbType: "Light Refurb",
    refurbCostPence: 2800000,
    bmvPercentage: 24.5,
    status: "RESERVED",
    images: [
      "linear-gradient(135deg, #0f1a2a 0%, #08101a 100%)",
      "linear-gradient(135deg, #101f2f 0%, #081018 100%)",
    ],
    agency: {
      id: "ag-003",
      name: "Meridian Property Group",
      verified: true,
    },
    bedrooms: 0,
    bathrooms: 3,
    description: "Former office building with change of use potential to residential. Prime city centre location.",
    features: ["Change of Use Potential", "City Centre", "High Footfall"],
  },
  {
    id: "lst-004",
    title: "7-Bed Licensed HMO",
    address: "Sparkhill Road",
    postcode: "B11 3AQ",
    city: "Birmingham",
    region: "West Midlands",
    propertyType: "Terraced",
    strategy: "HMO",
    category: "Rent to Rent",
    askingPricePence: 29500000,
    marketValuePence: 38000000,
    grossYield: 14.2,
    monthlyRentPence: 400000,
    sourcingFeePence: 500000,
    refurbType: "Light Refurb",
    refurbCostPence: 1800000,
    bmvPercentage: 22.4,
    status: "AVAILABLE",
    images: [
      "linear-gradient(135deg, #1a0f2a 0%, #0f081a 100%)",
      "linear-gradient(135deg, #1f102f 0%, #10081f 100%)",
    ],
    agency: {
      id: "ag-002",
      name: "PropertySource UK",
      verified: true,
    },
    bedrooms: 7,
    bathrooms: 4,
    description: "Fully licensed 7-bed HMO with professional tenants in situ. Strong cashflow from day one.",
    features: ["Fully Licensed", "Tenanted", "Professional Management Available"],
  },
  {
    id: "lst-005",
    title: "Block of 8 Apartments",
    address: "Salford Quays",
    postcode: "M50 2HX",
    city: "Manchester",
    region: "North West",
    propertyType: "Block",
    strategy: "Block",
    category: "Sell Property",
    askingPricePence: 62500000,
    marketValuePence: 76000000,
    grossYield: 11.5,
    monthlyRentPence: 600000,
    sourcingFeePence: 1000000,
    refurbType: "Light Refurb",
    refurbCostPence: 3500000,
    bmvPercentage: 17.8,
    status: "AVAILABLE",
    images: [
      "linear-gradient(135deg, #0f2a1a 0%, #081a0f 100%)",
      "linear-gradient(135deg, #102f1a 0%, #081810 100%)",
    ],
    agency: {
      id: "ag-001",
      name: "Northern Deals Ltd",
      verified: true,
    },
    bedrooms: 16,
    bathrooms: 8,
    description: "Rare opportunity to acquire a full block of 8 apartments in Salford Quays. Strong rental demand from MediaCity professionals.",
    features: ["Full Block", "MediaCity Location", "Professional Tenants"],
  },
  {
    id: "lst-006",
    title: "City Centre Studio",
    address: "Shoreditch High Street",
    postcode: "E1 6RF",
    city: "London",
    region: "London",
    propertyType: "Flat",
    strategy: "SA",
    category: "Rent to Rent",
    askingPricePence: 48500000,
    marketValuePence: 55000000,
    grossYield: 16.5,
    monthlyRentPence: 700000,
    sourcingFeePence: 700000,
    refurbType: "Light Refurb",
    refurbCostPence: 1200000,
    bmvPercentage: 11.8,
    status: "AVAILABLE",
    images: [
      "linear-gradient(135deg, #2a1a2a 0%, #1a0f1a 100%)",
      "linear-gradient(135deg, #2f1f2f 0%, #1f101f 100%)",
    ],
    agency: {
      id: "ag-002",
      name: "PropertySource UK",
      verified: true,
    },
    bedrooms: 1,
    bathrooms: 1,
    description: "Modern studio in heart of Shoreditch. Perfect for serviced accommodation with high occupancy rates year-round.",
    features: ["Prime Location", "High SA Demand", "Furnished"],
  },
]

export const strategyColors: Record<string, string> = {
  HMO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  SA: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  Block: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Refurb: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Commercial: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  Land: "bg-green-500/20 text-green-400 border-green-500/30",
  Portfolio: "bg-teal-500/20 text-teal-400 border-teal-500/30",
}

export const formatPrice = (pence: number): string => {
  const pounds = pence / 100
  if (pounds >= 1000000) {
    return `£${(pounds / 1000000).toFixed(1)}M`
  }
  if (pounds >= 1000) {
    return `£${(pounds / 1000).toFixed(0)}k`
  }
  return `£${pounds.toLocaleString()}`
}

export const formatYield = (yieldValue: number): string => {
  return `${yieldValue.toFixed(1)}%`
}

export const formatMonthly = (pence: number): string => {
  const pounds = pence / 100
  if (pounds >= 1000) {
    return `£${(pounds / 1000).toFixed(1)}k`
  }
  return `£${pounds.toLocaleString()}`
}