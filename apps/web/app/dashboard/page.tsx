"use client"

import * as React from "react"
import { Building2, Home, TrendingUp, Tag } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { PortfolioChart } from "@/components/dashboard/portfolio-chart"
import { YieldChart } from "@/components/dashboard/yield-chart"
import { SavedPropertiesTable } from "@/components/dashboard/saved-properties-table"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-normal text-[var(--text-primary)]">Investor Dashboard</h1>
          <p className="text-[var(--text-muted)] mt-1">Track your portfolio performance and saved properties</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-muted)]">Last updated: Today</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Portfolio Value"
          value="£1.47M"
          subtitle="Total invested"
          icon={<Building2 className="w-5 h-5" />}
          trend={{ value: "+12.3%", positive: true }}
        />
        <StatCard
          label="Properties Tracked"
          value="12"
          subtitle="Active listings saved"
          icon={<Home className="w-5 h-5" />}
          trend={{ value: "+3 this month", positive: true }}
        />
        <StatCard
          label="Avg. Gross Yield"
          value="13.2%"
          subtitle="Across portfolio"
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: "+0.8%", positive: true }}
        />
        <StatCard
          label="Avg. BMV Discount"
          value="24.8%"
          subtitle="Below market value"
          icon={<Tag className="w-5 h-5" />}
          trend={{ value: "+2.1%", positive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <PortfolioChart />
        <YieldChart />
      </div>

      {/* Saved Properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-normal text-[var(--text-primary)]">My Saved Properties</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">12 properties</span>
          </div>
        </div>
        <SavedPropertiesTable />
      </div>
    </div>
  )
}
