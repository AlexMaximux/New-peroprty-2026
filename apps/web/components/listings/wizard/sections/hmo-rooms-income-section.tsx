'use client';

import { formatGBP } from '@/lib/utils';
import { calcHmoGrossMonthlyIncome } from '@propvest/shared';

interface Room {
  name: string;
  roomType: string;
  monthlyRentPence: number;
}

interface Props {
  rooms: Room[];
  initialData: { rooms: Room[] } | null;
  onNext: (data: Record<string, unknown>) => void;
  onBack: () => void;
}

export default function HmoRoomsIncomeSection({ rooms, initialData, onNext, onBack }: Props) {
  if (!rooms || rooms.length === 0) {
    return (
      <div className="space-y-5">
        <h2 className="text-xl font-semibold">Room Rents</h2>
        <div className="glass-card p-6 text-center">
          <p className="text-slate-400 text-sm">No rooms defined yet. Go back and add rooms in <strong>HMO Details</strong>.</p>
        </div>
        <div className="flex justify-between pt-4 border-t border-deep-600">
          <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        </div>
      </div>
    );
  }

  const grossPence = calcHmoGrossMonthlyIncome(rooms);
  const existingRents = initialData?.rooms ?? [];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Potential Income — Room Rents</h2>
      <p className="text-sm text-slate-400">Review and confirm monthly rents for each room.</p>

      <div className="space-y-3">
        {rooms.map((room: Room, idx: number) => {
          const existing = existingRents.find((r: Room) => r.name === room.name);
          const rentPence = existing?.monthlyRentPence ?? room.monthlyRentPence;
          return (
            <div key={idx} className="glass-card p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{room.name}</p>
                <p className="text-xs text-slate-400">{room.roomType.replace(/_/g, ' ')}</p>
              </div>
              <p className="text-lg font-semibold gradient-text">{formatGBP(rentPence)}</p>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-300">Gross Monthly Income</span>
          <span className="text-xl font-bold gradient-text">{formatGBP(grossPence)}</span>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="button" onClick={() => onNext(initialData ?? { rooms })} className="btn-primary">Next</button>
      </div>
    </div>
  );
}
