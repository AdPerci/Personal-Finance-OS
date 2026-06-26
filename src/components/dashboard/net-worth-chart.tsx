"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { format, parseISO } from "date-fns";

interface NetWorthChartProps {
  data: Array<{ date: string; netWorth: number }>;
  currency?: string;
}

export function NetWorthChart({ data, currency = "GBP" }: NetWorthChartProps) {
  if (data.length < 2) {
    return (
      <Card className="border shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-12 text-center">
            Net worth history will appear after a few days of snapshots.
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "d MMM"),
  }));

  return (
    <Card className="border shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-medium">Net Worth</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="h-64 w-full"
          role="img"
          aria-label={`Net worth chart showing ${data.length} data points`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => formatCurrency(v, currency)}
                width={80}
              />
              <Tooltip
                formatter={(value) => [
                  formatCurrency(Number(value), currency),
                  "Net Worth",
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <table className="sr-only">
          <caption>Net worth history</caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Net Worth</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{formatCurrency(d.netWorth, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
