"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, Phone, Building2, MapPin, Globe, User, Loader2, Eye, EyeOff, ChevronRight, Check, ArrowLeft } from "lucide-react"

type RoleType = "USER" | "AGENCY"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = React.useState<"role" | "form">("role")
  const [role, setRole] = React.useState<RoleType | null>(null)

  // Shared fields
  const [displayName, setDisplayName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [phone, setPhone] = React.useState("")

  // Agency-only fields
  const [companyName, setCompanyName] = React.useState("")
  const [companyNumber, setCompanyNumber] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [website, setWebsite] = React.useState("")

  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const selectRole = (r: RoleType) => {
    setRole(r)
    setError(null)
    setStep("form")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"
      const registerRes = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName, phone: phone || undefined, role }),
      })
      const registerData = await registerRes.json()
      if (!registerRes.ok) throw new Error(registerData.message || "Failed to register")

      if (role === "AGENCY") {
        const profileRes = await fetch(`${API}/agency/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${registerData.accessToken}` },
          body: JSON.stringify({ companyName, companyNumber: companyNumber || undefined, address, contactName: displayName, phone, website: website || undefined }),
        })
        if (!profileRes.ok) {
          const profileData = await profileRes.json()
          throw new Error(profileData.message || "Agency profile failed")
        }
      }

      localStorage.setItem("pv_access_token", registerData.accessToken)
      localStorage.setItem("pv_refresh_token", registerData.refreshToken)
      document.cookie = `pv_access_token=${registerData.accessToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
      router.refresh()
      router.push("/browse")
    } catch (err: any) {
      setError(err.message || "Unexpected error")
    } finally {
      setLoading(false)
    }
  }

  /* ───────────────────── ROLE SELECTION STEP ───────────────────── */
  const roleSelectionContent = (
    <div className="w-full max-w-sm space-y-8">
      {/* Tab switcher */}
      <div className="flex p-1 bg-slate-900/50 rounded-lg border border-white/[0.04]">
        <Link href="/login" className="flex-1 text-center py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer">
          Sign In
        </Link>
        <div className="flex-1 text-center py-2 text-xs font-bold bg-slate-800/80 text-white rounded-md shadow-sm border border-white/[0.04]">
          Create Account
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-serif text-white font-bold tracking-tight">Join PropVault</h2>
        <p className="text-xs text-slate-400 mt-1">Choose how you'd like to use the platform</p>
      </div>

      {/* Investor Card */}
      <button
        type="button"
        onClick={() => selectRole("USER")}
        className="w-full text-left p-5 rounded-xl bg-slate-900/60 border border-white/[0.08] hover:border-[var(--accent)]/50 hover:bg-slate-800/60 transition-all group cursor-pointer"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold text-white">Investor</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full border border-[var(--accent)]/20">Free</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[var(--accent)] transition-colors" />
        </div>
        <p className="text-[11px] text-slate-400 mb-3">I want to find &amp; buy deals</p>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Browse exclusive BMV properties, track ROI, and build your investment portfolio with direct access to verified sourcers.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {["Free to join", "8,000+ live deals", "ROI & yield tools", "Direct messaging"].map((f) => (
            <div key={f} className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0" />
              <span className="text-[10px] text-slate-400">{f}</span>
            </div>
          ))}
        </div>
      </button>

      {/* Agency Card */}
      <button
        type="button"
        onClick={() => selectRole("AGENCY")}
        className="w-full text-left p-5 rounded-xl bg-slate-900/60 border border-white/[0.08] hover:border-[#5b8cff]/50 hover:bg-slate-800/60 transition-all group cursor-pointer"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold text-white">Agency / Sourcer</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#5b8cff] bg-[#5b8cff]/10 px-2 py-0.5 rounded-full border border-[#5b8cff]/20">Pro</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#5b8cff] transition-colors" />
        </div>
        <p className="text-[11px] text-slate-400 mb-3">I want to list deals &amp; earn fees</p>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          List exclusive properties, set sourcing fees, manage leads, and connect with thousands of active investors.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {["KYC required", "Unlimited listings", "Lead dashboard", "Analytics"].map((f) => (
            <div key={f} className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-[#5b8cff] flex-shrink-0" />
              <span className="text-[10px] text-slate-400">{f}</span>
            </div>
          ))}
        </div>
      </button>

      <div className="text-center text-xs font-semibold text-slate-400">
        Already registered? <Link href="/login" className="text-[#5b8cff] hover:text-[#7ba1ff] hover:underline font-bold">Sign in</Link>
      </div>
    </div>
  )

  /* ───────────────────── REGISTRATION FORM STEP ───────────────────── */
  const formContent = (
    <div className="w-full max-w-sm space-y-6">
      {/* Back button */}
      <button type="button" onClick={() => { setStep("role"); setError(null) }} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors group cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to role selection
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <h2 className="text-2xl font-serif text-white font-bold tracking-tight">
            {role === "USER" ? "Create Investor Account" : "Create Agency Account"}
          </h2>
        </div>
        <p className="text-xs text-slate-400">Fill in your details to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-medium">{error}</div>
        )}

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {role === "USER" ? "Full Name" : "Contact Name"}
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" required placeholder="Alex Morgan" value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-slate-900/60 border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-[#5b8cff] focus:ring-1 focus:ring-[#5b8cff] transition-all" />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-slate-900/60 border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-[#5b8cff] focus:ring-1 focus:ring-[#5b8cff] transition-all" />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type={showPassword ? "text" : "password"} required placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full h-11 pl-11 pr-11 bg-slate-900/60 border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-[#5b8cff] focus:ring-1 focus:ring-[#5b8cff] transition-all" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone {role === "USER" && <span className="text-slate-600">(optional)</span>}</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="tel" required={role === "AGENCY"} placeholder="+44 7700 900077" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-slate-900/60 border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-[#5b8cff] focus:ring-1 focus:ring-[#5b8cff] transition-all" />
          </div>
        </div>

        {/* Agency-only fields */}
        {role === "AGENCY" && (
          <div className="space-y-4 border-t border-white/[0.06] pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" required placeholder="Agency Ltd" value={companyName} onChange={e => setCompanyName(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-slate-900/60 border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-[#5b8cff] focus:ring-1 focus:ring-[#5b8cff] transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Number <span className="text-slate-600">(optional)</span></label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="12345678" value={companyNumber} onChange={e => setCompanyNumber(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-slate-900/60 border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-[#5b8cff] focus:ring-1 focus:ring-[#5b8cff] transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" required placeholder="123 High Street, London" value={address} onChange={e => setAddress(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-slate-900/60 border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-[#5b8cff] focus:ring-1 focus:ring-[#5b8cff] transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website <span className="text-slate-600">(optional)</span></label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="url" placeholder="https://agency.com" value={website} onChange={e => setWebsite(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-slate-900/60 border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-[#5b8cff] focus:ring-1 focus:ring-[#5b8cff] transition-all" />
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full h-11 bg-[#5b8cff] hover:bg-[#4b7cee] text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(91,140,255,0.39)]">
          {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Creating account...</>) : "Create Account"}
        </button>
      </form>

      <div className="text-center text-xs font-semibold text-slate-400">
        Already registered? <Link href="/login" className="text-[#5b8cff] hover:text-[#7ba1ff] hover:underline font-bold">Sign in</Link>
      </div>
    </div>
  )

  /* ───────────────────── PAGE LAYOUT ───────────────────── */
  return (
    <div className="min-h-screen flex flex-col md:flex-row font-ui bg-[#0A1128]">
      {/* LEFT: Branding */}
      <div className="hidden md:flex flex-col justify-between w-1/2 relative overflow-hidden bg-slate-900 border-r border-white/[0.04]">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')" }} />
        <div className="absolute inset-0 z-10 bg-slate-950/60 bg-gradient-to-t from-slate-950/95 via-slate-950/40" />

        <div className="relative z-20 p-12 lg:p-16 flex flex-col justify-between h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-black flex items-center justify-center font-bold">P</div>
            <span className="text-xl font-bold text-white tracking-tight">PropVault</span>
          </div>

          {/* Copy */}
          <div className="space-y-8 mt-auto mb-12">
            <div className="space-y-4">
              <p className="text-[var(--accent)] text-[10px] font-bold uppercase tracking-[0.2em]">The UK's #1 Investment Property Platform</p>
              <h1 className="text-4xl xl:text-5xl font-serif text-white leading-tight font-semibold">Where Smart Investors<br />Find BMV Deals.</h1>
              <p className="text-slate-300 text-sm max-w-[420px] leading-relaxed">Access exclusive below-market-value properties, track ROI in real time, and connect directly with verified sourcers — all in one institutional-grade platform.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6">
              <div>
                <div className="text-[var(--accent)] text-2xl font-bold">6,400+</div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Exclusive Deals</div>
              </div>
              <div>
                <div className="text-[var(--accent)] text-2xl font-bold">£2.1B</div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Processed</div>
              </div>
              <div>
                <div className="text-[var(--accent)] text-2xl font-bold">1,200+</div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Verified Agencies</div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {["BMV Properties", "Verified Sourcers", "Live ROI Calculator", "Direct Messaging", "Portfolio Tracker"].map((badge) => (
                <span key={badge} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300 flex items-center gap-1.5 backdrop-blur-md">
                  <svg className="w-3 h-3 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-300 italic leading-relaxed">"PropVault completely transformed how I source deals. Found my best HMO — 22% BMV with 14.2% gross yield — in my very first week on the platform."</p>
            <div className="flex items-center gap-3">
              <img src="https://i.pravatar.cc/100?img=11" alt="Marcus Webb" className="w-8 h-8 rounded-full border border-white/20" />
              <div>
                <div className="text-xs font-bold text-white">Marcus Webb</div>
                <div className="text-[10px] text-slate-400">Property Investor · Birmingham</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative overflow-y-auto">
        <button className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-slate-800/80 border border-white/10 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors">?</button>
        {step === "role" ? roleSelectionContent : formContent}
      </div>
    </div>
  )
}
