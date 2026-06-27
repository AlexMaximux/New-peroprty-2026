'use client';

interface Props {
  onNext: (data: any) => void;
  onBack: () => void;
}

export default function BlockPerUnitSection({ onNext, onBack }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Per-Unit Details</h2>
      <p className="text-sm text-slate-400">
        Per-unit details for block properties — coming soon. You can add individual unit specs after creation.
      </p>
      <div className="glass-card p-4">
        <p className="text-xs text-slate-500 italic">
          Per-unit breakdown (individual monthly rents, room types, etc.) will be available in a future update.
          For now, continue to summary.
        </p>
      </div>
      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="button" onClick={() => onNext({ placeholder: true })} className="btn-primary">Next</button>
      </div>
    </div>
  );
}
