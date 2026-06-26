import type { AccountCategory } from "@/types/taxonomy";

export const CHART_CSS_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

const CATEGORY_CHART_MAP: Record<AccountCategory, string> = {
  trading212: "var(--chart-1)",
  pensions: "var(--chart-2)",
  cash: "var(--chart-3)",
  property: "var(--chart-4)",
  other: "var(--chart-5)",
};

export function getCategoryChartColor(category: AccountCategory): string {
  return CATEGORY_CHART_MAP[category] ?? "var(--chart-5)";
}

export function getChartColorByIndex(index: number): string {
  return CHART_CSS_VARS[index % CHART_CSS_VARS.length];
}
