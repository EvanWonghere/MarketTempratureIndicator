import type { MarketSnapshot } from "./types";

const SINA_BASE = "https://hq.sinajs.cn/list=";
const SINA_REFERER = "https://finance.sina.com.cn";

/** 新浪指数返回：名称, 当前点数, 涨跌点, 涨跌幅, 成交量(手), 成交额(万元) */
function parseSinaIndexLine(line: string): { changePct: number; amountWan: number } {
  const parts = line.split(",");
  const changePct = Number(parts[3]) || 0;
  const amountWan = Number(parts[5]) || 0;
  return { changePct, amountWan };
}

function extractVarBody(text: string): string {
  const match = text.match(/="([^"]*)"/);
  return match ? match[1].trim() : "";
}

/** 新浪请求头，需 Referer 否则可能被拒 */
const SINA_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  Referer: SINA_REFERER,
  "Cache-Control": "no-cache",
};

/**
 * 从新浪获取上证、深证指数，汇总成交额，并用指数涨跌幅估算涨跌家数（新浪无直接涨跌家数）。
 * 海外部署时新浪往往比东方财富更易连通。
 */
export async function fetchSinaMarketSnapshot(): Promise<MarketSnapshot> {
  const url = `${SINA_BASE}s_sh000001,s_sz399001`;
  const res = await fetch(url, { headers: SINA_HEADERS, cache: "no-store" });
  if (!res.ok) throw new Error(`sina ${res.status}`);
  const text = await res.text();
  const lines = text.split("\n").filter((s) => s.includes("hq_str_"));
  if (lines.length < 2) throw new Error("sina parse: missing index lines");

  const shLine = extractVarBody(lines[0]);
  const szLine = extractVarBody(lines[1]);
  if (!shLine || !szLine) throw new Error("sina parse: empty body");

  const sh = parseSinaIndexLine(shLine);
  const sz = parseSinaIndexLine(szLine);

  // 成交额：新浪单位是万元，转为元
  const totalAmount = (sh.amountWan + sz.amountWan) * 1e4;

  // 用两市指数涨跌幅均值估算涨跌比（无真实涨跌家数时）
  const avgPct = (sh.changePct + sz.changePct) / 2;
  const upRatio = Math.max(0, Math.min(1, 0.5 + avgPct / 10));
  const totalCount = 5000;
  const upCount = Math.round(totalCount * upRatio);
  const downCount = totalCount - upCount;
  const flatCount = 0;

  // 涨停/跌停无数据，按指数涨跌幅粗略估计
  const limitUpCount = Math.max(0, Math.min(100, Math.round(25 + avgPct * 2)));
  const limitDownCount = Math.max(0, Math.min(100, Math.round(25 - avgPct * 2)));

  return {
    upCount,
    downCount,
    flatCount,
    limitUpCount,
    limitDownCount,
    totalAmount,
    totalCount,
    timestamp: Date.now(),
  };
}
