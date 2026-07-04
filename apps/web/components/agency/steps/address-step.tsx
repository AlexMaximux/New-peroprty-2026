"use client"

import * as React from "react"
import { MapPin, Camera, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { HmoFormData } from "../wizard-types"

interface Props {
  data: HmoFormData
  onChange: (patch: Partial<HmoFormData>) => void
}

export function AddressStep({ data, onChange }: Props) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleMediaAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length) {
      onChange({ mediaFiles: [...data.mediaFiles, ...files] })
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeMedia = (index: number) => {
    onChange({ mediaFiles: data.mediaFiles.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[var(--accent)]" />
          Address &amp; Property
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">Enter the property address and type</p>
      </div>

      {/* Postcode + House Number */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Postcode</label>
          <div className="relative">
            <Input
              placeholder="e.g. SW1A 1AA"
              value={data.postcode}
              onChange={(e) => onChange({ postcode: e.target.value })}
              className="pr-24 bg-slate-900/50 border-white/[0.08]"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--accent-subtle)] text-[var(--accent)] text-[9px] px-2 py-0.5 font-bold rounded border border-[var(--accent-border)]">Maps API</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">House Number</label>
          <Input
            placeholder="e.g. 42"
            value={data.houseNumber}
            onChange={(e) => onChange({ houseNumber: e.target.value })}
            className="bg-slate-900/50 border-white/[0.08]"
          />
        </div>
      </div>

      {/* Region */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Region</label>
        <Select value={data.region} onValueChange={(v) => onChange({ region: v as any })}>
          <SelectTrigger className="bg-slate-900/50 border-white/[0.08]"><SelectValue placeholder="Select region" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="north">North</SelectItem>
            <SelectItem value="south">South</SelectItem>
            <SelectItem value="central">Central</SelectItem>
            <SelectItem value="wales">Wales</SelectItem>
            <SelectItem value="scotland">Scotland</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Manual Address */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Manual Address <span className="text-slate-600">(optional override)</span></label>
        <Textarea
          placeholder="Full address if different from postcode lookup"
          value={data.manualAddress}
          onChange={(e) => onChange({ manualAddress: e.target.value })}
          rows={2}
          className="bg-slate-900/50 border-white/[0.08]"
        />
      </div>

      {/* Property Type */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Property Type</label>
          <Select value={data.propertyType} onValueChange={(v) => onChange({ propertyType: v as any })}>
            <SelectTrigger className="bg-slate-900/50 border-white/[0.08]"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="terraced">Terraced</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
              <SelectItem value="detached">Detached</SelectItem>
              <SelectItem value="semi">Semi-Detached</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {data.propertyType === "other" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Explain property type</label>
            <Input
              placeholder="Describe the property type"
              value={data.otherPropertyExplain}
              onChange={(e) => onChange({ otherPropertyExplain: e.target.value })}
              className="bg-slate-900/50 border-white/[0.08]"
            />
          </div>
        )}
      </div>

      {/* Pictures & Video */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Pictures &amp; Video</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/[0.08] hover:border-[var(--accent-border)] rounded-xl p-8 text-center cursor-pointer transition-colors group"
        >
          <Camera className="w-8 h-8 text-[var(--text-faint)] mx-auto mb-2 group-hover:text-[var(--accent)] transition-colors" />
          <p className="text-xs text-[var(--text-muted)]">Click to upload photos or videos</p>
          <p className="text-[10px] text-[var(--text-faint)] mt-1">JPG, PNG, MP4 — max 20MB each</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaAdd} />

        {data.mediaFiles.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {data.mediaFiles.map((file, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-900/50 border border-white/[0.06]">
                {file.type.startsWith("image/") ? (
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--text-muted)]">Video</div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeMedia(i) }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
