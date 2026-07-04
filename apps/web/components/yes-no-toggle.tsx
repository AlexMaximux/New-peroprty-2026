'use client';

type YesNoToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function YesNoToggle({ value, onChange }: YesNoToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs shrink-0">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-3.5 py-1.5 font-medium transition-colors ${
          value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-3.5 py-1.5 font-medium transition-colors border-l border-border ${
          !value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        No
      </button>
    </div>
  );
}