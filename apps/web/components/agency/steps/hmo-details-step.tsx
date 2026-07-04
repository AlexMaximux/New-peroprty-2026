"use client"

import * as React from "react"
import { Home, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { HmoFormData, Room } from "../wizard-types"

const ROOM_TYPES = [
  "Double En-Suite",
  "Double Shared Bathroom",
  "Single En-Suite",
  "Single Shared Bathroom",
  "Other",
]

interface Props {
  data: HmoFormData
  onChange: (patch: Partial<HmoFormData>) => void
}

export function HmoDetailsStep({ data, onChange }: Props) {
  /* ── helpers ── */
  const toggleStatus = (key: "statusLicensed" | "statusTenanted" | "statusNeedsRefurb") => {
    onChange({ [key]: !data[key] })
  }

  const addRoom = () => {
    const newRoom: Room = { id: `room-${Date.now()}`, type: "Double En-Suite", monthlyRent: 0 }
    onChange({ rooms: [...data.rooms, newRoom] })
  }

  const removeRoom = (id: string) => {
    if (data.rooms.length <= 1) return
    onChange({ rooms: data.rooms.filter((r) => r.id !== id) })
  }

  const updateRoom = (id: string, field: keyof Room, value: string | number) => {
    onChange({ rooms: data.rooms.map((r) => (r.id === id ? { ...r, [field]: value } : r)) })
  }

  /* ── three-way toggle helper ── */
  const ThreeWayToggle = ({
    label,
    value,
    onChangeVal,
    children,
  }: {
    label: string
    value: boolean | null
    onChangeVal: (v: boolean | null) => void
    children?: React.ReactNode
  }) => (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        {[
          { label: "Yes", val: true },
          { label: "No", val: false },
          { label: "Other", val: null },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChangeVal(opt.val)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
              value === opt.val
                ? "bg-[var(--accent)] text-black border-[var(--accent)]"
                : "bg-slate-900/40 text-[var(--text-muted)] border-white/[0.06] hover:bg-white/[0.02]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Home className="w-5 h-5 text-[var(--accent)]" />
          HMO Details
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">Describe the property status, furnishing, and room configuration</p>
      </div>

      {/* ── Status Chips ── */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</label>
        <div className="flex flex-wrap gap-2">
          {([
            { key: "statusLicensed" as const, label: "Licensed" },
            { key: "statusTenanted" as const, label: "Tenanted" },
            { key: "statusNeedsRefurb" as const, label: "Needs Refurb" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleStatus(key)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all cursor-pointer ${
                data[key]
                  ? "bg-[var(--accent)] text-black border-[var(--accent)]"
                  : "bg-slate-900/40 text-[var(--text-muted)] border-white/[0.06] hover:bg-white/[0.02]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Refurb cost (conditional) */}
      {data.statusNeedsRefurb && (
        <div className="grid gap-4 sm:grid-cols-2 pl-4 border-l-2 border-[var(--accent-border)]">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Cost of Refurb (£)</label>
            <Input
              type="number"
              placeholder="e.g. 5000"
              value={data.refurbCost || ""}
              onChange={(e) => onChange({ refurbCost: parseInt(e.target.value) || 0 })}
              className="bg-slate-900/50 border-white/[0.08]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Cost Type</label>
            <div className="flex gap-2">
              {(["Quoted", "Estimated"] as const).map((opt) => {
                const isQ = opt === "Quoted"
                const isActive = isQ ? data.refurbIsQuoted : !data.refurbIsQuoted
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChange({ refurbIsQuoted: isQ })}
                    className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? isQ
                          ? "bg-[var(--accent)] text-black border-[var(--accent)]"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-slate-900/40 text-[var(--text-muted)] border-white/[0.06] hover:bg-white/[0.02]"
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Furnished ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Furnished</label>
          <Select value={data.furnished} onValueChange={(v) => onChange({ furnished: v as any })}>
            <SelectTrigger className="bg-slate-900/50 border-white/[0.08]"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unfurnished">No — Unfurnished</SelectItem>
              <SelectItem value="furnished">Yes — Furnished</SelectItem>
              <SelectItem value="semi">Semi-Furnished</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(data.furnished === "furnished" || data.furnished === "semi") && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Furnish Quality</label>
            <Select value={data.furnishQuality} onValueChange={(v) => onChange({ furnishQuality: v as any })}>
              <SelectTrigger className="bg-slate-900/50 border-white/[0.08]"><SelectValue placeholder="Quality" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Quality</SelectItem>
                <SelectItem value="good">Good Quality</SelectItem>
                <SelectItem value="medium">Medium Quality</SelectItem>
                <SelectItem value="low">Low Quality</SelectItem>
                <SelectItem value="other">Other (explain)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      {data.furnishQuality === "other" && (
        <Input
          placeholder="Describe furnishing quality"
          value={data.furnishOtherExplain}
          onChange={(e) => onChange({ furnishOtherExplain: e.target.value })}
          className="bg-slate-900/50 border-white/[0.08]"
        />
      )}

      {/* ── Living Room / Parking / Garden ── */}
      <div className="grid gap-6 sm:grid-cols-3">
        <ThreeWayToggle
          label="Living Room"
          value={data.hasLivingRoom}
          onChangeVal={(v) => onChange({ hasLivingRoom: v })}
        />

        <ThreeWayToggle
          label="Parking"
          value={data.hasParking}
          onChangeVal={(v) => onChange({ hasParking: v })}
        >
          {data.hasParking === true && (
            <Input
              type="number"
              placeholder="How many spaces?"
              value={data.parkingSpaces || ""}
              onChange={(e) => onChange({ parkingSpaces: parseInt(e.target.value) || 0 })}
              className="bg-slate-900/50 border-white/[0.08] mt-2"
              min={1}
            />
          )}
          {data.hasParking === null && (
            <Input
              placeholder="Explain parking situation"
              value={data.parkingOtherExplain}
              onChange={(e) => onChange({ parkingOtherExplain: e.target.value })}
              className="bg-slate-900/50 border-white/[0.08] mt-2"
            />
          )}
        </ThreeWayToggle>

        <ThreeWayToggle
          label="Garden"
          value={data.hasGarden}
          onChangeVal={(v) => onChange({ hasGarden: v })}
        >
          {data.hasGarden === null && (
            <Input
              placeholder="Explain garden situation"
              value={data.gardenOtherExplain}
              onChange={(e) => onChange({ gardenOtherExplain: e.target.value })}
              className="bg-slate-900/50 border-white/[0.08] mt-2"
            />
          )}
        </ThreeWayToggle>
      </div>

      {/* ── Rooms Table ── */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Rooms Configuration</label>
        <div className="bg-slate-900/30 border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-slate-900/40">
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider w-12">#</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Room Type</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider w-40">Rent £/mo</th>
                  <th className="px-4 py-2.5 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {data.rooms.map((room, i) => (
                  <tr key={room.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <Select value={room.type} onValueChange={(v) => updateRoom(room.id, "type", v)}>
                          <SelectTrigger className="bg-slate-900/50 border-white/[0.08] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROOM_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {room.type === "Other" && (
                          <Input
                            placeholder="Describe"
                            value={room.customType || ""}
                            onChange={(e) => updateRoom(room.id, "customType", e.target.value)}
                            className="bg-slate-900/50 border-white/[0.08] text-xs w-32"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Input
                        type="number"
                        value={room.monthlyRent || ""}
                        onChange={(e) => updateRoom(room.id, "monthlyRent", parseInt(e.target.value) || 0)}
                        className="w-32 text-right font-mono tabular-nums bg-slate-900/50 border-white/[0.08] text-xs ml-auto"
                        placeholder="0"
                        min={0}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeRoom(room.id)}
                        disabled={data.rooms.length <= 1}
                        className="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-white/[0.06]">
            <Button variant="outline" onClick={addRoom} className="w-full justify-center gap-2 text-xs border-white/[0.08] hover:bg-white/[0.02]">
              <Plus className="w-3.5 h-3.5" />
              Add Room
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
