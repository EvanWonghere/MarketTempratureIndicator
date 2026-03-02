import { fetchMarketSnapshotWithMeta, getFallbackSnapshot } from "@/lib/marketData";
import { computeTemperature } from "@/lib/temperature";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { snapshot, degraded } = await fetchMarketSnapshotWithMeta();
    const result = computeTemperature(snapshot);
    return NextResponse.json({
      ...result,
      dataSource: "market",
      ...(degraded && { isDegraded: true }),
    });
  } catch (e) {
    console.error("market data failed", e);
    const snapshot = getFallbackSnapshot();
    const result = computeTemperature(snapshot);
    return NextResponse.json({
      ...result,
      isFallback: true,
      dataSource: "static",
    });
  }
}
