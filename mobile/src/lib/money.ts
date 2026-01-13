export function formatMoneyMinor(amountMinor: number, currency: string = 'INR'): string {
  const amountMajor = amountMinor / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amountMajor);
  } catch {
    return `${currency} ${amountMajor.toFixed(2)}`;
  }
}

export function parseAmountToMinor(amount: string): number | null {
  const normalized = amount.trim().replace(/,/g, '');
  if (!normalized) return null;

  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;

  // Convert major currency units to minor (2 decimals).
  const minor = Math.round(n * 100);
  return minor;
}
