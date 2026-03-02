"use client";

import useSWR from "swr";
import { Thermometer } from "@/components/Thermometer";
import { Dashboard } from "@/components/Dashboard";
import type { TemperatureResult } from "@/lib/types";
import type { DashboardData } from "@/lib/types";

const TEMP_API = "/api/temperature";
const fetcher = (url: string) => fetch(url).then((r) => r.json());

function toDashboardData(result: TemperatureResult): DashboardData {
  const total = result.snapshot.totalCount || 1;
  return {
    snapshot: result.snapshot,
    upRatio: result.snapshot.upCount / total,
    maxContinuousBoard: null,
  };
}

export default function Home() {
  const { data, error, isLoading, mutate } = useSWR<TemperatureResult>(TEMP_API, fetcher, {
    refreshInterval: 60 * 1000,
    revalidateOnFocus: true,
  });

  const dashboardData = data ? toDashboardData(data) : null;

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-xl font-medium text-zinc-400">A股市场温度计</h1>
        <p className="text-sm text-zinc-600 mt-1">情绪 · 活跃度 · 估值</p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          数据加载失败，请稍后重试。
          <button
            type="button"
            onClick={() => mutate()}
            className="ml-2 underline"
          >
            重试
          </button>
        </div>
      )}

      {data?.dataSource === "sina" && (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          数据来自新浪财经（东方财富不可用）。涨跌家数为根据上证/深证指数估算，成交额为真实两市汇总。
          <button
            type="button"
            onClick={() => mutate()}
            className="ml-2 underline"
          >
            重试
          </button>
        </div>
      )}

      {data?.dataSource === "static" && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          东方财富与新浪接口均不可用，当前为示例数据，仅作展示。
          <button
            type="button"
            onClick={() => mutate()}
            className="ml-2 underline"
          >
            重试
          </button>
        </div>
      )}

      <section className="flex flex-col items-center mb-12">
        <Thermometer data={data ?? null} loading={isLoading} />
        <p className="mt-4 text-xs text-zinc-600 max-w-sm text-center">
          本温度由涨跌家数、成交额等情绪与活跃度加权得出，与有知有行基于估值分位的「知行温度计」不同，仅供参考。
        </p>
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 mb-3">市场情绪看板</h2>
        <Dashboard data={dashboardData} loading={isLoading} />
      </section>
    </main>
  );
}
