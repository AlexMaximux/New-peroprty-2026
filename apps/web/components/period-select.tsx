'use client';

type PeriodSelectProps = {
  value: string;
  unit: 'years' | 'months';
  onValueChange: (value: string) => void;
  onUnitChange: (unit: 'years' | 'months') => void;
};

export function PeriodSelect({ value, unit, onValueChange, onUnitChange }: PeriodSelectProps) {
  return (
    <div className="flex gap-2">
      <input
        type="number"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-20 px-3 py-2 text-sm bg-input-background border border-border rounded-lg outline-none focus:border-primary/60 text-foreground placeholder:text-muted-foreground"
        placeholder="2"
      />
      <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => onUnitChange('years')}
          className={`px-3 py-2 font-medium transition-colors ${
            unit === 'years' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Yrs
        </button>
        <button
          type="button"
          onClick={() => onUnitChange('months')}
          className={`px-3 py-2 font-medium transition-colors border-l border-border ${
            unit === 'months' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Mo
        </button>
      </div>
    </div>
  );
}