"use client";

import useSWR from "swr";
import { ValuationGauge } from "@/components/ValuationGauge";
import { ValuationCards } from "@/components/ValuationCards";
import { TemperatureChart } from "@/components/TemperatureChart";
import { Dashboard } from "@/components/Dashboard";
import type { ValuationData, DashboardData } from "@/lib/types";

const VALUATION_JSON = "/valuation.json";
const DASHBOARD_API = "/api/dashboard";
const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatUpdatedAt(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function Home() {
  const { data, error, isLoading, mutate } = useSWR<ValuationData>(VALUATION_JSON, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60 * 1000,
  });
  const { data: dashboardData, error: dashboardError, isLoading: dashboardLoading } = useSWR<DashboardData>(
    DASHBOARD_API,
    fetcher,
    { refreshInterval: 60 * 1000, revalidateOnFocus: true }
  );

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-xl font-medium text-zinc-400">A股估值温度计</h1>
        <p className="text-sm text-zinc-600 mt-1">
          每日定时 · 历史估值分位 + 股债利差(ERP) · {data?.indexName ?? "万得全A"}
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          数据加载失败，请稍后重试。
          <button type="button" onClick={() => mutate()} className="ml-2 underline">
            重试
          </button>
        </div>
      )}

      <section className="flex flex-col items-center mb-10">
        <ValuationGauge value={data?.summary?.temperature ?? 0} loading={isLoading} />
        <p className="mt-4 text-xs text-zinc-600 max-w-sm text-center">
          综合温度 = 估值分位 70% + ERP 分位 30%。0–20° 极度低估，40–60° 估值合理，80–100° 极度高估，仅供参考。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">核心指标</h2>
        <ValuationCards summary={data?.summary ?? null} loading={isLoading} />
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">市场情绪看板</h2>
        {dashboardError && (
          <p className="text-xs text-amber-500 mb-2">短线数据暂时不可用，仅展示估值温度。</p>
        )}
        <Dashboard
          data={
            dashboardData && "snapshot" in dashboardData && dashboardData.snapshot
              ? dashboardData
              : null
          }
          loading={dashboardLoading}
        />
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 mb-3">近 30 日温度走势</h2>
        <TemperatureChart history={data?.history ?? []} loading={isLoading} />
        {data?.updatedAt && (
          <p className="mt-2 text-xs text-zinc-600">
            估值数据更新于 {formatUpdatedAt(data.updatedAt)}
          </p>
        )}
      </section>
    </main>
  );
}
