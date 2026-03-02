"use client";

import type { DashboardData } from "@/lib/types";
import { useColorScheme } from "@/lib/ColorSchemeContext";
import { Card } from "./ui/Card";

interface DashboardProps {
  data: DashboardData | null;
  loading?: boolean;
  /** 右栏紧凑 2x2，不显示成交额 */
  compact?: boolean;
}

export function Dashboard({ data, loading, compact }: DashboardProps) {
  const { upClass, downClass } = useColorScheme();

  if (loading) {
    return (
      <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <div className="h-12 rounded-sm bg-surface-muted animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const s = data.snapshot;
  const upRatioPct = (data.upRatio * 100).toFixed(1);
  const medianChange = s.medianChange ?? null;
  const isDivergent = s.isDivergent === true;
  const hs300Change = s.hs300Change ?? 0;
  const zz1000Change = s.zz1000Change ?? 0;
  const gridClass = compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3";

  return (
    <div className="space-y-3">
      {!compact && isDivergent && (
        <div className="rounded-sm border border-amber-500/50 bg-amber-500/10 px-3 py-2 mb-2">
          <p className="text-xs font-medium text-amber-200 font-mono">
            🚨 沪深300 ({hs300Change > 0 ? "+" : ""}{hs300Change}%) vs 中证1000 ({zz1000Change > 0 ? "+" : ""}{zz1000Change}%)
          </p>
          <p className="mt-0.5 text-xs text-amber-200/80 font-mono">资金剧烈博弈，警惕赚了指数不赚钱</p>
        </div>
      )}
      {!compact && (
        <div className="text-xs text-zinc-500 font-mono">共 {s.totalCount} 只 A 股参与统计</div>
      )}
      <div className={gridClass}>
        <Card>
          <div className="text-xs text-zinc-400 mb-1 font-mono">上涨 / 平盘 / 下跌</div>
          <div className="text-base font-medium text-zinc-100 font-mono tabular-nums">
            <span className={upClass}>{s.upCount}</span>
            <span className="text-zinc-500 mx-1">/</span>
            <span className="text-zinc-400">{s.flatCount}</span>
            <span className="text-zinc-500 mx-1">/</span>
            <span className={downClass}>{s.downCount}</span>
          </div>
        </Card>
        {medianChange != null && (
          <Card>
            <div className="text-xs text-zinc-400 mb-1 font-mono">全市场中位数</div>
            <div
              className={`text-base font-medium font-mono tabular-nums ${
                medianChange > 0 ? upClass : medianChange < 0 ? downClass : "text-zinc-400"
              }`}
            >
              {medianChange > 0 ? "+" : ""}
              {medianChange}%
            </div>
          </Card>
        )}
        <Card>
          <div className="text-xs text-zinc-400 mb-1 font-mono">涨跌比</div>
          <div className="text-base font-medium text-zinc-100 font-mono tabular-nums">{upRatioPct}%</div>
        </Card>
        <Card>
          <div className="text-xs text-zinc-400 mb-1 font-mono">涨停 / 跌停</div>
          <div className="text-base font-medium text-zinc-100 font-mono tabular-nums">
            <span className={upClass}>{s.limitUpCount}</span>
            <span className="text-zinc-500 mx-1">/</span>
            <span className={downClass}>{s.limitDownCount}</span>
          </div>
        </Card>
        {!compact && (
          <Card>
            <div className="text-xs text-zinc-400 mb-1 font-mono">两市成交额</div>
            <div className="text-base font-medium text-zinc-100 font-mono tabular-nums">
              {formatAmount(s.totalAmount)}
            </div>
          </Card>
        )}
        {data.maxContinuousBoard != null && !compact && (
          <Card>
            <div className="text-xs text-zinc-400 mb-1 font-mono">连板高度</div>
            <div className="text-base font-medium text-zinc-100 font-mono tabular-nums">
              {data.maxContinuousBoard} 板
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function formatAmount(yuan: number): string {
  if (yuan >= 1e12) return `${(yuan / 1e12).toFixed(2)} 万亿`;
  if (yuan >= 1e8) return `${(yuan / 1e8).toFixed(2)} 亿`;
  return yuan.toLocaleString();
}
