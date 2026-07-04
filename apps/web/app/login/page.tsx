"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Invalid email or password")
      }

      // 1. Save tokens to localStorage
      localStorage.setItem("pv_access_token", data.accessToken)
      localStorage.setItem("pv_refresh_token", data.refreshToken)

      // 2. Set cookie so Middleware and SSR can read it
      document.cookie = `pv_access_token=${data.accessToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`

      // 3. Refresh and redirect
      router.refresh()
      router.push("/browse")
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-ui bg-[#0A1128]">
      
      {/* LEFT SIDE: Branding & Background */}
      <div className="hidden md:flex flex-col justify-between w-1/2 relative overflow-hidden bg-slate-900 border-r border-white/[0.04]">
        {/* Background Image (House and keys) */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-80" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')" }} 
        />
        {/* Dark overlay gradients for text readability */}
        <div className="absolute inset-0 z-10 bg-slate-950/60 bg-gradient-to-t from-slate-950/95 via-slate-950/40" />

        <div className="relative z-20 p-12 lg:p-16 flex flex-col justify-between h-full">
          {/* Top section: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-black flex items-center justify-center font-bold">
              P
            </div>
            <span className="text-xl font-bold text-white tracking-tight">PropVault</span>
          </div>

          {/* Middle section: Copy & Stats */}
          <div className="space-y-8 mt-auto mb-12">
            <div className="space-y-4">
              <p className="text-[var(--accent)] text-[10px] font-bold uppercase tracking-[0.2em]">
                The UK's #1 Investment Property Platform
              </p>
              <h1 className="text-4xl xl:text-5xl font-serif text-white leading-tight font-semibold">
                Where Smart Investors<br />Find BMV Deals.
              </h1>
              <p className="text-slate-300 text-sm max-w-[420px] leading-relaxed">
                Access exclusive below-market-value properties, track ROI in real time, and connect directly with verified sourcers — all in one institutional-grade platform.
              </p>
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

          {/* Bottom: Testimonial */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "PropVault completely transformed how I source deals. Found my best HMO — 22% BMV with 14.2% gross yield — in my very first week on the platform."
            </p>
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

      {/* RIGHT SIDE: Auth Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
        {/* Help button */}
        <button className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-slate-800/80 border border-white/10 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors">
          ?
        </button>

        <div className="w-full max-w-sm space-y-8">
          
          {/* Tabs (Sign In / Create Account) */}
          <div className="flex p-1 bg-slate-900/50 rounded-lg border border-white/[0.04]">
            <div className="flex-1 text-center py-2 text-xs font-bold bg-slate-800/80 text-white rounded-md shadow-sm border border-white/[0.04]">
              Sign In
            </div>
            <Link href="/register" className="flex-1 text-center py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer">
              Create Account
            </Link>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-3xl font-serif text-white font-bold tracking-tight">Welcome back</h2>
            <p className="text-xs text-slate-400 mt-1">Sign in to your PropVault account to continue</p>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="flex items-center justify-center gap-2 h-10 rounded-lg bg-slate-900/80 border border-white/[0.08] text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button type="button" className="flex items-center justify-center gap-2 h-10 rounded-lg bg-slate-900/80 border border-white/[0.08] text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors">
              <svg className="w-4 h-4 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/[0.08]"></div>
            <span className="flex-shrink-0 mx-4 text-[10px] text-slate-500 font-semibold tracking-wide">or continue with email</span>
            <div className="flex-grow border-t border-white/[0.08]"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-medium">
                {error}
              </div>
            )}
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-slate-900/60 border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-[#5b8cff] focus:ring-1 focus:ring-[#5b8cff] transition-all"
                />
              </div>
            </div>
            
            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-11 pr-11 bg-slate-900/60 border border-white/[0.08] rounded-lg text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-[#5b8cff] focus:ring-1 focus:ring-[#5b8cff] transition-all"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-3.5 h-3.5 border border-white/[0.12] rounded-[3px] bg-slate-900/80 group-hover:border-[#5b8cff] transition-colors">
                  <input type="checkbox" className="opacity-0 absolute w-full h-full cursor-pointer" />
                </div>
                <span className="text-[11px] font-semibold text-slate-300">Remember me</span>
              </label>
              <a href="#" className="text-[11px] font-bold text-[#5b8cff] hover:text-[#7ba1ff] hover:underline transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#5b8cff] hover:bg-[#4b7cee] text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(91,140,255,0.39)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In to PropVault"
              )}
            </button>
          </form>
          
          <div className="text-center text-xs font-semibold text-slate-400">
            Don't have an account? <Link href="/register" className="text-[#5b8cff] hover:text-[#7ba1ff] hover:underline font-bold">Create one free</Link>
          </div>

        </div>
      </div>
      
    </div>
  )
}
