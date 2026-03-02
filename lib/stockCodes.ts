/**
 * 仅包含上证、深证 A 股代码，用于腾讯批量行情请求。
 * 优先从新浪拉取在册列表；若新浪 456/限流则回退到区间生成（含无效代码，由腾讯返回后只统计有效条数）。
 */

const SINA_LIST_BASE =
  "http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData";
const LIST_PAGE_SIZE = 80;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PAGE_DELAY_MS = 120;

const SINA_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, */*",
  Referer: "https://finance.sina.com.cn/",
  "Cache-Control": "no-cache",
};

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let cachedCodes: string[] | null = null;
let cacheTime = 0;

interface SinaListItem {
  symbol?: string;
}

async function fetchSinaNodePage(node: string, page: number): Promise<string[]> {
  const url = `${SINA_LIST_BASE}?page=${page}&num=${LIST_PAGE_SIZE}&sort=symbol&asc=1&node=${node}&_s_r_a=page`;
  const res = await fetch(url, { headers: SINA_HEADERS, cache: "no-store" });
  if (!res.ok) throw new Error(`sina list ${node} ${res.status}`);
  const raw = await res.text();
  let list: SinaListItem[];
  try {
    list = JSON.parse(raw) as SinaListItem[];
  } catch {
    throw new Error("sina list: invalid json");
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => item.symbol)
    .filter((s): s is string => typeof s === "string" && (s.startsWith("sh") || s.startsWith("sz")));
}

async function fetchSinaNodeAll(node: string): Promise<string[]> {
  const all: string[] = [];
  let page = 1;
  for (;;) {
    const batch = await fetchSinaNodePage(node, page);
    if (batch.length === 0) break;
    all.push(...batch);
    if (batch.length < LIST_PAGE_SIZE) break;
    page += 1;
    await delay(PAGE_DELAY_MS);
  }
  return all;
}

/** 新浪不可用（456 等）时用区间生成沪深代码，不含北交所；区间不重叠，避免重复统计 */
function generateFallbackCodes(): string[] {
  const codes: string[] = [];
  const shRanges: [number, number][] = [
    [600000, 604999], // 沪市主板 600/601/603/604
    [605000, 605999],
    [688000, 688999], // 科创板
  ];
  const szRanges: [number, number][] = [
    [1, 2999],       // 000001-002999
    [3000, 4999],    // 003000-004999
    [300000, 301999], // 创业板
  ];
  for (const [min, max] of shRanges) {
    for (let i = min; i <= max; i++) codes.push(`sh${String(i).padStart(6, "0")}`);
  }
  for (const [min, max] of szRanges) {
    for (let i = min; i <= max; i++) codes.push(`sz${String(i).padStart(6, "0")}`);
  }
  return codes;
}

/**
 * 返回沪深 A 股代码（仅 sh/sz）。优先新浪在册列表；失败则用区间回退。
 * 结果带内存缓存。
 */
export async function getAshareCodes(): Promise<string[]> {
  const now = Date.now();
  if (cachedCodes !== null && now - cacheTime < CACHE_TTL_MS) {
    return cachedCodes;
  }
  try {
    const [sh, sz] = await Promise.all([
      fetchSinaNodeAll("sh_a"),
      fetchSinaNodeAll("sz_a"),
    ]);
    const list = [...sh, ...sz];
    if (list.length > 0) {
      cachedCodes = Array.from(new Set(list));
      cacheTime = now;
      return cachedCodes;
    }
  } catch {
    // 新浪 456/限流等时静默回退到区间生成列表，不向控制台抛错
  }
  cachedCodes = Array.from(new Set(generateFallbackCodes()));
  cacheTime = now;
  return cachedCodes;
}
