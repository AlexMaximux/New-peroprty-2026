"use client"

import * as React from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface Agency {
  id: string
  name: string
  contact: string
  registered: string
  idDoc: boolean
  coReg: boolean
  aml: boolean
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
}

interface QueueListing {
  id: string
  title: string
  agency: string
  category: string
  strategy: string
  submitted: string
}

const agencies: Agency[] = [
  { id: "1", name: "Northern Deals Ltd", contact: "john@northern-deals.co.uk", registered: "2024-05-01", idDoc: true, coReg: true, aml: true, status: "APPROVED" },
  { id: "2", name: "PropertySource UK", contact: "info@propsource.io", registered: "2024-04-15", idDoc: true, coReg: true, aml: true, status: "APPROVED" },
  { id: "3", name: "Capital Investments", contact: "admin@capital-inv.co.uk", registered: "2024-06-10", idDoc: false, coReg: false, aml: false, status: "PENDING" },
  { id: "4", name: "Midlands Property", contact: "contact@midlands-prop.com", registered: "2024-05-20", idDoc: true, coReg: true, aml: false, status: "PENDING" },
]

const queueListings: QueueListing[] = [
  { id: "1", title: "4-Bed HMO in Bristol", agency: "Capital Investments", category: "Rent to Rent", strategy: "HMO", submitted: "2024-06-28" },
  { id: "2", title: "Land with Planning", agency: "Midlands Property", category: "Sell Property", strategy: "Land", submitted: "2024-06-27" },
]

function StatusBadge({ status }: { status: Agency["status"] }) {
  return (
    <Badge className={cn(
      "font-medium",
      status === "APPROVED" && "badge-emerald",
      status === "PENDING" && "badge-amber",
      status === "REJECTED" && "badge-red",
      status === "SUSPENDED" && "badge-gray"
    )}>
      {status}
    </Badge>
  )
}

function DocStatus({ uploaded }: { uploaded: boolean }) {
  return (
    <span className={cn("flex items-center gap-1 text-sm", uploaded ? "text-[var(--accent)]" : "text-[var(--error)]")}>
      {uploaded ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {uploaded ? "Uploaded" : "Missing"}
    </span>
  )
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState("agencies")

  const handleAgencyAction = () => {
    // In real app, this would call an API
  }

  const handleListingAction = () => {
    // In real app, this would call an API
  }

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-6">
      <div>
        <h1 className="font-display text-3xl font-normal text-[var(--text-primary)]">Admin Panel</h1>
        <p className="text-[var(--text-muted)] mt-1">Manage agencies and listing approvals</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[var(--bg-card)] p-1 w-full sm:w-auto">
          <TabsTrigger value="agencies" className="data-[state=active]:bg-[var(--accent)] data-[state=active]:text-white">
            Agency Management
          </TabsTrigger>
          <TabsTrigger value="queue" className="data-[state=active]:bg-[var(--accent)] data-[state=active]:text-white">
            Listing Approval Queue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agencies" className="mt-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agency Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>ID Doc</TableHead>
                    <TableHead>Co. Reg</TableHead>
                    <TableHead>AML</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencies.map((agency) => (
                    <TableRow key={agency.id} className="transition-all duration-300">
                      <TableCell className="font-medium">{agency.name}</TableCell>
                      <TableCell className="text-[var(--text-muted)]">{agency.contact}</TableCell>
                      <TableCell>{agency.registered}</TableCell>
                      <TableCell><DocStatus uploaded={agency.idDoc} /></TableCell>
                      <TableCell><DocStatus uploaded={agency.coReg} /></TableCell>
                      <TableCell><DocStatus uploaded={agency.aml} /></TableCell>
                      <TableCell><StatusBadge status={agency.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {agency.status === "PENDING" && (
                            <>
                              <Button size="sm" onClick={handleAgencyAction} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white">
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleAgencyAction} className="text-[var(--error)] border-[var(--error)] hover:bg-[var(--error-subtle)]">
                                Reject
                              </Button>
                            </>
                          )}
                          {agency.status === "APPROVED" && (
                            <Button size="sm" variant="outline" onClick={handleAgencyAction} className="text-[var(--text-muted)] border-[var(--border)]">
                              Suspend
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="mt-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">{listing.title}</TableCell>
                      <TableCell>{listing.agency}</TableCell>
                      <TableCell>{listing.category}</TableCell>
                      <TableCell>
                        <Badge className="badge-emerald">{listing.strategy}</Badge>
                      </TableCell>
                      <TableCell>{listing.submitted}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" onClick={handleListingAction} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleListingAction} className="text-[var(--error)] border-[var(--error)] hover:bg-[var(--error-subtle)]">
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
