"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { ColorSchemeProvider, useColorScheme } from "@/lib/ColorSchemeContext";
import { ValuationGauge } from "@/components/ValuationGauge";
import { ValuationCards } from "@/components/ValuationCards";
import { TemperatureChart } from "@/components/TemperatureChart";
import { Dashboard } from "@/components/Dashboard";
import { Headlines } from "@/components/Headlines";
import type { ValuationData, DashboardData, ValuationHistoryPoint } from "@/lib/types";

const VALUATION_JSON = "/valuation.json";
const DASHBOARD_API = "/api/dashboard";
const HS300_KLINE_API = "/api/hs300-kline";
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

function useLiveClock() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return mounted && now ? now : null;
}

function formatAmount(yuan: number): string {
  if (yuan >= 1e12) return `${(yuan / 1e12).toFixed(2)} 万亿`;
  if (yuan >= 1e8) return `${(yuan / 1e8).toFixed(2)} 亿`;
  return yuan.toLocaleString();
}

/** 当前是否处于 A 股交易时段（工作日 09:25–11:30, 13:00–15:00 北京时间） */
function isTradingHours(now: Date): boolean {
  const utcMs = now.getTime();
  const shanghaiMs = utcMs + 8 * 60 * 60 * 1000;
  const shanghai = new Date(shanghaiMs);
  const day = shanghai.getUTCDay();
  const hour = shanghai.getUTCHours();
  const min = shanghai.getUTCMinutes();
  const isWeekday = day >= 1 && day <= 5;
  if (!isWeekday) return false;
  const session1 = (hour === 9 && min >= 25) || hour === 10 || (hour === 11 && min <= 30);
  const session2 = hour === 13 || hour === 14 || (hour === 15 && min === 0);
  return session1 || session2;
}

function PageContent() {
  const now = useLiveClock();
  const { toggleSwapColors, swapColors } = useColorScheme();
  const { data, error, isLoading, mutate } = useSWR<ValuationData>(VALUATION_JSON, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60 * 1000,
  });
  const trading = now != null && isTradingHours(now);
  const { data: dashboardData, error: dashboardError, isLoading: dashboardLoading } = useSWR<DashboardData>(
    DASHBOARD_API,
    fetcher,
    { refreshInterval: trading ? 60 * 1000 : 0, revalidateOnFocus: true }
  );
  const { data: hs300Kline } = useSWR<{ list: { date: string; close: number }[] }>(
    HS300_KLINE_API,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 5 * 60 * 1000 }
  );

  const chartHistory = useMemo((): ValuationHistoryPoint[] => {
    const tempData = data?.history ?? [];
    const klineData = hs300Kline?.list ?? [];
    const dateKey = (d: string) => String(d).trim().slice(0, 10);
    const closeByDate = new Map<string, number>();
    for (const item of klineData) closeByDate.set(dateKey(item.date), item.close);
    return tempData.map((p) => {
      const key = dateKey(p.date);
      const close = closeByDate.get(key);
      return {
        ...p,
        hs300Price: close !== undefined ? close : undefined,
      };
    });
  }, [data?.history, hs300Kline?.list]);

  const timeStr =
    now == null
      ? "--:--:--"
      : now.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const totalAmount = dashboardData?.snapshot?.totalAmount ?? 0;
  const snapshot = dashboardData?.snapshot;
  const isDivergent = snapshot?.isDivergent === true;
  const hs300Change = snapshot?.hs300Change ?? 0;
  const zz1000Change = snapshot?.zz1000Change ?? 0;

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#0a0a0a] text-gray-300 font-mono overflow-y-auto lg:overflow-hidden flex flex-col p-4">
      <header className="h-10 shrink-0 flex items-center justify-between text-xs text-zinc-400 border-b border-gray-800 px-1">
        <span>EVAN/TERMINAL</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleSwapColors}
            className="text-zinc-400 hover:text-zinc-300 underline"
            title={swapColors ? "红涨绿跌 (当前)" : "绿涨红跌 (当前)"}
          >
            {swapColors ? "红涨绿跌" : "绿涨红跌"}
          </button>
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${trading ? "bg-[#00ff00] animate-pulse" : "bg-zinc-500"}`}
              title={trading ? "盘中 (60s 刷新)" : "已休市"}
            />
            <span className="text-zinc-500 text-[11px]">
              {trading ? "盘中" : "已休市"}
              {trading && <span className="text-zinc-600 ml-0.5">(60s 刷新)</span>}
            </span>
          </span>
          <span className="tabular-nums">{timeStr}</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto lg:overflow-hidden pt-4 min-h-0">
        {error && (
          <div className="mb-3 rounded-sm border border-[#ff003c]/40 bg-[#ff003c]/10 px-4 py-2 text-sm text-[#ff003c]">
            数据加载失败，<button type="button" onClick={() => mutate()} className="underline">重试</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-24 gap-4 lg:h-full min-h-0">
          {/* 左栏：估值与指标 7/24 */}
          <div className="col-span-1 lg:col-span-7 flex flex-col gap-4 h-full min-h-0">
            <div className="border border-gray-800 rounded-sm p-4 bg-black shrink-0">
              <h2 className="text-xs font-medium text-zinc-400 mb-2">A股估值温度计</h2>
              <ValuationGauge value={data?.summary?.temperature ?? 0} loading={isLoading} />
              <p className="mt-2 text-xs text-zinc-500 text-center">
                {data?.indexName ?? "万得全A"} · 估值分位 70% + ERP 30%
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <ValuationCards summary={data?.summary ?? null} loading={isLoading} layout2x2 />
            </div>
          </div>

          {/* 中栏：情绪与趋势 9/24 */}
          <div className="col-span-1 lg:col-span-9 flex flex-col gap-4 h-full min-h-0">
            <div className="border border-gray-800 rounded-sm p-4 bg-black shrink-0">
              <div className="text-xs text-zinc-400 mb-1">两市成交额</div>
              <div className="text-2xl lg:text-3xl font-semibold tabular-nums text-[#00ff00]">
                {dashboardLoading ? "—" : formatAmount(totalAmount)}
              </div>
            </div>
            {snapshot && (
              <div className="shrink-0 rounded-sm border border-gray-800 px-3 py-1.5 bg-black">
                {isDivergent ? (
                  <p className="text-xs font-mono text-amber-500/90">
                    🚨 极度分化：沪深300 ({hs300Change > 0 ? "+" : ""}{hs300Change}%) vs 中证1000 ({zz1000Change > 0 ? "+" : ""}{zz1000Change}%)
                  </p>
                ) : (
                  <p className="text-xs font-mono text-zinc-500">大小盘同步运行</p>
                )}
              </div>
            )}
            <div className="shrink-0">
              <h2 className="text-xs font-medium text-zinc-400 mb-2">市场情绪看板</h2>
              {dashboardError && (
                <p className="text-xs text-amber-500 mb-2">短线数据暂时不可用</p>
              )}
              <Dashboard
                data={dashboardData && "snapshot" in dashboardData && dashboardData.snapshot ? dashboardData : null}
                loading={dashboardLoading}
                compact
              />
            </div>
            <div className="min-h-[300px] lg:min-h-0 flex-1 flex flex-col border border-gray-800 rounded-sm p-3 bg-black">
              <h2 className="text-xs font-medium text-zinc-400 mb-2 shrink-0">近 30 日温度走势</h2>
              <div className="flex-1 min-h-0 w-full">
                <TemperatureChart history={chartHistory} loading={isLoading} fillHeight />
              </div>
              {data?.updatedAt && (
                <p className="mt-1 text-xs text-zinc-500 shrink-0">更新于 {formatUpdatedAt(data.updatedAt)}</p>
              )}
            </div>
          </div>

          {/* 右栏：实时快讯 8/24 */}
          <div className="col-span-1 lg:col-span-8 flex flex-col h-full min-h-[400px] lg:min-h-0 border border-gray-800 rounded-sm p-4">
            <h2 className="text-xs font-medium text-zinc-400 mb-2 shrink-0">HEADLINES · 7x24 A股快讯</h2>
            <div className="flex-1 min-h-[400px] lg:min-h-0 overflow-y-auto pr-2 scrollbar-terminal">
              <Headlines enablePolling={trading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ColorSchemeProvider>
      <PageContent />
    </ColorSchemeProvider>
  );
}
