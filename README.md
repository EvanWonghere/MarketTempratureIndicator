# A股估值温度计与终端看板

基于 Next.js 的 Bloomberg 风格 A 股看板：估值温度、市场情绪、沪深300 走势与 7×24 快讯，数据来自腾讯财经、新浪财经及本地定时计算。

## 功能

- **估值温度计**：0–100° 综合温度（估值分位 70% + 股债利差 ERP 30%），拟物仪表盘展示；核心指标 PE/PB、10Y 国债、ERP
- **市场情绪看板**：涨跌家数、全市场中位数涨跌幅、涨跌比、涨停/跌停、两市成交额；大小盘撕裂度（沪深300 vs 中证1000）警示
- **近 30 日混合图**：左轴温度（三色背景：低估/合理/高估）、右轴沪深300 日 K 收盘价，按日期对齐
- **7×24 A股快讯**：新浪财经直播流，盘中可 60s 自动刷新
- **终端风格 UI**：24 栅格三栏布局、等宽字体、荧光涨跌色、红绿切换、交易状态与盘中智能轮询

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:3000

## 部署（Vercel）

1. 将仓库推送到 GitHub，在 [Vercel](https://vercel.com) 导入项目，Framework 选 Next.js，无需环境变量。
2. 构建命令：`npm run build`；部署后 `/api/dashboard`、`/api/headlines`、`/api/hs300-kline` 等按需请求外部接口。

海外节点请求新浪/腾讯成功率较高；国内本地若遇超时，可部署后访问。

## 数据源

| 用途         | 来源           | 说明 |
|--------------|----------------|------|
| 估值温度     | 本地 `public/valuation.json` | 由 GitHub Actions 每日收盘后运行 `scripts/calc_temperature.py` 更新 |
| 涨跌/成交额  | 腾讯财经       | 全量 A 股行情、两市成交额 |
| 大小盘撕裂度 | 新浪指数       | 沪深300、中证1000 涨跌幅 |
| 沪深300 K 线 | 新浪日 K 接口  | 近 90 交易日，与估值日期对齐 |
| 7×24 快讯    | 新浪财经直播   | `zhibo_id=152` |

## 项目结构（简要）

```
app/
  page.tsx              # 三栏终端布局、顶栏、轮询与数据合并
  api/
    dashboard/          # 看板：腾讯行情 + 新浪指数撕裂度
    headlines/          # 新浪 7×24 快讯
    hs300-kline/        # 新浪沪深300 日 K
components/
  ValuationGauge.tsx    # 估值温度仪表盘
  ValuationCards.tsx    # PE/PB/国债/ERP 2×2
  Dashboard.tsx         # 情绪看板（涨跌/中位数/涨跌停等）
  TemperatureChart.tsx  # 温度 + 沪深300 双轴混合图
  Headlines.tsx         # 快讯列表
lib/
  marketData.ts         # 腾讯行情、新浪指数、中位数与撕裂度
  ColorSchemeContext.tsx # 涨跌红绿切换
scripts/
  calc_temperature.py   # 每日估值温度计算，产出 valuation.json
.github/workflows/
  daily_calc.yml       # 工作日 16:00 北京时定时跑脚本并提交 valuation.json
```

## 技术栈

- Next.js 14 (App Router)、React 18、TypeScript、Tailwind CSS、SWR、Recharts
