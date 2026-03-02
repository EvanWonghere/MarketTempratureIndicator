import { NextResponse } from "next/server";

const SINA_HS300_KLINE =
  "http://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=sh000300&scale=240&ma=no&datalen=90";

export interface Hs300KLineItem {
  date: string;
  close: number;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** 将 day 转为 YYYY-MM-DD */
function normalizeDay(day: string): string {
  const s = String(day).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return s;
}

export async function GET() {
  try {
    const res = await fetch(SINA_HS300_KLINE, { cache: "no-store" });
    if (!res.ok) throw new Error(`sina kline ${res.status}`);
    const raw = (await res.json()) as unknown;
    const arr = Array.isArray(raw) ? raw : [];
    const list: Hs300KLineItem[] = arr
      .map((item: { day?: string; close?: number }) => {
        const day = item?.day;
        const close = Number(item?.close);
        if (day == null || Number.isNaN(close)) return null;
        return { date: normalizeDay(day), close: Math.round(close * 100) / 100 };
      })
      .filter((x): x is Hs300KLineItem => x != null);
    return NextResponse.json({ list });
  } catch (e) {
    console.error("hs300-kline api error", e);
    return NextResponse.json({ list: [] });
  }
}
