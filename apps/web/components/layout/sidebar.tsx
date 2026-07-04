"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Building2,
  BarChart2,
  Briefcase,
  Shield,
  MessageSquare,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-provider"

const navItems = [
  { href: "/", label: "Marketplace", icon: Building2 },
  { href: "/dashboard", label: "Investor Dashboard", icon: BarChart2 },
  { href: "/agency", label: "Agency Portal", icon: Briefcase },
  { href: "/admin", label: "Admin Panel", icon: Shield },
  { href: "/messages", label: "Messages", icon: MessageSquare, badge: 2 },
]

export function Sidebar() {
  const { state, openMobile, setOpenMobile, isMobile, toggleSidebar } = useSidebar()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const collapsed = state === "collapsed"

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && openMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpenMobile(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-svh flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border)] transition-all duration-300 ease-in-out lg:relative lg:z-auto",
          collapsed && !isMobile ? "w-20" : "w-64",
          isMobile && !openMobile ? "-translate-x-full" : "translate-x-0"
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center justify-between px-4 border-b border-[var(--border)]",
            collapsed && !isMobile && "justify-center px-0"
          )}
        >
          <Link href="/" className="flex items-center gap-3" aria-label="PropVest Home">
            {/* P lettermark with house/roof */}
            <svg
              className="w-8 h-8 text-[var(--accent)] flex-shrink-0"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="2.5" />
              <path d="M4 10L16 2L28 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="11" y="16" width="10" height="12" rx="1" fill="currentColor" opacity="0.2" />
            </svg>
            {!collapsed && (
              <span className="font-semibold text-[var(--text-primary)] whitespace-nowrap">
                PropVest
              </span>
            )}
          </Link>

          {!collapsed && !isMobile && (
            <span className="text-xs text-[var(--text-faint)] whitespace-nowrap">
              Investment Platform
            </span>
          )}

          {/* Collapse/expand toggle (desktop only) */}
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className={cn(
                "p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-colors",
                collapsed && "rotate-180"
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  "relative overflow-hidden",
                  isActive
                    ? "bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]",
                  collapsed && !isMobile && "justify-center px-0"
                )}
                onClick={() => isMobile && setOpenMobile(false)}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white text-xs font-medium">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && !isMobile && (
                  <span className="sr-only">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section: Theme toggle + User */}
        <div
          className={cn(
            "border-t border-[var(--border)] p-3 space-y-3",
            collapsed && !isMobile && "items-center"
          )}
        >
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              "bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]",
              collapsed && !isMobile ? "justify-center px-0" : "justify-start"
            )}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-[var(--warning)] flex-shrink-0" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" aria-hidden="true" />
            )}
            {!collapsed && (
              <span className="text-[var(--text-primary)]">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>

          {/* User Avatar */}
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-[var(--bg-card)]">
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium text-sm">
                AM
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">Alex Morgan</p>
                <p className="text-xs text-[var(--text-faint)] truncate">Investor</p>
              </div>
            </div>
          )}

          {collapsed && !isMobile && (
            <div className="flex flex-col items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium text-sm">
                AM
              </div>
              <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                <span className="text-[6px] text-[var(--text-faint)]">INV</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile hamburger button (only shown on mobile when sidebar closed) */}
      {isMobile && !openMobile && (
        <button
          onClick={() => setOpenMobile(true)}
          className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] shadow-lg"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
        </button>
      )}

      {/* Mobile close button (inside sidebar when open) */}
      {isMobile && openMobile && (
        <button
          onClick={() => setOpenMobile(false)}
          className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
    </>
  )
}