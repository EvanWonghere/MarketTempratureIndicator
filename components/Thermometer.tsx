"use client";

import type { TemperatureResult } from "@/lib/types";

interface ThermometerProps {
  data: TemperatureResult | null;
  loading?: boolean;
}

function getGradient(value: number): string {
  if (value <= 30) return "from-cyan-500 to-cyan-300";
  if (value <= 70) return "from-emerald-500 to-yellow-400";
  return "from-amber-500 to-rose-500";
}

function getBandLabel(band: "low" | "mid" | "high"): string {
  switch (band) {
    case "low":
      return "偏冷";
    case "mid":
      return "中性";
    case "high":
      return "偏热";
    default:
      return "";
  }
}

export function Thermometer({ data, loading }: ThermometerProps) {
  const value = data?.value ?? 0;
  const band = data?.band ?? "mid";

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="h-64 w-16 rounded-full border-2 border-border bg-surface-muted animate-pulse" />
        <div className="h-8 w-24 rounded bg-surface-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 拟物温度计：竖条 + 液柱 */}
      <div className="relative h-64 w-16 rounded-full border-2 border-border bg-surface-muted overflow-hidden shadow-inner">
        <div
          className={`absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t ${getGradient(value)} transition-all duration-700 ease-out`}
          style={{ height: `${value}%` }}
        />
        {/* 刻度线：每 10 一格 */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-1">
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((t) => (
            <div
              key={t}
              className="absolute left-0 right-0 h-px bg-border/80"
              style={{ bottom: `${t}%` }}
            />
          ))}
        </div>
      </div>

      {/* 当前温度数值与温带 */}
      <div className="text-center">
        <div className="text-4xl font-light tabular-nums text-zinc-100">
          {value}
          <span className="text-2xl text-zinc-500 ml-0.5">°</span>
        </div>
        <div className="mt-1 text-sm text-zinc-500">{getBandLabel(band)}</div>
      </div>

      {/* 组成项：大盘广度 / 交投热度 / 极端情绪 */}
      {data?.components && (
        <div className="flex gap-4 text-xs text-zinc-500">
          <span>大盘广度 {data.components.sentiment}</span>
          <span>交投热度 {data.components.activity}</span>
          <span>极端情绪 {data.components.valuation}</span>
        </div>
      )}
    </div>
  );
}
