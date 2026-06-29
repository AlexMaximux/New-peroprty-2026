'use client';

interface Props {
  blockUnitMix: { totalUnits: number; unitsOneBed: number; unitsTwoBed: number; unitsThreeBed: number; unitsOther: number; unitsOtherDesc?: string } | null;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function BlockSummarySection({ blockUnitMix, onConfirm, onBack, isSubmitting }: Props) {
  const totalUnits = blockUnitMix?.totalUnits ?? 0;
  const unitDesc = [
    blockUnitMix?.unitsOneBed ? `${blockUnitMix.unitsOneBed}x 1-bed` : '',
    blockUnitMix?.unitsTwoBed ? `${blockUnitMix.unitsTwoBed}x 2-bed` : '',
    blockUnitMix?.unitsThreeBed ? `${blockUnitMix.unitsThreeBed}x 3-bed` : '',
    blockUnitMix?.unitsOther ? `${blockUnitMix.unitsOther}x ${blockUnitMix.unitsOtherDesc || 'other'}` : '',
  ].filter(Boolean).join(', ');

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">Block Summary</h2>

      <div className="glass-card p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Summary</p>
        <div className="text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Total Units</span><span>{totalUnits}</span></div>
          {unitDesc && <div className="flex justify-between mt-1"><span className="text-slate-400">Unit Mix</span><span>{unitDesc}</span></div>}
        </div>
      </div>

      <p className="text-xs text-slate-500 italic">
        Full financial breakdown for block properties coming soon. Review and publish to save now.
      </p>

      <div className="flex justify-between pt-4 border-t border-deep-600">
        <button type="button" onClick={onBack} disabled={isSubmitting} className="btn-secondary disabled:opacity-30">Back</button>
        <button type="button" onClick={onConfirm} disabled={isSubmitting}
          className="btn-primary disabled:opacity-50">
          {isSubmitting ? 'Publishing...' : 'Publish Listing'}
        </button>
      </div>
    </div>
  );
}
