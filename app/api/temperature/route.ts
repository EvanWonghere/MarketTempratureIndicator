import { fetchMarketSnapshot, getFallbackSnapshot } from "@/lib/eastmoney";
import { fetchSinaMarketSnapshot } from "@/lib/sina";
import { computeTemperature } from "@/lib/temperature";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await fetchMarketSnapshot();
    const result = computeTemperature(snapshot);
    return NextResponse.json({ ...result, dataSource: "eastmoney" });
  } catch (e) {
    console.error("eastmoney failed", e);
  }

  try {
    const snapshot = await fetchSinaMarketSnapshot();
    const result = computeTemperature(snapshot);
    return NextResponse.json({ ...result, dataSource: "sina" });
  } catch (e) {
    console.error("sina failed", e);
  }

  const snapshot = getFallbackSnapshot();
  const result = computeTemperature(snapshot);
  return NextResponse.json({
    ...result,
    isFallback: true,
    dataSource: "static",
  });
}
