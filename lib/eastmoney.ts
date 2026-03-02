import type { MarketSnapshot } from "./types";

const LIST_URL = "https://push2.eastmoney.com/api/qt/clist/get";
/** 沪市主板+北交所 + 深市主板+创业板 等 A 股 */
const FS = "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23";
const FIELDS = "f2,f3,f5,f6,f12,f14";

/** 模拟浏览器请求头，降低被对方关闭连接的概率 */
const DEFAULT_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
  Referer: "https://quote.eastmoney.com/",
  "Cache-Control": "no-cache",
};

interface EastMoneyItem {
  f2?: number; // 现价
  f3?: number; // 涨跌幅
  f5?: number; // 成交量
  f6?: number; // 成交额
}

interface EastMoneyResponse {
  data?: {
    total?: number;
    diff?: EastMoneyItem[];
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** 带重试的 fetch，应对 other side closed 等网络波动 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (e) {
      lastErr = e;
      if (i < maxRetries - 1) await sleep(300 * (i + 1));
    }
  }
  throw lastErr;
}

/** 单页拉取，返回 diff 数组与 total */
async function fetchListPage(pn: number, pz: number): Promise<{ diff: EastMoneyItem[]; total: number }> {
  const params = new URLSearchParams({
    fs: FS,
    fields: FIELDS,
    pn: String(pn),
    pz: String(pz),
    fid: "f3",
    po: "1",
    np: "1",
    ut: "bd1d9ddb04089700cf9c27f6f7426281",
    fltt: "2",
    invt: "2",
    _: String(Date.now()),
  });
  const res = await fetchWithRetry(`${LIST_URL}?${params.toString()}`, {
    headers: DEFAULT_HEADERS,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`eastmoney list ${res.status}`);
  const json = (await res.json()) as EastMoneyResponse;
  const data = json.data;
  if (!data?.diff) return { diff: [], total: data?.total ?? 0 };
  return { diff: data.diff, total: data.total ?? data.diff.length };
}

/** 东方财富该接口单页最多约 20～100 条，需分页拉全市场 */
const PAGE_SIZE = 100;

/** 拉全市场并汇总为 MarketSnapshot */
export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  let pn = 1;
  let total = PAGE_SIZE;
  const all: EastMoneyItem[] = [];

  while ((pn - 1) * PAGE_SIZE < total) {
    const { diff, total: t } = await fetchListPage(pn, PAGE_SIZE);
    total = t;
    all.push(...diff);
    if (diff.length < PAGE_SIZE) break;
    pn += 1;
    // 避免请求过多导致超时，全 A 股约 5000+，100 条/页约 50+ 次
    if (pn > 60) break;
    // 分页间短暂间隔，降低被对方关闭连接的概率
    await sleep(150);
  }

  let upCount = 0;
  let downCount = 0;
  let flatCount = 0;
  let limitUpCount = 0;
  let limitDownCount = 0;
  let totalAmount = 0;

  for (const item of all) {
    const pct = item.f3 ?? 0;
    if (pct > 0) upCount += 1;
    else if (pct < 0) downCount += 1;
    else flatCount += 1;
    if (pct >= 9.8) limitUpCount += 1;
    else if (pct <= -9.8) limitDownCount += 1;
    totalAmount += Number(item.f6) || 0;
  }

  const totalCount = all.length;

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

/** 当东方财富接口不可用时返回的示例数据，保证页面可展示 */
export function getFallbackSnapshot(): MarketSnapshot {
  return {
    upCount: 2400,
    downCount: 2300,
    flatCount: 200,
    limitUpCount: 45,
    limitDownCount: 28,
    totalAmount: 1.02e12,
    totalCount: 4900,
    timestamp: Date.now(),
  };
}
