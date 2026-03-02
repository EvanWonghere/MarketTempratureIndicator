#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
每日估值温度计 - 离线计算脚本
使用历史估值分位法 + 股债利差法(ERP)，输出 public/valuation.json 供前端静态展示。
依赖: pandas, akshare
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

try:
    import akshare as ak
except ImportError:
    print("请安装 akshare: pip install akshare", file=sys.stderr)
    sys.exit(1)


# --------------- 配置 ---------------
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "public" / "valuation.json"
HISTORY_YEARS = 10
CHART_DAYS = 30
INDEX_NAME = "万得全A"  # 使用全A股估值代表全市场


def get_pe_pb_history() -> pd.DataFrame:
    """获取全A股近 N 年 PE(TTM) 与 PB 历史数据（乐咕乐股）。"""
    # 乐咕乐股：全A股市盈率（TTM/LYR）与市净率
    try:
        pe_df = ak.stock_a_ttm_lyr()
        pb_df = ak.stock_a_all_pb()
    except Exception as e:
        raise RuntimeError(f"获取 PE/PB 数据失败: {e}") from e

    # 统一列名：akshare 可能返回中文或英文列名
    def norm_date(df: pd.DataFrame) -> pd.Series:
        for col in ["date", "日期", "time", "日期时间"]:
            if col in df.columns:
                s = pd.to_datetime(df[col], errors="coerce")
                if s.notna().any():
                    return s.dt.normalize()
        raise ValueError(f"未找到日期列，当前列: {list(df.columns)}")

    def get_pe_series(df: pd.DataFrame) -> pd.Series:
        for col in ["middlePETTM", "市盈率TTM", "pe_ttm", "PE(TTM)", "滚动市盈率"]:
            if col in df.columns:
                return pd.to_numeric(df[col], errors="coerce")
        # 取第一个数值型列（排除日期）
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                return df[col]
        raise ValueError(f"未找到 PE 列，当前列: {list(df.columns)}")

    def get_pb_series(df: pd.DataFrame) -> pd.Series:
        for col in ["middlePB", "equalWeightAveragePB", "市净率", "pb", "PB"]:
            if col in df.columns:
                return pd.to_numeric(df[col], errors="coerce")
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]) and "pe" not in col.lower():
                return df[col]
        raise ValueError(f"未找到 PB 列，当前列: {list(df.columns)}")

    pe_dates = norm_date(pe_df)
    pe_series = get_pe_series(pe_df)
    pb_dates = norm_date(pb_df)
    pb_series = get_pb_series(pb_df)

    pe = pd.DataFrame({"date": pe_dates, "pe": pe_series}).dropna(subset=["pe"])
    pb = pd.DataFrame({"date": pb_dates, "pb": pb_series}).dropna(subset=["pb"])
    pe = pe.sort_values("date").drop_duplicates(subset=["date"], keep="last")
    pb = pb.sort_values("date").drop_duplicates(subset=["date"], keep="last")

    # 按日期合并，取两者都有的交易日
    merged = pd.merge(pe, pb, on="date", how="inner")
    merged = merged.sort_values("date").reset_index(drop=True)

    # 只保留近 10 年
    cutoff = (merged["date"].max() - pd.Timedelta(days=HISTORY_YEARS * 365))
    merged = merged.loc[merged["date"] >= cutoff].copy()
    return merged


def get_bond_yield_10y() -> pd.DataFrame:
    """获取中国 10 年期国债收益率历史（中债），单次请求跨度需 < 1 年，按年分批拉取。"""
    end = datetime.now()
    start = end - timedelta(days=HISTORY_YEARS * 365)
    rows = []
    for year in range(start.year, end.year + 1):
        s = f"{year}0101"
        e = f"{min(year + 1, end.year)}{end.month:02d}{end.day:02d}" if year == end.year else f"{year}1231"
        try:
            df = ak.bond_china_yield(start_date=s, end_date=e)
        except Exception as ex:
            print(f"bond_china_yield {s}-{e} 拉取失败: {ex}", file=sys.stderr)
            continue
        if df is None or df.empty:
            continue
        # 只要「中债国债收益率曲线」的 10 年
        curve = df[df["曲线名称"] == "中债国债收益率曲线"].copy()
        if curve.empty:
            continue
        curve = curve[["日期", "10年"]].rename(columns={"日期": "date", "10年": "rf"})
        curve["date"] = pd.to_datetime(curve["date"], errors="coerce")
        curve = curve.dropna(subset=["date", "rf"])
        rows.append(curve)
    if not rows:
        raise RuntimeError("未获取到任何 10 年期国债收益率数据")
    bond = pd.concat(rows, ignore_index=True)
    bond = bond.dropna(subset=["date", "rf"]).sort_values("date").drop_duplicates(subset=["date"], keep="last")
    return bond


def merge_valuation_with_bond(valuation: pd.DataFrame, bond: pd.DataFrame) -> pd.DataFrame:
    """将估值表与国债收益率按日期对齐（每个估值日取当日或之前最近的 Rf）。"""
    bond = bond[["date", "rf"]].sort_values("date").drop_duplicates(subset=["date"], keep="last")
    valuation = valuation.sort_values("date").reset_index(drop=True)
    merged = pd.merge_asof(
        valuation,
        bond,
        on="date",
        direction="backward",
    )
    return merged


def compute_metrics(df: pd.DataFrame) -> dict:
    """根据合并后的 PE/PB/Rf 计算温度与分位。"""
    df = df.dropna(subset=["pe", "pb", "rf"]).sort_values("date").reset_index(drop=True)
    if len(df) < 2:
        raise RuntimeError("有效估值+国债数据不足，无法计算分位")

    # 百分位：当前值在历史中的位置 (0~1)
    df["p_pe"] = df["pe"].rank(pct=True, method="average")
    df["p_pb"] = df["pb"].rank(pct=True, method="average")
    # 估值温度：越高越贵
    df["t_val"] = (0.5 * df["p_pe"] + 0.5 * df["p_pb"]) * 100

    # ERP = 1/PE - Rf（PE 为倍数，Rf 为百分比如 2.5 表示 2.5%）
    df["rf_pct"] = df["rf"]  # 假设 akshare 返回的已是百分比数值
    df["erp"] = (1.0 / df["pe"]) * 100 - df["rf_pct"]  # 统一为百分比
    df["p_erp"] = df["erp"].rank(pct=True, method="average")
    # ERP 温度：性价比越高(ERP 越高)温度越低，故用 (1 - P_ERP)*100
    df["t_erp"] = (1 - df["p_erp"]) * 100

    df["t_final"] = 0.7 * df["t_val"] + 0.3 * df["t_erp"]

    return df


def build_output(df: pd.DataFrame) -> dict:
    """构建前端所需的 JSON 结构。"""
    df = df.sort_values("date").reset_index(drop=True)
    last = df.iloc[-1]
    # 近 30 个交易日（按 date 去重后取最后 30 条）
    tail = df.drop_duplicates(subset=["date"], keep="last").tail(CHART_DAYS)

    return {
        "updatedAt": datetime.now().isoformat(),
        "indexName": INDEX_NAME,
        "summary": {
            "temperature": round(float(last["t_final"]), 2),
            "pe": round(float(last["pe"]), 4),
            "pePercentile": round(float(last["p_pe"]) * 100, 2),
            "pb": round(float(last["pb"]), 4),
            "pbPercentile": round(float(last["p_pb"]) * 100, 2),
            "bondYield10Y": round(float(last["rf"]), 4),
            "erp": round(float(last["erp"]), 4),
            "erpPercentile": round(float(last["p_erp"]) * 100, 2),
            "tVal": round(float(last["t_val"]), 2),
            "tErp": round(float(last["t_erp"]), 2),
        },
        "history": [
            {
                "date": row["date"].strftime("%Y-%m-%d"),
                "temperature": round(float(row["t_final"]), 2),
                "pe": round(float(row["pe"]), 4),
                "pb": round(float(row["pb"]), 4),
                "erp": round(float(row["erp"]), 4),
                "bondYield10Y": round(float(row["rf"]), 4),
            }
            for _, row in tail.iterrows()
        ],
    }


def main() -> None:
    print("正在获取全A股 PE/PB 历史...")
    valuation = get_pe_pb_history()
    print("正在获取 10 年期国债收益率...")
    bond = get_bond_yield_10y()
    print("合并并计算温度...")
    merged = merge_valuation_with_bond(valuation, bond)
    df = compute_metrics(merged)
    out = build_output(df)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"已写入 {OUTPUT_PATH}")
    print(f"综合温度: {out['summary']['temperature']:.1f} | PE分位: {out['summary']['pePercentile']:.1f}% | PB分位: {out['summary']['pbPercentile']:.1f}%")


if __name__ == "__main__":
    main()
