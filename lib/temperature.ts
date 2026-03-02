import type { MarketSnapshot, TemperatureComponents, TemperatureResult } from "./types";

/** 权重配置：情绪、活跃度、估值 */
export const temperatureWeights = {
  sentiment: 0.5,
  activity: 0.25,
  valuation: 0.25,
};

/** 涨跌家数比 -> 0-100，0.3 偏冷、0.5 中性、0.7 偏热 */
function sentimentFromUpRatio(upRatio: number): number {
  if (upRatio <= 0) return 0;
  if (upRatio >= 1) return 100;
  return Math.round(upRatio * 100);
}

/** 涨停/跌停微调：涨停多加分、跌停多减分，在 ±15 范围内 */
function limitAdjustment(limitUp: number, limitDown: number): number {
  const d = limitUp - limitDown;
  const clamp = Math.max(-15, Math.min(15, d * 0.5));
  return clamp;
}

/** 成交额（元）-> 活跃度 0-100。约 0.5 万亿=25，1 万亿=50，2 万亿=100（线性插值） */
const ACTIVITY_AMOUNT_1E12_LOW = 0.3;
const ACTIVITY_AMOUNT_1E12_HIGH = 2.5;

function activityFromAmount(totalAmount: number): number {
  const t = totalAmount / 1e12;
  if (t <= ACTIVITY_AMOUNT_1E12_LOW) return 0;
  if (t >= ACTIVITY_AMOUNT_1E12_HIGH) return 100;
  return Math.round(((t - ACTIVITY_AMOUNT_1E12_LOW) / (ACTIVITY_AMOUNT_1E12_HIGH - ACTIVITY_AMOUNT_1E12_LOW)) * 100);
}

/** 估值分量：暂无历史分位，固定中性 50 */
function valuationComponent(): number {
  return 50;
}

/** 计算综合温度与组成项 */
export function computeTemperature(snapshot: MarketSnapshot): TemperatureResult {
  const total = snapshot.totalCount || 1;
  const upRatio = snapshot.upCount / total;
  const sentimentRaw = sentimentFromUpRatio(upRatio) + limitAdjustment(snapshot.limitUpCount, snapshot.limitDownCount);
  const sentiment = Math.max(0, Math.min(100, Math.round(sentimentRaw)));
  const activity = activityFromAmount(snapshot.totalAmount);
  const valuation = valuationComponent();

  const w = temperatureWeights;
  const value = Math.round(sentiment * w.sentiment + activity * w.activity + valuation * w.valuation);
  const clamped = Math.max(0, Math.min(100, value));

  let band: "low" | "mid" | "high" = "mid";
  if (clamped <= 30) band = "low";
  else if (clamped >= 70) band = "high";

  const components: TemperatureComponents = { sentiment, activity, valuation };

  return {
    value: clamped,
    components,
    snapshot,
    band,
  };
}
