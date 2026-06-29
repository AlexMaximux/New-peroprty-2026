/**
 * Format pence as GBP currency.
 * @param pence - Amount in pence (integer)
 * @param short - Use abbreviated format (e.g. "£2.45k" instead of "£245,000")
 * @param showZero - Show "£0" for zero values instead of empty string
 */
export function formatGBP(pence: number, short: boolean = false, showZero: boolean = true): string {
  if (pence === null || pence === undefined) {
    return showZero ? '£0' : '';
  }

  const pounds = pence / 100;

  if (short) {
    if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(2)}M`;
    if (pounds >= 1_000) return `£${(pounds / 1_000).toFixed(0)}k`;
    return `£${pounds.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
  }

  return `£${pounds.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
}

/**
 * Format a number as a percentage.
 * @param value - The decimal value (e.g. 0.142 for 14.2%)
 */
export function formatPercent(value: number): string {
  if (value === null || value === undefined) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format BMV discount as "£X (Y%)" string.
 */
export function formatBmvDiscount(marketValuePence: number, askingPricePence: number): string {
  const savingPence = marketValuePence - askingPricePence;
  const percent = marketValuePence > 0 ? (savingPence / marketValuePence) * 100 : 0;
  return `${formatGBP(savingPence)} (${percent.toFixed(1)}%)`;
}