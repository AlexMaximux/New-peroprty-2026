'use client';

interface Props {
  onNext: (data: Record<string, unknown>) => void;
  onBack: () => void;
}

export default function AgencyDetailsSection({ onNext, onBack }: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Agency & Network</h2>
      <p className="text-sm text-slate-400">
        Agency details will be auto-populated from your approved agency profile.
      </p>
      <p className="text-sm text-slate-400">
        Additional network settings (co-sourcing, finder fee splits) can be added later from the listing management page.
      </p>
      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} className="btn-secondary">Back</button>
        <button type="button" onClick={() => onNext({})} className="btn-primary">Next</button>
      </div>
    </div>
  );
}
