"use client";

import type { ValuationSummary } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface ValuationCardsProps {
  summary: ValuationSummary | null;
  loading?: boolean;
  /** 左栏 2x2 紧凑布局 */
  layout2x2?: boolean;
}

export function ValuationCards({ summary, loading, layout2x2 }: ValuationCardsProps) {
  const gridClass = layout2x2 ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 lg:grid-cols-4 gap-3";
  if (loading) {
    return (
      <div className={gridClass}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <div className="h-16 rounded-sm bg-surface-muted animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className={gridClass}>
      <Card>
        <div className="text-xs text-zinc-400 mb-1 font-mono">PE(TTM) · 近10年分位</div>
        <div className="text-xl font-semibold tabular-nums text-zinc-100 font-mono">
          {summary.pe.toFixed(2)}
          <span className="text-sm font-normal text-zinc-500 ml-1.5">倍</span>
        </div>
        <div className="text-sm text-zinc-400 mt-0.5 font-mono">
          分位 <span className="tabular-nums text-zinc-300">{summary.pePercentile.toFixed(1)}%</span>
        </div>
      </Card>

      <Card>
        <div className="text-xs text-zinc-400 mb-1 font-mono">PB · 近10年分位</div>
        <div className="text-xl font-semibold tabular-nums text-zinc-100 font-mono">
          {summary.pb.toFixed(2)}
          <span className="text-sm font-normal text-zinc-500 ml-1.5">倍</span>
        </div>
        <div className="text-sm text-zinc-400 mt-0.5 font-mono">
          分位 <span className="tabular-nums text-zinc-300">{summary.pbPercentile.toFixed(1)}%</span>
        </div>
      </Card>

      <Card>
        <div className="text-xs text-zinc-400 mb-1 font-mono">10年期国债收益率</div>
        <div className="text-xl font-semibold tabular-nums text-zinc-100 font-mono">
          {summary.bondYield10Y.toFixed(2)}
          <span className="text-sm font-normal text-zinc-500 ml-1.5">%</span>
        </div>
        <div className="text-sm text-zinc-400 mt-0.5 font-mono">无风险利率 Rf</div>
      </Card>

      <Card>
        <div className="text-xs text-zinc-400 mb-1 font-mono">股债利差 ERP</div>
        <div className="text-xl font-semibold tabular-nums text-zinc-100 font-mono">
          {summary.erp.toFixed(2)}
          <span className="text-sm font-normal text-zinc-500 ml-1.5">%</span>
        </div>
        <div className="text-sm text-zinc-400 mt-0.5 font-mono">
          分位 <span className="tabular-nums text-zinc-300">{summary.erpPercentile.toFixed(1)}%</span>
        </div>
      </Card>
    </div>
  );
}
