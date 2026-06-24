/** Merge class names, filtering falsy values */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Format pence to GBP display string, e.g. 150000 → "£1,500" */
export function formatGBP(pence: number | undefined | null): string {
  if (pence === undefined || pence === null) return '—';
  const pounds = pence / 100;
  return `£${pounds.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Format a decimal rate to percentage string, e.g. 0.12 → "12.0%" */
export function formatPercent(rate: number | undefined | null): string {
  if (rate === undefined || rate === null) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}