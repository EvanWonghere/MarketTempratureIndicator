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
import type { ValuationHistoryPoint } from "@/lib/types";

interface TemperatureChartProps {
  history: ValuationHistoryPoint[];
  loading?: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function TemperatureChart({ history, loading }: TemperatureChartProps) {
  if (loading || !history?.length) {
    return (
      <div className="h-64 rounded-xl border border-border bg-surface-muted/30 flex items-center justify-center">
        <span className="text-sm text-zinc-500">
          {loading ? "加载中…" : "暂无历史数据"}
        </span>
      </div>
    );
  }

  const data = history.map((p) => ({
    ...p,
    dateLabel: formatDate(p.date),
  }));

  return (
    <div className="h-64 w-full rounded-xl border border-border bg-surface-elevated/50 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={{ stroke: "#2a2a2e" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#71717a" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}°`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#161618",
              border: "1px solid #2a2a2e",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(value: number | undefined) => [value != null ? `${value.toFixed(1)}°` : "—", "温度"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ fill: "#0d0d0f", stroke: "#22d3ee", strokeWidth: 1 }}
            activeDot={{ r: 4, fill: "#22d3ee" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
