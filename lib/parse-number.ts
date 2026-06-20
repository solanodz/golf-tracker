export function normalizeDecimalSeparator(value: string): string {
  return value.trim().replace(",", ".");
}

export function isPartialLocalizedNumber(value: string): boolean {
  return /^-?\d*[.,]?\d*$/.test(value.trim());
}

export function parseLocalizedNumber(value: string): number {
  const normalized = normalizeDecimalSeparator(value);
  if (normalized === "" || normalized === "." || normalized === "-") {
    return Number.NaN;
  }
  return Number(normalized);
}

export function parseLocalizedInteger(value: string): number {
  const parsed = parseLocalizedNumber(value);
  if (Number.isNaN(parsed)) return Number.NaN;
  return Math.trunc(parsed);
}
