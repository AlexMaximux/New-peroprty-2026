"use client"

import * as React from "react"
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  Lock, 
  Phone, 
  Globe, 
  Upload, 
  X, 
  Check,
  CheckCircle,
  Loader2
} from "lucide-react"

import { NewListingWizard } from "@/components/agency/new-listing-wizard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import {
  getAgencyProfile,
  getMe,
  getAgencyListings,
  updateAgencyProfile,
  presignAgencyDocument,
  confirmAgencyDocument,
  changePassword,
} from "@/lib/api"


interface ApiDocument {
  id: string
  type: string
  originalName: string
  createdAt: string
}

interface ApiProfile {
  id: string
  userId: string
  companyName: string
  companyNumber: string | null
  address: string
  contactName: string
  phone: string
  website: string | null
  verificationStatus: string
  documents?: ApiDocument[]
}

export default function AgencyPage() {
  const [activeTab, setActiveTab] = React.useState<"listings" | "add-listing" | "kyc" | "settings" | "edit-listing">("listings")
  const [editListingId, setEditListingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      const id = params.get("id")
      if (tab === "edit-listing" && id) {
        setActiveTab("edit-listing" as any)
        setEditListingId(id)
      }
    }
  }, [])

  // Backend Sourced Profile State
  const [profile, setProfile] = React.useState<ApiProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = React.useState(true)
  const [uploadingDocId, setUploadingDocId] = React.useState<string | null>(null)

  // Fetch Agency Listings
  const [listings, setListings] = React.useState<any[]>([])

  const fetchListings = React.useCallback(async () => {
    try {
      const data = await getAgencyListings()
      setListings(data)
    } catch (err) {
      console.error("Error fetching listings:", err)
    }
  }, [])

  // Settings States (Form Values)
  const [displayName, setDisplayName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [whatsapp, setWhatsapp] = React.useState("")
  const [isWhatsappVerified, setIsWhatsappVerified] = React.useState(false)
  const [showOtpModal, setShowOtpModal] = React.useState(false)
  const [otpCode, setOtpCode] = React.useState("")
  const [otpError, setOtpError] = React.useState("")
  const [facebook, setFacebook] = React.useState("")
  const [instagram, setInstagram] = React.useState("")
  const [website, setWebsite] = React.useState("")

  const [savingSettings, setSavingSettings] = React.useState(false)
  const [settingsSuccess, setSettingsSuccess] = React.useState(false)
  const [settingsError, setSettingsError] = React.useState("")

  // Password change states
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [pwdSuccess, setPwdSuccess] = React.useState(false)
  const [pwdError, setPwdError] = React.useState("")



  // File Input Ref for uploads
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [activeUploadType, setActiveUploadType] = React.useState<string | null>(null)

  // Fetch Agency Profile and Documents from Backend
  const fetchProfile = React.useCallback(async () => {
    try {
      const profileData = await getAgencyProfile()
      setProfile(profileData)
      
      // Populate form states
      setWhatsapp(profileData.phone || "")
      setWebsite(profileData.website || "")
      
      // Load local-only states from localStorage
      setDescription(localStorage.getItem(`pv_agency_desc_${profileData.id}`) || "Premier property sourcing agency specializing in high-yield UK residential investments.")
      setFacebook(localStorage.getItem(`pv_agency_fb_${profileData.id}`) || "")
      setInstagram(localStorage.getItem(`pv_agency_ig_${profileData.id}`) || "")
      setIsWhatsappVerified(localStorage.getItem(`pv_agency_wa_verified_${profileData.id}`) === "true")
      
      // Also fetch user details for display name/email
      const userData = await getMe()
      setDisplayName(userData.displayName || "")
      setEmail(userData.email || "")
    } catch (err) {
      console.error("Error fetching agency profile:", err)
    } finally {
      setLoadingProfile(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProfile()
    fetchListings()
  }, [fetchProfile, fetchListings])

  // Trigger file upload
  const triggerUpload = (type: string) => {
    setActiveUploadType(type)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
      fileInputRef.current.click()
    }
  }

  // Handle actual file upload to S3/MinIO & Backend confirmation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeUploadType) return

    setUploadingDocId(activeUploadType)
    try {
      // 1. Request presigned upload URL
      const { uploadUrl, fileKey } = await presignAgencyDocument({
        type: activeUploadType,
        originalName: file.name,
        contentType: file.type,
      })

      // 2. Upload file to S3/MinIO (direct to storage, no auth needed for presigned URL)
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to storage")
      }

      // 3. Confirm upload in backend database
      await confirmAgencyDocument({ fileKey, originalName: file.name, type: activeUploadType })

      // 4. Refresh profile to reflect uploaded document
      await fetchProfile()
    } catch (err) {
      console.error("Upload error:", err)
      alert("Failed to upload document. Please try again.")
    } finally {
      setUploadingDocId(null)
      setActiveUploadType(null)
    }
  }

  // Save Settings to Backend & LocalStorage
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    setSettingsError("")
    setSettingsSuccess(false)

    try {
      if (!profile) return

      // 1. Save profile fields to backend
      await updateAgencyProfile({
        companyName: profile.companyName,
        companyNumber: profile.companyNumber || undefined,
        address: profile.address,
        contactName: profile.contactName,
        phone: whatsapp,
        website: website || undefined,
      })

      // 2. Save local-only fields to localStorage
      localStorage.setItem(`pv_agency_desc_${profile.id}`, description)
      localStorage.setItem(`pv_agency_fb_${profile.id}`, facebook)
      localStorage.setItem(`pv_agency_ig_${profile.id}`, instagram)
      localStorage.setItem(`pv_agency_wa_verified_${profile.id}`, isWhatsappVerified ? "true" : "false")

      setSettingsSuccess(true)
      await fetchProfile()
    } catch (err: any) {
      setSettingsError(err.message || "An error occurred while saving settings.")
    } finally {
      setSavingSettings(false)
    }
  }

  const handleVerifyWhatsapp = () => {
    if (!whatsapp.trim()) return
    setOtpError("")
    setOtpCode("")
    setShowOtpModal(true)
  }

  const handleConfirmOtp = () => {
    if (otpCode === "1234") {
      setIsWhatsappVerified(true)
      setShowOtpModal(false)
      if (profile) {
        localStorage.setItem(`pv_agency_wa_verified_${profile.id}`, "true")
      }
    } else {
      setOtpError("Invalid code. Please enter '1234' to simulate confirmation.")
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdError("")
    setPwdSuccess(false)
    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.")
      return
    }
    if (newPassword.length < 8) {
      setPwdError("Password must be at least 8 characters.")
      return
    }
    if (!currentPassword) {
      setPwdError("Please enter your current password.")
      return
    }

    try {
      await changePassword(currentPassword, newPassword)
      setPwdSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setPwdError(err.message || "Failed to change password. Please try again.")
    }
  }

  // Active Listings data matching the screenshot and dynamic API listings
  const listingsData = [
    ...listings.map((item) => {
      const spec = (item.strategySpecificData || {}) as Record<string, any>
      const rentPence = spec.rentToLandlordPence || item.askingPricePence || 0
      const finderFeePence = spec.finderFeePence || 0
      const roi = item.estimatedRoi !== null && item.estimatedRoi !== undefined ? item.estimatedRoi : 0

      return {
        id: item.id,
        title: item.title || `${item.bedrooms || 0} Bed HMO`,
        location: item.addressLine1 || item.postcode || "Birmingham",
        price: rentPence > 0 ? `£${Math.round(rentPence / 100).toLocaleString()}/mo` : "£0",
        finderFee: finderFeePence > 0 ? `Fee: £${Math.round(finderFeePence / 100).toLocaleString()}` : "",
        bmv: `ROI: ${roi}%`,
        strategy: item.strategy || "HMO",
        rooms: item.bedrooms || (item.hmoRooms ? item.hmoRooms.length : 0),
        status: item.status,
        verified: item.status === "PUBLISHED",
        image: item.media && item.media.length > 0 && item.media[0].url
          ? item.media[0].url
          : "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=120&h=80&fit=crop&q=80"
      }
    }),
    ...(listings.length === 0 ? [
      {
        id: "1",
        title: "7-Bedroom Licensed HMO",
        location: "Sparkhill Road, Birmingham",
        price: "£295k",
        bmv: "-22.4% BMV",
        strategy: "R2R HMO",
        rooms: 7,
        status: "PUBLISHED",
        finderFee: "Fee: £5,000",
        verified: true,
        image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=120&h=80&fit=crop&q=80"
      },
      {
        id: "2",
        title: "Block of 8 Apartments",
        location: "Salford Quays, Manchester",
        price: "£625k",
        bmv: "-17.8% BMV",
        strategy: "Buy-to-Let",
        rooms: 8,
        status: "PUBLISHED",
        finderFee: "Fee: £12,500",
        verified: true,
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=120&h=80&fit=crop&q=80"
      },
      {
        id: "3",
        title: "3-Bed Terrace — Heavy Refurb Opportunity",
        location: "Harehills Lane, Leeds",
        price: "£148k",
        bmv: "-31.2% BMV",
        strategy: "Buy-to-Let",
        rooms: 3,
        status: "PUBLISHED",
        finderFee: "Fee: £3,000",
        verified: true,
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=120&h=80&fit=crop&q=80"
      }
    ] : [])
  ]

  // Get status of specific document type
  const getDocStatus = (type: string): "required" | "uploaded" | "under_review" => {
    if (!profile?.documents) return "required"
    const doc = profile.documents.find(d => d.type === type)
    if (doc) return "uploaded"
    if (uploadingDocId === type) return "under_review"
    return "required"
  }

  const isKycComplete = 
    getDocStatus("GOVERNMENT_ID") === "uploaded" && 
    getDocStatus("COMPANY_REGISTRATION") === "uploaded" && 
    getDocStatus("AML_COMPLIANCE") === "uploaded"

  if (loadingProfile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 px-6 py-6 max-w-6xl mx-auto font-ui">
      {/* Hidden File Input for uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
      />

      {/* Rebranding Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] font-display">
          Agency Portal
        </h1>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">
          Manage listings, track performance, and update agency credentials
        </p>
      </div>

      {/* KYC Warning Banner */}
      {!isKycComplete && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-amber-500/10 p-2 rounded-lg text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">KYC Verification Pending</h3>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Company Registration and AML documents still required. Listings won't go live until verified.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("kyc")}
            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/20 transition-all cursor-pointer whitespace-nowrap align-self-start sm:align-self-auto"
          >
            Upload Docs
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1 */}
        <div className="bg-slate-950/40 border border-white/[0.06] rounded-xl p-5 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-[var(--text-primary)]">7</span>
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">Active Listings</span>
          <span className="text-xs text-[var(--accent)] font-medium mt-1">2 pending</span>
        </div>

        {/* Stat 2 */}
        <div className="bg-slate-950/40 border border-white/[0.06] rounded-xl p-5 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-[var(--text-primary)]">1,284</span>
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">Total Views</span>
          <span className="text-xs text-[var(--accent)] font-medium mt-1">+48 this week</span>
        </div>

        {/* Stat 3 */}
        <div className="bg-slate-950/40 border border-white/[0.06] rounded-xl p-5 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-[var(--text-primary)]">23</span>
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">Enquiries</span>
          <span className="text-xs text-[var(--accent)] font-medium mt-1">5 unread</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-white/[0.06]">
        <nav className="flex gap-6 -mb-px">
          <button
            onClick={() => setActiveTab("listings")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "listings"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            My Listings
          </button>
          <button
            onClick={() => setActiveTab("add-listing")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "add-listing"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Add New Listing
          </button>
          <button
            onClick={() => setActiveTab("kyc")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "kyc"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            KYC Documents
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "settings"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* 1. MY LISTINGS TAB */}
        {activeTab === "listings" && (
          <div className="bg-slate-950/40 border border-white/[0.06] rounded-xl overflow-hidden divide-y divide-white/[0.06]">
            {listingsData.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                <Link href={`/listings/${item.id}`} className="flex items-center gap-4 group cursor-pointer">
                  {/* Property Image */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-14 rounded-lg object-cover border border-white/[0.08] group-hover:scale-[1.02] transition-all"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:underline">{item.title}</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{item.location}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {item.strategy}
                      </span>
                      {item.rooms > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {item.rooms} Rooms
                        </span>
                      )}
                      {item.status && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                          item.status === "PUBLISHED" 
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                            : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                        }`}>
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  {/* Financials */}
                  <div className="text-right">
                    <div className="text-sm font-bold text-[var(--text-primary)]">{item.price}</div>
                    <div className="text-xs text-[var(--accent)] font-semibold mt-0.5">{item.bmv}</div>
                    {item.finderFee && (
                      <div className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">{item.finderFee}</div>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3">
                    {item.verified && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]">
                        <Check className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                    <button 
                      onClick={() => {
                        setEditListingId(item.id)
                        setActiveTab("edit-listing" as any)
                      }}
                      className="px-3 py-1.5 bg-slate-900 border border-white/[0.08] hover:border-[var(--accent-border)] text-[var(--text-primary)] hover:text-[var(--accent)] rounded text-xs font-semibold cursor-pointer transition-all"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. ADD NEW LISTING TAB */}
        {activeTab === "add-listing" && (
          <NewListingWizard
            onSuccess={() => {
              setActiveTab("listings")
              fetchListings()
            }}
          />
        )}

        {/* 5. EDIT LISTING TAB */}
        {activeTab === ("edit-listing" as any) && editListingId && (
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
              <div>
                <button 
                  onClick={() => {
                    setActiveTab("listings")
                    setEditListingId(null)
                  }} 
                  className="text-xs font-semibold text-[var(--text-muted)] hover:text-white mb-1 flex items-center gap-1 cursor-pointer"
                >
                  ← Back to My Listings
                </button>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Edit Listing</h2>
              </div>
            </div>
            <NewListingWizard
              editId={editListingId}
              onSuccess={() => {
                setActiveTab("listings")
                setEditListingId(null)
                fetchListings()
              }}
            />
          </div>
        )}

        {/* 3. KYC DOCUMENTS TAB */}
        {activeTab === "kyc" && (
          <div className="bg-slate-950/40 border border-white/[0.06] rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">KYC Verification Checklist</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Upload all required verification documents. Your listings will go live once all three are approved.
              </p>
            </div>

            <div className="space-y-4">
              {/* Document 1: ID */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/40 border border-white/[0.06] rounded-xl gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Government-Issued Photo ID</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Passport or driving licence — must be in date</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {getDocStatus("GOVERNMENT_ID") === "uploaded" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Uploaded
                    </span>
                  )}
                  {getDocStatus("GOVERNMENT_ID") === "required" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Required
                    </span>
                  )}
                  {getDocStatus("GOVERNMENT_ID") === "under_review" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </span>
                  )}
                  {getDocStatus("GOVERNMENT_ID") === "required" && (
                    <button
                      onClick={() => triggerUpload("GOVERNMENT_ID")}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-lg border border-white/[0.08] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Document
                    </button>
                  )}
                </div>
              </div>

              {/* Document 2: Company Registration */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/40 border border-white/[0.06] rounded-xl gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Company Registration Certificate</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-ui">Companies House certificate or equivalent</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {getDocStatus("COMPANY_REGISTRATION") === "uploaded" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Uploaded
                    </span>
                  )}
                  {getDocStatus("COMPANY_REGISTRATION") === "required" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Required
                    </span>
                  )}
                  {getDocStatus("COMPANY_REGISTRATION") === "under_review" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </span>
                  )}
                  {getDocStatus("COMPANY_REGISTRATION") === "required" && (
                    <button
                      onClick={() => triggerUpload("COMPANY_REGISTRATION")}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-lg border border-white/[0.08] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Document
                    </button>
                  )}
                </div>
              </div>

              {/* Document 3: AML Compliance */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/40 border border-white/[0.06] rounded-xl gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)]">Anti-Money Laundering Compliance</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Proof of AML policy + Suspicious Activity Report procedure</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {getDocStatus("AML_COMPLIANCE") === "uploaded" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Uploaded
                    </span>
                  )}
                  {getDocStatus("AML_COMPLIANCE") === "required" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Required
                    </span>
                  )}
                  {getDocStatus("AML_COMPLIANCE") === "under_review" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading...
                    </span>
                  )}
                  {getDocStatus("AML_COMPLIANCE") === "required" && (
                    <button
                      onClick={() => triggerUpload("AML_COMPLIANCE")}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-lg border border-white/[0.08] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Document
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-white/[0.06]">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Overall Verification Status</span>
              {profile?.verificationStatus === "APPROVED" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approved
                </span>
              ) : profile?.verificationStatus === "REJECTED" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  Pending Approval
                </span>
              )}
            </div>
          </div>
        )}

        {/* 4. SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left 2 Columns: Profiles & Socials */}
            <form onSubmit={handleSaveSettings} className="lg:col-span-2 space-y-6">
              {/* Profile details */}
              <div className="bg-slate-950/40 border border-white/[0.06] p-6 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-white/[0.06] pb-2">
                  Agency Details
                </h3>

                {settingsSuccess && (
                  <div className="p-3 rounded bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[var(--accent)] text-xs font-medium">
                    Settings saved successfully!
                  </div>
                )}

                {settingsError && (
                  <div className="p-3 rounded bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-medium">
                    {settingsError}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Contact Name (Read-Only)</label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 w-4 h-4 text-[var(--text-faint)]" />
                      <Input value={displayName} disabled className="pl-9 bg-slate-900/30 border-white/[0.04] text-sm text-[var(--text-muted)] cursor-not-allowed opacity-70" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Email Address (Read-Only)</label>
                    <div className="relative flex items-center">
                      <Globe className="absolute left-3 w-4 h-4 text-[var(--text-faint)]" />
                      <Input value={email} disabled className="pl-9 bg-slate-900/30 border-white/[0.04] text-sm text-[var(--text-muted)] cursor-not-allowed opacity-70" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Agency Description</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="bg-slate-900/50 border-white/[0.08] text-sm text-[var(--text-primary)]" />
                </div>
              </div>

              {/* Socials & Sourcing */}
              <div className="bg-slate-950/40 border border-white/[0.06] p-6 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-white/[0.06] pb-2">
                  Verifications & Socials
                </h3>

                {/* WhatsApp Phone verification */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">WhatsApp Number</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 flex items-center">
                      <Phone className="absolute left-3 w-4 h-4 text-[var(--text-faint)]" />
                      <Input 
                        value={whatsapp} 
                        onChange={(e) => { setWhatsapp(e.target.value); setIsWhatsappVerified(false); }} 
                        className="pl-9 bg-slate-900/50 border-white/[0.08] text-sm text-[var(--text-primary)]" 
                      />
                    </div>
                    {isWhatsappVerified ? (
                      <span className="h-10 px-4 rounded-[6px] border border-[var(--accent-border)] bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                        <CheckCircle className="w-4 h-4" />
                        Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVerifyWhatsapp}
                        className="h-10 px-4 rounded-[6px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all"
                      >
                        Verify Number
                      </button>
                    )}
                  </div>
                  {!isWhatsappVerified && (
                    <p className="text-[10px] text-amber-400 font-medium font-ui">Verify your number to receive instant investor WhatsApp enquiries.</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Website URL</label>
                    <div className="relative flex items-center">
                      <Globe className="absolute left-3 w-4 h-4 text-[var(--text-faint)]" />
                      <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="pl-9 bg-slate-900/50 border-white/[0.08] text-sm text-[var(--text-primary)]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Facebook Page</label>
                    <div className="relative flex items-center">
                      <svg className="absolute left-3 w-4 h-4 text-[var(--text-faint)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                      <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} className="pl-9 bg-slate-900/50 border-white/[0.08] text-sm text-[var(--text-primary)]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Instagram Profile</label>
                    <div className="relative flex items-center">
                      <svg className="absolute left-3 w-4 h-4 text-[var(--text-faint)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                      <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="pl-9 bg-slate-900/50 border-white/[0.08] text-sm text-[var(--text-primary)]" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={savingSettings} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold">
                    {savingSettings ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Right Column: Change Password */}
            <div className="bg-slate-950/40 border border-white/[0.06] p-6 rounded-xl h-fit">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-white/[0.06] pb-2 mb-4">
                Change Password
              </h3>

              {pwdSuccess && (
                <div className="mb-4 p-2.5 rounded bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[var(--accent)] text-xs font-medium">
                  Password updated successfully!
                </div>
              )}

              {pwdError && (
                <div className="mb-4 p-2.5 rounded bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-medium">
                  {pwdError}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Current Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-[var(--text-faint)]" />
                    <Input 
                      type="password" 
                      required 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      className="pl-9 bg-slate-900/50 border-white/[0.08] text-sm text-[var(--text-primary)]" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">New Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-[var(--text-faint)]" />
                    <Input 
                      type="password" 
                      required 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className="pl-9 bg-slate-900/50 border-white/[0.08] text-sm text-[var(--text-primary)]" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-[var(--text-faint)]" />
                    <Input 
                      type="password" 
                      required 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className="pl-9 bg-slate-900/50 border-white/[0.08] text-sm text-[var(--text-primary)]" 
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-10 mt-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold text-xs uppercase tracking-wider rounded-[6px] transition-all cursor-pointer"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-white/[0.08] rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative animate-scale-in">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center mx-auto">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[var(--text-primary)]">Verify WhatsApp Number</h4>
              <p className="text-xs text-[var(--text-muted)] font-ui">
                We've sent a simulated 4-digit code to <span className="text-[var(--text-primary)] font-semibold">{whatsapp}</span>.
              </p>
            </div>

            {/* OTP Hint */}
            <div className="p-2.5 rounded bg-blue-950/40 border border-blue-500/30 text-blue-200 text-xs text-center font-medium">
              Simulated Code: <span className="font-bold">1234</span>
            </div>

            {otpError && (
              <div className="p-2 rounded bg-red-950/40 border border-red-500/30 text-red-200 text-xs text-center font-medium">
                {otpError}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                maxLength={4}
                placeholder="••••"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full h-12 text-center text-xl font-bold tracking-[0.75em] bg-slate-900/50 border border-white/[0.08] rounded-lg focus:outline-none focus:border-[var(--accent-border)] focus:ring-1 focus:ring-[var(--accent-border)] text-[var(--text-primary)] placeholder-slate-700"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 h-10 bg-slate-900 hover:bg-slate-850 text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider rounded-lg border border-white/[0.08] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOtp}
                  className="flex-1 h-10 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
