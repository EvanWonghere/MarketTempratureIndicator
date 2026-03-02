import { fetchMarketSnapshot, getFallbackSnapshot } from "@/lib/eastmoney";
import { computeTemperature } from "@/lib/temperature";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const snapshot = await fetchMarketSnapshot();
    const result = computeTemperature(snapshot);
    return NextResponse.json(result);
  } catch (e) {
    console.error("temperature api error", e);
    const snapshot = getFallbackSnapshot();
    const result = computeTemperature(snapshot);
    return NextResponse.json({ ...result, isFallback: true });
  }
}
