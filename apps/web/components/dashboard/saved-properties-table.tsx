"use client"

import * as React from "react"
import { Eye, Mail, Trash2 } from "lucide-react"
import { formatPrice, formatYield } from "@/lib/data/listings"
import { mockListings } from "@/lib/data/listings"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

const savedProperties = [
  mockListings[0]!,
  mockListings[2]!,
  mockListings[3]!,
  mockListings[4]!,
  mockListings[5]!,
  { ...mockListings[1]!, id: "lst-007", strategy: "HMO" as const, title: "5-Bed HMO", postcode: "M1 2AB", city: "Manchester", askingPricePence: 22000000, marketValuePence: 28000000, grossYield: 12.8, monthlyRentPence: 250000, bmvPercentage: 21.4 },
  { ...mockListings[1]!, id: "lst-008", strategy: "SA" as const, title: "Luxury Studio", postcode: "SW1A 1AA", city: "London", askingPricePence: 55000000, marketValuePence: 62000000, grossYield: 15.2, monthlyRentPence: 750000, bmvPercentage: 11.3 },
  { ...mockListings[1]!, id: "lst-009", strategy: "BTL" as const, title: "2-Bed Flat", postcode: "B1 1AA", city: "Birmingham", askingPricePence: 18000000, marketValuePence: 21000000, grossYield: 6.5, monthlyRentPence: 95000, bmvPercentage: 14.3 },
  { ...mockListings[1]!, id: "lst-010", strategy: "Block" as const, title: "Block of 6", postcode: "LS1 1AA", city: "Leeds", askingPricePence: 45000000, marketValuePence: 52000000, grossYield: 10.8, monthlyRentPence: 450000, bmvPercentage: 13.5 },
  { ...mockListings[1]!, id: "lst-011", strategy: "HMO" as const, title: "6-Bed HMO", postcode: "S1 1AA", city: "Sheffield", askingPricePence: 19500000, marketValuePence: 24000000, grossYield: 13.6, monthlyRentPence: 220000, bmvPercentage: 18.8 },
  { ...mockListings[1]!, id: "lst-012", strategy: "Commercial" as const, title: "Retail Unit", postcode: "M1 1AA", city: "Manchester", askingPricePence: 32000000, marketValuePence: 38000000, grossYield: 9.4, monthlyRentPence: 280000, bmvPercentage: 15.8 },
]

const strategyTabs = ["All", "HMO", "SA", "BTL"]

export function SavedPropertiesTable() {
  const [activeTab, setActiveTab] = React.useState("All")

  const filteredProperties = React.useMemo(() => {
    if (activeTab === "All") return savedProperties
    return savedProperties.filter((p) => p.strategy === activeTab)
  }, [activeTab])

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
      {/* Tabs */}
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent p-0 w-auto gap-1">
            {strategyTabs.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="px-4 py-2 text-sm font-medium data-[state=active]:bg-[var(--accent)] data-[state=active]:text-white">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead className="text-right">Asking Price</TableHead>
              <TableHead className="text-right">BMV %</TableHead>
              <TableHead className="text-right">Gross Yield</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProperties.map((property) => (
              <TableRow key={property.id} className="group">
                <TableCell className="font-medium">
                  <div>
                    <p className="truncate max-w-xs">{property.title}</p>
                    <p className="text-sm text-[var(--text-muted)]">{property.address}, {property.postcode}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="badge badge-emerald text-xs">{property.strategy}</span>
                </TableCell>
                <TableCell className="font-mono tabular-nums text-right">{formatPrice(property.askingPricePence)}</TableCell>
                <TableCell className="font-mono tabular-nums text-right text-amber-400">{property.bmvPercentage.toFixed(1)}%</TableCell>
                <TableCell className="font-mono tabular-nums text-right text-[var(--accent)]">{formatYield(property.grossYield)}</TableCell>
                <TableCell>
                  <span className={`
                    badge text-xs ${
                      property.status === "AVAILABLE"
                        ? "badge-emerald"
                        : property.status === "RESERVED"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "badge-red"
                    }
                  `}>
                    {property.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="View property">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Enquire">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--error)] hover:bg-[var(--error-subtle)]" aria-label="Remove from saved">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
