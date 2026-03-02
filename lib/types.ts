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
  /** 全市场中位数涨跌幅（%）保留两位小数 */
  medianChange?: number;
  /** 沪深300 当日涨跌幅（%） */
  hs300Change?: number;
  /** 中证1000 当日涨跌幅（%） */
  zz1000Change?: number;
  /** 大小盘撕裂度绝对值 */
  divergence?: number;
  /** 是否极度分化（撕裂度 >= 1.5%） */
  isDivergent?: boolean;
}

/** 温度计算组成项（短线情绪三维度） */
export interface TemperatureComponents {
  /** 大盘广度 0-100：上涨/(上涨+下跌) */
  sentiment: number;
  /** 交投热度 0-100：成交额线性映射 */
  activity: number;
  /** 极端情绪 0-100：涨停/(涨停+跌停) */
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
  /** 数据来源：market=腾讯+网易，static=静态示例 */
  dataSource?: "market" | "static";
  /** 为 true 时表示仅使用腾讯成交额，涨跌/涨跌停为降级默认值 */
  isDegraded?: boolean;
}

/** 看板 API 返回 */
export interface DashboardData {
  snapshot: MarketSnapshot;
  /** 涨跌家数比 0-1 */
  upRatio: number;
  /** 连板高度（若有，否则 null） */
  maxContinuousBoard: number | null;
}

// --------------- 估值温度计（每日定时 / valuation.json）---------------

export interface ValuationSummary {
  temperature: number;
  pe: number;
  pePercentile: number;
  pb: number;
  pbPercentile: number;
  bondYield10Y: number;
  erp: number;
  erpPercentile: number;
  tVal: number;
  tErp: number;
}

export interface ValuationHistoryPoint {
  date: string;
  temperature: number;
  pe: number;
  pb: number;
  erp: number;
  bondYield10Y: number;
  /** 沪深300 指数（可选，用于双轴混合图） */
  hs300Price?: number;
  /** 上证指数（可选，用于双轴混合图） */
  shanghaiIndex?: number;
}

export interface ValuationData {
  updatedAt: string;
  indexName: string;
  summary: ValuationSummary;
  history: ValuationHistoryPoint[];
}
