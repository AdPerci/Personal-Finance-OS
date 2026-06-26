export function formatCurrency(
  amount: number,
  currency = "GBP",
  locale = "en-GB"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatChange(amount: number, currency = "GBP"): string {
  const sign = amount > 0 ? "+" : "";
  return `${sign}${formatCurrency(amount, currency)}`;
}
