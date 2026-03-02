"use client";

/** 综合估值温度 0-100 拟物化仪表盘：冰点区 0-20 / 常温区 40-60 / 沸点区 80-100 */
export function ValuationGauge({
  value,
  loading,
}: {
  value: number;
  loading?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  if (loading) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative w-56 h-32">
          <div className="absolute inset-0 rounded-t-full border-2 border-border bg-surface-muted animate-pulse" style={{ borderBottom: "none" }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-8 w-24 rounded bg-surface-muted animate-pulse" />
        </div>
        <div className="mt-4 h-10 w-20 rounded bg-surface-muted animate-pulse" />
      </div>
    );
  }

  const band =
    clamped <= 20 ? "冰点区" : clamped <= 40 ? "偏低估" : clamped <= 60 ? "估值合理" : clamped <= 80 ? "偏高估" : "沸点区";
  const bandColor =
    clamped <= 20 ? "text-cyan-400"
      : clamped <= 40 ? "text-emerald-400"
      : clamped <= 60 ? "text-zinc-400"
      : clamped <= 80 ? "text-amber-400"
      : "text-rose-400";

  // 上半圆弧：从左 (20,90) 到右 (180,90) 经 (100,10)，对应 0～100，全部落在 viewBox 内
  const arcPath = "M 20 90 A 80 80 0 1 1 180 90";
  const arcLength = Math.PI * 80;
  const filledLength = (clamped / 100) * arcLength;
  const needleRotation = 180 * (1 - clamped / 100); // 0°=右(100)，180°=左(0)

  const r = 80;
  const cx = 100;
  const cy = 90;
  const labelInset = 10; // 刻度标签放在弧内侧，避免被裁切

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-40">
        {/* viewBox 留出左右和上边距，保证 0/20/40/60/80/100 完整显示 */}
        <svg viewBox="-12 -2 224 102" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="gauge-fill" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="20%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="80%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          {/* 背景轨道：上半圆 */}
          <path
            d={arcPath}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            style={{ stroke: "#2a2a2e" }}
          />
          {/* 已填充弧（0～value） */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#gauge-fill)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${filledLength} ${arcLength}`}
            strokeDashoffset={0}
            style={{ transition: "stroke-dasharray 0.6s ease-out" }}
          />
          {/* 刻度与数字：沿弧内侧偏移，保证在 viewBox 内 */}
          {[0, 20, 40, 60, 80, 100].map((t) => {
            const ang = Math.PI * (1 - t / 100);
            const x = cx + r * Math.cos(ang);
            const y = cy + r * Math.sin(ang);
            const dx = (x - cx) / r;
            const dy = (y - cy) / r;
            const tx = x - dx * labelInset;
            const ty = y - dy * labelInset;
            return (
              <g key={t}>
                <line x1={x} y1={y} x2={tx} y2={ty} stroke="#52525b" strokeWidth="1.5" />
                <text x={tx} y={ty} fill="#71717a" fontSize="10" textAnchor="middle" dominantBaseline="middle">{t}</text>
              </g>
            );
          })}
          {/* 指针：0 指左，100 指右 */}
          <g transform={`rotate(${needleRotation} 100 90)`}>
            <line x1="100" y1="90" x2="100" y2="24" stroke="#e4e4e7" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="90" r="7" fill="#161618" stroke="#52525b" strokeWidth="1.5" />
          </g>
        </svg>
      </div>

      <div className="mt-2 text-center">
        <span className="text-4xl font-light tabular-nums text-zinc-100">
          {clamped.toFixed(1)}
          <span className="text-xl text-zinc-500 ml-0.5">°</span>
        </span>
        <p className={`mt-1 text-sm font-medium ${bandColor}`}>{band}</p>
      </div>
    </div>
  );
}
