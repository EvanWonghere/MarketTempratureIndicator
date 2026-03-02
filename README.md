# A股市场温度计与综合数据看板

基于 Next.js + Vercel Serverless 的零运维市场情绪看板，数据来自东方财富公开接口。

## 功能

- **市场温度**：0–100 综合温度（情绪 + 活跃度 + 估值），拟物温度计展示
- **看板**：涨跌家数、涨跌比、涨停/跌停、两市成交额

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:3000

## 部署到 Vercel

Vercel 服务器多在海外，从其上请求东方财富接口成功率更高；本地若出现「无法连接」可部署后再访问。

### 方式一：通过 GitHub + Vercel 网页（推荐）

1. **初始化 Git 并推送到 GitHub**（若尚未有远程仓库）：
   ```bash
   cd /path/to/MarketTempratureIndicator
   git init
   git add .
   git commit -m "Initial commit"
   ```
   在 [GitHub](https://github.com/new) 新建仓库（如 `MarketTempratureIndicator`），不要勾选 README，然后执行：
   ```bash
   git remote add origin https://github.com/你的用户名/MarketTempratureIndicator.git
   git branch -M main
   git push -u origin main
   ```

2. **在 Vercel 导入项目**：
   - 打开 [vercel.com](https://vercel.com)，用 GitHub 登录
   - 点击 **Add New… → Project**
   - 在列表里选择刚推送的仓库 **MarketTempratureIndicator**，点 **Import**
   - **Framework Preset** 保持 **Next.js**，**Build Command** 保持 `npm run build`，**Output Directory 必须留空**（若填了 `public` 会报 [Missing public directory](https://vercel.com/docs/errors/error-list#missing-public-directory)，Next.js 的输出在 `.next`，由 Vercel 自动识别）
   - 无需配置环境变量，直接点 **Deploy**

3. **等待构建完成**（约 1～2 分钟），Vercel 会给出一个地址，如 `https://market-temprature-indicator-xxx.vercel.app`。打开该地址，若页面不再显示「当前为示例数据」的黄色提示，即表示已成功从东方财富拉取真实数据。

### 方式二：通过 Vercel CLI

1. 安装 CLI 并登录：
   ```bash
   npm i -g vercel
   vercel login
   ```

2. 在项目根目录执行：
   ```bash
   cd /path/to/MarketTempratureIndicator
   vercel
   ```
   按提示选择或创建项目、关联团队，首次会询问项目设置，直接回车用默认即可。完成后会输出预览 URL。

3. 正式上线到生产域名：
   ```bash
   vercel --prod
   ```

### 说明

- 无需环境变量；构建命令为 `npm run build`，输出由 Next.js 默认处理。
- 部署后 API 路由 `/api/temperature`、`/api/dashboard` 在 Vercel 上按需请求东方财富；若仍失败会返回示例数据并带 `isFallback: true`。

## 数据源

1. **东方财富**：全市场涨跌家数、成交额（国内网络通常可用）
2. **新浪财经**：上证/深证指数成交额 + 涨跌幅估算（海外部署时常用作备用，Vercel 上往往可连）
3. **静态示例**：两者均不可用时展示示例数据

## 技术栈

- Next.js 14 (App Router)、React 18、TypeScript、Tailwind CSS、SWR
