"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Room {
  id: string
  type: string
  monthlyRent: number
}

const roomTypes = [
  "Double En-Suite",
  "Double Shared Bathroom",
  "Single En-Suite",
  "Single Shared Bathroom",
]

export function RoomsSection({ rooms, onChange }: { rooms: Room[]; onChange: (rooms: Room[]) => void }) {
  const addRoom = () => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      type: "Double En-Suite",
      monthlyRent: 0,
    }
    onChange([...rooms, newRoom])
  }

  const removeRoom = (id: string) => {
    if (rooms.length <= 1) return
    onChange(rooms.filter((r) => r.id !== id))
  }

  const updateRoom = (id: string, field: keyof Room, value: string | number) => {
    onChange(rooms.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const totalIncome = rooms.reduce((sum, r) => sum + r.monthlyRent, 0)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-xl font-normal text-[var(--text-primary)]">Rooms & Potential Income</h3>
        <p className="text-sm text-[var(--text-muted)]">Configure each room type and rent</p>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Room Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider w-48">Monthly Rent £</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room, index) => (
                <tr key={room.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{index + 1}</td>
                  <td className="px-4 py-3">
                    <Select value={room.type} onValueChange={(v) => updateRoom(room.id, "type", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Input
                      type="number"
                      value={room.monthlyRent}
                      onChange={(e) => updateRoom(room.id, "monthlyRent", parseInt(e.target.value) || 0)}
                      className="w-40 text-right font-mono tabular-nums"
                      placeholder="0"
                      min="0"
                      step="50"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRoom(room.id)}
                      disabled={rooms.length <= 1}
                      className="text-[var(--error)] hover:bg-[var(--error-subtle)]"
                      aria-label="Remove room"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[var(--border)]">
          <Button variant="outline" onClick={addRoom} className="w-full justify-center gap-2">
            <Plus className="w-4 h-4" />
            Add Room
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5 border border-[var(--accent-border)] rounded-xl p-6">
        <h4 className="font-medium text-[var(--text-primary)] mb-4">Potential Income Summary</h4>
        <div className="space-y-2 font-mono tabular-nums">
          {rooms.map((room, index) => (
            <div key={room.id} className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">
                Room {index + 1} ({room.type})
              </span>
              <span className="text-[var(--text-primary)]">
                £{room.monthlyRent.toLocaleString()}/mo
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-[var(--accent-border)] flex justify-between text-lg font-bold text-[var(--accent)]">
            <span>Total Gross Monthly Income</span>
            <span>£{totalIncome.toLocaleString()}/mo</span>
          </div>
        </div>
      </div>
    </div>
  )
}
