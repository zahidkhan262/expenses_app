"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryMeta } from "@/utils/categories";
import { formatInr } from "@/utils/currency";

type ChartTooltipPayload = {
  name?: string;
  value?: number | string;
};

function MoneyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const first = payload[0];
  const value = typeof first?.value === "number" ? first.value : Number(first?.value ?? 0);
  return (
    <div className="rounded-[var(--radius)] border border-border bg-popover px-3 py-2 text-xs shadow-sm">
      <div className="font-medium">{first?.name ?? "-"}</div>
      <div className="text-muted-foreground">{formatInr(value)}</div>
    </div>
  );
}

export function CategoryPieCard({ data }: { data: { name: string; value: number }[] }) {
  const colors = React.useMemo(
    () =>
      data.map((d) => {
        const meta = getCategoryMeta(d.name);
        // Tailwind class -> simple fallback palette
        return meta.key === "Medical"
          ? "#fb7185"
          : meta.key === "Bills"
            ? "#34d399"
            : meta.key === "Shopping"
              ? "#e879f9"
              : meta.key === "Transport"
                ? "#38bdf8"
                : "#60a5fa";
      }),
    [data],
  );

  return (
    <Card className="min-w-0 border-sky-200/70 bg-gradient-to-br from-sky-50 via-background to-blue-50/60 dark:border-border dark:from-background dark:to-background">
      <CardHeader className="p-4 sm:p-5">
        <CardTitle>Category distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-64 p-4 pt-0 sm:p-5 sm:pt-0">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
          <div className="flex h-full flex-col gap-3">
            <div className="h-[11.5rem] sm:h-[12.5rem]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<MoneyTooltip />} />
                  <Pie data={data} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="70%" paddingAngle={3}>
                    {data.map((_, idx) => (
                      <Cell key={idx} fill={colors[idx]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="-mx-1 overflow-x-auto px-1">
              <div className="flex min-w-max gap-2">
              {data.slice(0, 6).map((item, idx) => (
                <div
                  key={item.name}
                  className="max-w-36 rounded-lg border border-border/70 bg-background/70 px-2.5 py-2"
                >
                  <div className="flex items-center gap-2 text-xs font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[idx] }} />
                      <span className="truncate">{item.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{formatInr(item.value)}</div>
                </div>
              ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WeeklyBarCard({ data }: { data: { day: string; amount: number }[] }) {
  return (
    <Card className="min-w-0 border-violet-200/70 bg-gradient-to-br from-violet-50 via-background to-indigo-50/60 dark:border-border dark:from-background dark:to-background">
      <CardHeader className="p-4 sm:p-5">
        <CardTitle>Weekly spending</CardTitle>
      </CardHeader>
      <CardContent className="h-64 p-2 pt-0 sm:p-5 sm:pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <Tooltip content={<MoneyTooltip />} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={32} tick={{ fontSize: 12 }} />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function MonthlyTrendCard({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <Card className="min-w-0 border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-background to-teal-50/60 dark:border-border dark:from-background dark:to-background">
      <CardHeader className="p-4 sm:p-5">
        <CardTitle>Monthly trend</CardTitle>
      </CardHeader>
      <CardContent className="h-64 p-2 pt-0 sm:p-5 sm:pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 4" />
            <Tooltip content={<MoneyTooltip />} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={32} tick={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
