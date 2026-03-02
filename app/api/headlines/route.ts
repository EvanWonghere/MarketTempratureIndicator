import { NextResponse } from "next/server";

const HEADLINES_PAGE_SIZE = 25;
const SINA_HEADLINES_URL = `https://zhibo.sina.com.cn/api/zhibo/feed?page=1&page_size=${HEADLINES_PAGE_SIZE}&zhibo_id=152`;

export interface HeadlineItem {
  create_time: string;
  rich_text: string;
}

export interface HeadlinesResponse {
  list: { time: string; text: string }[];
}

/** 将 create_time 转为 HH:mm。create_time 可能是秒级时间戳或 ISO 字符串 */
function formatTime(createTime: string): string {
  try {
    const ts = Number(createTime);
    const date = Number.isNaN(ts) ? new Date(createTime) : new Date(ts * 1000);
    return date.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

/** 从 rich_text 中提取纯文本（可能含 HTML 或 JSON） */
function extractText(richText: string): string {
  if (!richText || typeof richText !== "string") return "";
  try {
    const parsed = JSON.parse(richText) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((n: unknown) => (typeof n === "object" && n != null && "text" in n ? (n as { text: string }).text : String(n)))
        .join("");
    }
    if (typeof parsed === "object" && parsed != null && "text" in parsed) return (parsed as { text: string }).text;
  } catch {
    // 非 JSON，当作纯文本
  }
  return richText.replace(/<[^>]+>/g, "").trim();
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const res = await fetch(SINA_HEADLINES_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`sina headlines ${res.status}`);
    const json = (await res.json()) as unknown;
    const list: HeadlineItem[] =
      (json as { result?: { data?: { feed?: { list?: HeadlineItem[] } }; feed?: { list?: HeadlineItem[] } } })?.result?.data?.feed?.list ??
      (json as { result?: { feed?: { list?: HeadlineItem[] } } })?.result?.feed?.list ??
      [];
    const items = list
      .slice(0, 20)
      .map((item) => ({
        time: formatTime(item.create_time),
        text: extractText(item.rich_text),
      }))
      .filter((item) => item.text.length > 0);
    return NextResponse.json({ list: items });
  } catch (e) {
    console.error("headlines api error", e);
    return NextResponse.json({ list: [] });
  }
}
