import type { MarketSnapshot } from "./types";
import { getAshareCodes } from "./stockCodes";

// ============ 腾讯财经：指数（两市总成交额） ============
const TENCENT_INDEX_URL = "http://qt.gtimg.cn/q=s_sh000001,s_sz399001";

/** 简要接口 s_ 字段：7=成交额(万) 5=涨跌% */
const TENCENT_BRIEF_AMOUNT_INDEX = 7;

function parseTencentIndexLine(line: string): number {
  const match = line.match(/="([^"]+)"/);
  if (!match) return 0;
  const parts = match[1].trim().split("~");
  return Number(parts[TENCENT_BRIEF_AMOUNT_INDEX] ?? 0) || 0;
}

async function fetchTotalAmountWanFromTencent(): Promise<number> {
  const res = await fetch(TENCENT_INDEX_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`tencent index ${res.status}`);
  const text = await res.text();
  let totalWan = 0;
  const regex = /v_s_(?:sh|sz)\d+="[^"]+"/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    totalWan += parseTencentIndexLine(m[0]);
  }
  if (totalWan <= 0) throw new Error("tencent: no amount parsed");
  return totalWan;
}

function wanToYuan(wan: number): number {
  return wan * 1e4;
}

// ============ 腾讯财经：全量个股完整行情（涨跌平 + 涨停跌停） ============
const TENCENT_QUOTE_BASE = "http://qt.gtimg.cn/q=";
/** 完整行情字段：3 当前价 32 涨跌% 47 涨停价 48 跌停价 */
const IDX_PRICE = 3;
const IDX_CHANGE_PCT = 32;
const IDX_LIMIT_UP = 47;
const IDX_LIMIT_DOWN = 48;

const BATCH_SIZE = 80;
const CONCURRENT = 10;

function parseTencentFullQuoteLine(line: string): {
  changePct: number;
  price: number;
  limitUp: number;
  limitDown: number;
} | null {
  const match = line.match(/="([^"]+)"/);
  if (!match) return null;
  const parts = match[1].trim().split("~");
  const price = Number(parts[IDX_PRICE]);
  const changePct = Number(parts[IDX_CHANGE_PCT]);
  const limitUp = Number(parts[IDX_LIMIT_UP]);
  const limitDown = Number(parts[IDX_LIMIT_DOWN]);
  if (Number.isNaN(changePct) && Number.isNaN(price)) return null;
  return {
    changePct: Number.isNaN(changePct) ? 0 : changePct,
    price: Number.isNaN(price) ? 0 : price,
    limitUp: Number.isNaN(limitUp) ? 0 : limitUp,
    limitDown: Number.isNaN(limitDown) ? 0 : limitDown,
  };
}

async function fetchTencentBatch(codes: string[]): Promise<string> {
  const url = `${TENCENT_QUOTE_BASE}${codes.join(",")}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`tencent quote ${res.status}`);
  return res.text();
}

/** 从全量行情文本统计：涨跌平家数、涨停跌停家数，totalCount = 实际有效条数 */
function aggregateFullQuotes(text: string): {
  upCount: number;
  downCount: number;
  flatCount: number;
  limitUpCount: number;
  limitDownCount: number;
  totalCount: number;
} {
  let upCount = 0;
  let downCount = 0;
  let flatCount = 0;
  let limitUpCount = 0;
  let limitDownCount = 0;
  const regex = /v_(?:sh|sz)\d+="[^"]+"/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const row = parseTencentFullQuoteLine(m[0]);
    if (!row) continue;
    const { changePct, price, limitUp, limitDown } = row;
    if (changePct > 0) upCount += 1;
    else if (changePct < 0) downCount += 1;
    else flatCount += 1;
    if (limitUp > 0 && price >= limitUp) limitUpCount += 1;
    else if (limitDown > 0 && price <= limitDown) limitDownCount += 1;
  }
  const totalCount = upCount + downCount + flatCount;
  return {
    upCount,
    downCount,
    flatCount,
    limitUpCount,
    limitDownCount,
    totalCount: totalCount || 1,
  };
}

async function fetchTencentAllQuotesStats(): Promise<{
  upCount: number;
  downCount: number;
  flatCount: number;
  limitUpCount: number;
  limitDownCount: number;
  totalCount: number;
}> {
  const allCodes = await getAshareCodes();
  const batches: string[][] = [];
  for (let i = 0; i < allCodes.length; i += BATCH_SIZE) {
    batches.push(allCodes.slice(i, i + BATCH_SIZE));
  }
  const results: string[] = [];
  for (let i = 0; i < batches.length; i += CONCURRENT) {
    const chunk = batches.slice(i, i + CONCURRENT);
    const texts = await Promise.all(chunk.map((b) => fetchTencentBatch(b)));
    results.push(...texts);
  }
  let upCount = 0;
  let downCount = 0;
  let flatCount = 0;
  let limitUpCount = 0;
  let limitDownCount = 0;
  for (const text of results) {
    const s = aggregateFullQuotes(text);
    upCount += s.upCount;
    downCount += s.downCount;
    flatCount += s.flatCount;
    limitUpCount += s.limitUpCount;
    limitDownCount += s.limitDownCount;
  }
  const totalCount = upCount + downCount + flatCount;
  return {
    upCount,
    downCount,
    flatCount,
    limitUpCount,
    limitDownCount,
    totalCount: totalCount || 1,
  };
}

// ============ 对外：统一看板快照（仅服务端调用，全部来自腾讯） ============

/** 拉取完整看板快照：腾讯指数成交额 + 腾讯全量个股行情，涨跌平与涨跌停均为实际统计，totalCount 为实际参与统计的股票数 */
export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const [totalAmountWan, quoteStats] = await Promise.all([
    fetchTotalAmountWanFromTencent(),
    fetchTencentAllQuotesStats(),
  ]);
  const totalAmount = wanToYuan(totalAmountWan);
  return {
    upCount: quoteStats.upCount,
    downCount: quoteStats.downCount,
    flatCount: quoteStats.flatCount,
    limitUpCount: quoteStats.limitUpCount,
    limitDownCount: quoteStats.limitDownCount,
    totalAmount,
    totalCount: quoteStats.totalCount,
    timestamp: Date.now(),
  };
}

/** 兼容：无降级分支，仅返回 snapshot */
export interface MarketSnapshotResult {
  snapshot: MarketSnapshot;
  degraded?: boolean;
}

export async function fetchMarketSnapshotWithMeta(): Promise<MarketSnapshotResult> {
  const snapshot = await fetchMarketSnapshot();
  return { snapshot };
}

/** 两市成交额（万元）格式化为「万亿」显示用 */
export function formatAmountTrillion(wan: number): string {
  const yuan = wan * 1e4;
  const trill = yuan / 1e12;
  if (trill >= 1) return `${trill.toFixed(2)}万亿`;
  return `${(yuan / 1e8).toFixed(2)}亿`;
}

/** 失败时使用的静态示例快照 */
export function getFallbackSnapshot(): MarketSnapshot {
  return {
    upCount: 2400,
    downCount: 2300,
    flatCount: 200,
    limitUpCount: 94,
    limitDownCount: 21,
    totalAmount: 1.02e12,
    totalCount: 4900,
    timestamp: Date.now(),
  };
}

// 保留供测试或外部使用的涨跌停计算（腾讯直接返回涨停跌停价，此处仅作备用）
export function calculateLimit(
  _code: string,
  _name: string,
  preClose: number
): [number, number] {
  const rate = 0.1;
  const limitUp = Math.round(preClose * (1 + rate) * 100) / 100;
  const limitDown = Math.round(preClose * (1 - rate) * 100) / 100;
  return [limitUp, limitDown];
}
