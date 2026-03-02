import type { MarketSnapshot, TemperatureComponents, TemperatureResult } from "./types";

/**
 * 极简情绪温度 (0–100)：彻底抛弃估值，仅由以下三项加权组成
 * - 大盘广度 40%：(上涨家数 / (上涨+下跌)) * 100
 * - 极端情绪 30%：(涨停 / (涨停+跌停)) * 100，分母为 0 时取 50
 * - 交投热度 30%：[5000亿, 25000亿] 线性映射，≥2.5万亿为 100
 */
const WEIGHT_BREADTH = 0.4;   // 大盘广度 40%
const WEIGHT_EXTREME = 0.3;   // 极端情绪 30%
const WEIGHT_ACTIVITY = 0.3;  // 交投热度 30%

/** 大盘广度 (0-100)：上涨家数 / (上涨+下跌)，不含平盘 */
function breadthScore(upCount: number, downCount: number): number {
  const total = upCount + downCount;
  if (total <= 0) return 50;
  return Math.round((upCount / total) * 100);
}

/** 极端情绪 (0-100)：涨停 / (涨停+跌停)。跌停为 0 时避免除零，按“仅涨停”算 100 */
function extremeScore(limitUp: number, limitDown: number): number {
  const sum = limitUp + limitDown;
  if (sum <= 0) return 50;
  return Math.round((limitUp / sum) * 100);
}

/** 交投热度 (0-100)：5000亿=0分，2.5万亿及以上=100分，中间线性 */
const ACTIVITY_AMOUNT_LOW = 0.5e12;   // 5000 亿
const ACTIVITY_AMOUNT_HIGH = 2.5e12;  // 2.5 万亿

function activityScore(totalAmount: number): number {
  if (totalAmount <= ACTIVITY_AMOUNT_LOW) return 0;
  if (totalAmount >= ACTIVITY_AMOUNT_HIGH) return 100;
  return Math.round(
    ((totalAmount - ACTIVITY_AMOUNT_LOW) / (ACTIVITY_AMOUNT_HIGH - ACTIVITY_AMOUNT_LOW)) * 100
  );
}

export function computeTemperature(snapshot: MarketSnapshot): TemperatureResult {
  const breadth = breadthScore(snapshot.upCount, snapshot.downCount);
  const extreme = extremeScore(snapshot.limitUpCount, snapshot.limitDownCount);
  const activity = activityScore(snapshot.totalAmount);

  const value = Math.round(
    breadth * WEIGHT_BREADTH +
    extreme * WEIGHT_EXTREME +
    activity * WEIGHT_ACTIVITY
  );
  const clamped = Math.max(0, Math.min(100, value));

  let band: "low" | "mid" | "high" = "mid";
  if (clamped <= 30) band = "low";
  else if (clamped >= 70) band = "high";

  const components: TemperatureComponents = {
    sentiment: breadth,
    activity,
    valuation: extreme,
  };

  return {
    value: clamped,
    components,
    snapshot,
    band,
  };
}
