"use client";

import type { DashboardData } from "@/lib/types";
import { Card } from "./ui/Card";

interface DashboardProps {
  data: DashboardData | null;
  loading?: boolean;
}

function formatAmount(yuan: number): string {
  if (yuan >= 1e12) return `${(yuan / 1e12).toFixed(2)} 万亿`;
  if (yuan >= 1e8) return `${(yuan / 1e8).toFixed(2)} 亿`;
  return yuan.toLocaleString();
}

export function Dashboard({ data, loading }: DashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <div className="h-12 rounded bg-surface-muted animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const s = data.snapshot;
  const upRatioPct = (data.upRatio * 100).toFixed(1);

  return (
    <div className="space-y-3">
      <div className="text-xs text-zinc-600">共 {s.totalCount} 只 A 股参与统计</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <Card>
        <div className="text-xs text-zinc-500 mb-1">上涨 / 平盘 / 下跌</div>
        <div className="text-lg font-medium text-zinc-100">
          <span className="text-emerald-400">{s.upCount}</span>
          <span className="text-zinc-500 mx-1">/</span>
          <span className="text-zinc-400">{s.flatCount}</span>
          <span className="text-zinc-500 mx-1">/</span>
          <span className="text-rose-400">{s.downCount}</span>
        </div>
      </Card>
      <Card>
        <div className="text-xs text-zinc-500 mb-1">涨跌比</div>
        <div className="text-lg font-medium text-zinc-100">{upRatioPct}%</div>
      </Card>
      <Card>
        <div className="text-xs text-zinc-500 mb-1">涨停 / 跌停</div>
        <div className="text-lg font-medium text-zinc-100">
          <span className="text-amber-400">{s.limitUpCount}</span>
          <span className="text-zinc-500 mx-1">/</span>
          <span className="text-slate-400">{s.limitDownCount}</span>
        </div>
      </Card>
      <Card>
        <div className="text-xs text-zinc-500 mb-1">两市成交额</div>
        <div className="text-lg font-medium text-zinc-100">
          {formatAmount(s.totalAmount)}
        </div>
      </Card>
      {data.maxContinuousBoard != null && (
        <Card>
          <div className="text-xs text-zinc-500 mb-1">连板高度</div>
          <div className="text-lg font-medium text-zinc-100">
            {data.maxContinuousBoard} 板
          </div>
        </Card>
      )}
      </div>
    </div>
  );
}
