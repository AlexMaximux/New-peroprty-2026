"use client"

import * as React from "react"
import { AlertCircle, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface KYCBannerProps {
  status: "pending" | "approved" | "rejected"
  onUploadClick: () => void
}

export function KYCBanner({ status, onUploadClick }: KYCBannerProps) {
  if (status === "approved") return null
  if (status === "rejected") {
    return (
      <div className="bg-[var(--error-subtle)] border border-[var(--error)]/30 rounded-xl p-4 mb-6 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-[var(--error)] flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-[var(--error)]">KYC Verification Rejected</p>
          <p className="text-sm text-[var(--text-muted)]">Please review the rejection reason and resubmit your documents.</p>
        </div>
        <Button onClick={onUploadClick} variant="outline" className="whitespace-nowrap">
          <Upload className="w-4 h-4 mr-2" />
          Resubmit Documents
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-[var(--warning-subtle)] border border-[var(--warning)]/30 rounded-xl p-4 mb-6 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-[var(--warning)] flex-shrink-0" />
      <div className="flex-1">
        <p className="font-medium text-[var(--warning)]">⏳ KYC Verification Pending</p>
        <p className="text-sm text-[var(--text-muted)]">Upload your documents to get approved and start listing properties.</p>
      </div>
      <Button onClick={onUploadClick} className="whitespace-nowrap">
        <Upload className="w-4 h-4 mr-2" />
        Upload Documents
      </Button>
    </div>
  )
}
