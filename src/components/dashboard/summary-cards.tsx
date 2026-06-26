"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatChange, formatCurrency, formatPercent } from "@/lib/format";
import { fadeIn, staggerContainer } from "@/lib/motion";
import type { MonthlyChange } from "@/lib/finance/change";

interface SummaryCardsProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyChange: MonthlyChange;
  currency?: string;
}

export function SummaryCards({
  netWorth,
  totalAssets,
  totalLiabilities,
  monthlyChange,
  currency = "GBP",
}: SummaryCardsProps) {
  const cards = [
    {
      title: "Net Worth",
      value: formatCurrency(netWorth, currency),
      ariaLabel: `Net worth ${formatCurrency(netWorth, currency)}`,
      highlight: true,
    },
    {
      title: "Total Assets",
      value: formatCurrency(totalAssets, currency),
      ariaLabel: `Total assets ${formatCurrency(totalAssets, currency)}`,
    },
    {
      title: "Total Liabilities",
      value: formatCurrency(totalLiabilities, currency),
      ariaLabel: `Total liabilities ${formatCurrency(totalLiabilities, currency)}`,
    },
    {
      title: "Monthly Change",
      value: monthlyChange.hasComparison
        ? formatChange(monthlyChange.amount, currency)
        : "—",
      sub: monthlyChange.hasComparison
        ? formatPercent(monthlyChange.percent)
        : "Not enough history",
      ariaLabel: monthlyChange.hasComparison
        ? `Monthly change ${formatChange(monthlyChange.amount, currency)}, ${formatPercent(monthlyChange.percent)}`
        : "Monthly change not available",
      trend: monthlyChange.hasComparison
        ? monthlyChange.amount > 0
          ? "up"
          : monthlyChange.amount < 0
            ? "down"
            : "flat"
        : undefined,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card) => (
        <motion.div key={card.title} variants={fadeIn}>
          <Card className="border shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-semibold tracking-tight ${card.highlight ? "text-primary" : ""}`}
                aria-label={card.ariaLabel}
              >
                {card.value}
              </p>
              {card.sub && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  {card.trend === "up" && (
                    <TrendingUp className="h-3 w-3 text-emerald-600" aria-hidden />
                  )}
                  {card.trend === "down" && (
                    <TrendingDown className="h-3 w-3 text-destructive" aria-hidden />
                  )}
                  {card.trend === "flat" && (
                    <Minus className="h-3 w-3" aria-hidden />
                  )}
                  {card.sub}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
