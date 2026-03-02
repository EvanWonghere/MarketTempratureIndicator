/** 看板原始数据：涨跌家数、涨停跌停、成交额等 */
export interface MarketSnapshot {
  /** 上涨家数 */
  upCount: number;
  /** 下跌家数 */
  downCount: number;
  /** 平盘家数 */
  flatCount: number;
  /** 涨停家数 */
  limitUpCount: number;
  /** 跌停家数 */
  limitDownCount: number;
  /** 两市总成交额（元） */
  totalAmount: number;
  /** 总股票数（用于计算涨跌比） */
  totalCount: number;
  /** 数据时间戳（毫秒） */
  timestamp: number;
}

/** 温度计算组成项（便于调试与展示） */
export interface TemperatureComponents {
  /** 情绪分量 0-100 */
  sentiment: number;
  /** 活跃度分量 0-100 */
  activity: number;
  /** 估值分量 0-100（可选，无数据时为 50） */
  valuation: number;
}

/** 温度 API 返回 */
export interface TemperatureResult {
  /** 综合温度 0-100 */
  value: number;
  components: TemperatureComponents;
  snapshot: MarketSnapshot;
  /** 温度带：低估 / 中估 / 高估 */
  band: "low" | "mid" | "high";
  /** 为 true 时表示数据源不可用，当前为示例数据 */
  isFallback?: boolean;
}

/** 看板 API 返回 */
export interface DashboardData {
  snapshot: MarketSnapshot;
  /** 涨跌家数比 0-1 */
  upRatio: number;
  /** 连板高度（若有，否则 null） */
  maxContinuousBoard: number | null;
}
