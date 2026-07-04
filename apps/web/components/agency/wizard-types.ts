// Shared types for the New Listing Wizard

export type StrategyType = "rent2rent" | "leadoption" | "sell"
export type SubtypeType = "hmo" | "sa"
export type SaVariant = "single" | "block"

export type RegionType = "north" | "south" | "central" | "wales" | "scotland"
export type PropertyTypeOption = "terraced" | "flat" | "detached" | "semi" | "other"
export type FurnishedStatus = "unfurnished" | "furnished" | "semi"
export type FurnishQuality = "high" | "good" | "medium" | "low" | "semi" | "other"
export type ReferenceType = "ltd" | "easy" | "full" | "other"

export interface Room {
  id: string
  type: string
  customType?: string
  monthlyRent: number
}

export interface HmoFormData {
  // Step 0: Strategy & subtype
  strategy: StrategyType | null
  subtype: SubtypeType | null
  saVariant: SaVariant | null

  // Title and Subheading
  title: string
  description: string

  // Step 1: Address
  postcode: string
  houseNumber: string
  region: RegionType | ""
  manualAddress: string
  propertyType: PropertyTypeOption | ""
  otherPropertyExplain: string
  mediaFiles: File[]
  existingMedia?: any[]
  latitude?: number | null
  longitude?: number | null

  // Step 2: HMO Details
  statusLicensed: boolean
  licenseStatusReason: "not_needed" | "expired" | "applied_pending" | "other" | ""
  statusTenanted: boolean
  tenancyStatus: "fully_tenanted" | "part_tenanted" | "other" | ""
  tenancyDetails: string
  statusNeedsRefurb: boolean
  refurbCost: number
  refurbIsQuoted: boolean
  furnished: FurnishedStatus | ""
  furnishQuality: FurnishQuality | ""
  furnishOtherExplain: string
  hasLivingRoom: boolean | null
  hasParking: boolean | null
  parkingSpaces: number
  parkingOtherExplain: string
  hasGarden: boolean | null
  gardenOtherExplain: string
  rooms: Room[]
  nearbyPlaces?: any[]

  // Step 3: Rent Terms
  rentToLandlord: number
  deposit: number
  contractLength: number
  contractLengthUnit: "years" | "months"
  reviewAfter: number
  reviewAfterUnit: "years" | "months"
  referenceType: ReferenceType | ""
  referenceOtherExplain: string
  finderFee: number
  happyToCoSource: boolean
  // Running Costs
  runUtilityTicked: boolean
  runUtilityCost: number
  runCouncilTaxTicked: boolean
  runCouncilTaxCost: number
  runCleaningTicked: boolean
  runCleaningCost: number
  runMaintenanceTicked: boolean
  runMaintenancePercent: number
  runOtherTicked: boolean
  runOtherCost: number
  runOtherExplain: string

  // Step 5: Summary extras
  managementAvailable: boolean
  managementFeePercent: number
  additionalNotes: string
}

export const defaultHmoFormData: HmoFormData = {
  strategy: null,
  subtype: null,
  saVariant: null,

  title: "",
  description: "",

  postcode: "",
  houseNumber: "",
  region: "",
  manualAddress: "",
  propertyType: "",
  otherPropertyExplain: "",
  mediaFiles: [],

  statusLicensed: true,
  licenseStatusReason: "",
  statusTenanted: false,
  tenancyStatus: "",
  tenancyDetails: "",
  statusNeedsRefurb: false,
  refurbCost: 0,
  refurbIsQuoted: true,
  furnished: "",
  furnishQuality: "",
  furnishOtherExplain: "",
  hasLivingRoom: null,
  hasParking: null,
  parkingSpaces: 0,
  parkingOtherExplain: "",
  hasGarden: null,
  gardenOtherExplain: "",
  rooms: [
    { id: "1", type: "Double En-Suite", monthlyRent: 0 },
    { id: "2", type: "Double Shared Bathroom", monthlyRent: 0 },
  ],

  rentToLandlord: 0,
  deposit: 0,
  contractLength: 3,
  contractLengthUnit: "years",
  reviewAfter: 1,
  reviewAfterUnit: "years",
  referenceType: "",
  referenceOtherExplain: "",
  finderFee: 0,
  happyToCoSource: false,

  runUtilityTicked: false,
  runUtilityCost: 0,
  runCouncilTaxTicked: false,
  runCouncilTaxCost: 0,
  runCleaningTicked: false,
  runCleaningCost: 0,
  runMaintenanceTicked: true,
  runMaintenancePercent: 5,
  runOtherTicked: false,
  runOtherCost: 0,
  runOtherExplain: "",

  managementAvailable: false,
  managementFeePercent: 10,
  additionalNotes: "",
}
