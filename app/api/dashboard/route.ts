import { fetchMarketSnapshot } from "@/lib/marketData";
import type { DashboardData } from "@/lib/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await fetchMarketSnapshot();
    const total = snapshot.totalCount || 1;
    const upRatio = snapshot.upCount / total;
    const data: DashboardData = {
      snapshot,
      upRatio,
      maxContinuousBoard: null,
    };
    return NextResponse.json(data);
  } catch (e) {
    console.error("dashboard api error", e);
    return NextResponse.json(
      { error: "数据获取失败", detail: e instanceof Error ? e.message : "" },
      { status: 500 }
    );
  }
}
