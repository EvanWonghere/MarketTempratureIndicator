"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  LabelList,
} from "recharts";
import type { ValuationHistoryPoint } from "@/lib/types";

interface TemperatureChartProps {
  history: ValuationHistoryPoint[];
  loading?: boolean;
  fillHeight?: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function TemperatureChart({ history, loading, fillHeight }: TemperatureChartProps) {
  const heightClass = fillHeight ? "min-h-0 h-full w-full" : "h-64 w-full";
  if (loading || !history?.length) {
    return (
      <div className={`${heightClass} rounded-sm bg-surface-muted/30 flex items-center justify-center font-mono`}>
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

  const tempValues = data.map((d) => d.temperature).filter((v) => v != null && !Number.isNaN(v));
  const tempMin = tempValues.length ? Math.min(...tempValues) - 5 : 0;
  const tempMax = tempValues.length ? Math.max(...tempValues) + 5 : 100;
  const leftDomain: [number, number] = [tempMin, tempMax];

  const hs300Values = data.map((d) => d.hs300Price).filter((v): v is number => v != null && !Number.isNaN(v));
  const priceMin = hs300Values.length ? Math.min(...hs300Values) - 50 : 3000;
  const priceMax = hs300Values.length ? Math.max(...hs300Values) + 50 : 4000;
  const rightDomain: [number, number] = [priceMin, priceMax];

  const lastIndex = data.length - 1;
  const lastDate = data[lastIndex]?.date;
  const renderLastLabel = (props: unknown) => {
    const p = props as { x?: number; y?: number; value?: number; payload?: { date?: string } };
    const { x, y, value, payload } = p;
    if (payload?.date !== lastDate || value == null || x == null || y == null) return null;
    const isTemp = typeof value === "number" && value <= 100;
    return (
      <text x={x + 6} y={y} fill="#a1a1aa" fontSize={10} fontFamily="ui-monospace, monospace" textAnchor="start" dominantBaseline="middle">
        {isTemp ? `${value}°` : value.toLocaleString()}
      </text>
    );
  };

  return (
    <div className={`${heightClass} rounded-sm bg-surface-elevated/50 flex flex-col`}>
      <div className="shrink-0 px-1 mb-1 font-mono text-[10px] text-zinc-500 leading-tight">
        <div>数据：综合温度 (左轴, 0-100%) [低估 | 合理 | 极高估]</div>
        <div>叠加：沪深300 (右轴)</div>
      </div>
      <div className="flex-1 min-h-0 p-3 pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 36, bottom: 6, left: 36 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            {/* 三色背景：必须在 Line 之前渲染，折线才能浮在上方 */}
            <ReferenceArea yAxisId="left" y1={0} y2={20} fill="#1e3a8a" fillOpacity={0.4} strokeOpacity={0} />
            <ReferenceArea yAxisId="left" y1={20} y2={80} fill="#333333" fillOpacity={0.3} strokeOpacity={0} />
            <ReferenceArea yAxisId="left" y1={80} y2={100} fill="#7f1d1d" fillOpacity={0.4} strokeOpacity={0} />

            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10, fill: "#71717a", fontFamily: "ui-monospace, monospace" }}
              axisLine={{ stroke: "#2a2a2e" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              domain={leftDomain}
              allowDataOverflow
              tick={{ fontSize: 10, fill: "#71717a", fontFamily: "ui-monospace, monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}°`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={rightDomain}
              allowDataOverflow
              tick={{ fontSize: 10, fill: "#a1a1aa", fontFamily: "ui-monospace, monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#141414",
                border: "1px solid #262626",
                borderRadius: "2px",
                fontFamily: "ui-monospace, monospace",
                fontSize: "11px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(value: number | undefined, name?: string) => {
                if (name === "temperature") return [value != null ? `${value.toFixed(1)}°` : "—", "温度"];
                if (name === "hs300Price") return [value != null && value !== undefined ? value.toLocaleString() : "—", "沪深300"];
                return [value != null ? String(value) : "—", name ?? ""];
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as { date?: string; temperature?: number; hs300Price?: number | null };
                const items = [
                  { label: "温度", value: row?.temperature, fmt: (v: number) => `${v.toFixed(1)}°` },
                  { label: "沪深300", value: row?.hs300Price, fmt: (v: number) => v.toLocaleString() },
                ].filter((x): x is { label: string; value: number; fmt: (v: number) => string } => typeof x.value === "number" && !Number.isNaN(x.value));
                return (
                  <div className="rounded border border-[#262626] bg-[#141414] px-3 py-2 font-mono text-[11px]">
                    <div className="text-zinc-400 mb-1">{row?.date ?? label}</div>
                    {items.length > 0 ? items.map(({ label: l, value, fmt }) => (
                      <div key={l} className="flex justify-between gap-4">
                        <span className="text-zinc-500">{l}</span>
                        <span className="text-zinc-200">{fmt(value)}</span>
                      </div>
                    )) : <div className="text-zinc-500">—</div>}
                  </div>
                );
              }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              name="temperature"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ fill: "#0d0d0f", stroke: "#22d3ee", strokeWidth: 1 }}
              activeDot={{ r: 4, fill: "#22d3ee" }}
            >
              <LabelList content={renderLastLabel} />
            </Line>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="hs300Price"
              name="hs300Price"
              stroke="#f59e0b"
              strokeWidth={2}
              connectNulls
              dot={{ fill: "#0d0d0f", stroke: "#f59e0b", strokeWidth: 1 }}
              activeDot={{ r: 4, fill: "#f59e0b" }}
            >
              <LabelList content={renderLastLabel} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
