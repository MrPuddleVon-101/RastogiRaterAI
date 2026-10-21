"""
main.py — FastAPI backend for Stonky.

Wraps the existing scoring/data modules and exposes a single endpoint:
  GET /api/rate?ticker=AVGO

Returns a structured JSON payload consumed by the Next.js frontend.
"""

from __future__ import annotations

import math
import os
import sys
import traceback
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Local module imports (copied alongside this file in backend/)
# ---------------------------------------------------------------------------
from data_fetcher import (
    fetch_stock_data,
    fetch_historical_prices,
    compute_technicals,
    fetch_analyst_extras,
)
from scoring import calculate_overall_score, get_rating_label
from explanations import (
    generate_one_line_verdict,
    get_nuanced_verdict_label,
    generate_rastogi_verdict,
    generate_beginner_verdict,
    generate_key_takeaways,
    generate_score_anatomy,
    generate_metric_table,
    generate_chart_read_text,
)
from tooltips import RICH_TOOLTIPS_BY_DISPLAY
from insights import (
    build_investment_thesis,
    build_economic_moat,
    build_valuation_context,
    build_catalysts,
    build_long_term_thesis_bias,
)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Stonky API", version="1.0.0")

# Local dev origins always work. For a hosted frontend, set ALLOWED_ORIGINS on
# the server to a comma-separated list (e.g. "https://stonky.vercel.app").
# Vercel preview/production subdomains are also allowed by pattern so a fresh
# deploy never needs a backend change.
_LOCAL_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
]
_EXTRA_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_LOCAL_ORIGINS + _EXTRA_ORIGINS,
    allow_origin_regex=r"https://[a-z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe(val: Any) -> Optional[float]:
    """Return float or None — filters NaN/Inf."""
    if val is None:
        return None
    try:
        f = float(val)
        return None if (math.isnan(f) or math.isinf(f)) else f
    except (TypeError, ValueError):
        return None


def _cat_status(score: float, max_score: float) -> tuple[str, str, str]:
    """
    Return (signal_label, signal_arrow, color_key) based on percentage.
    >=80% → Strong / positive
    >=65% → Solid / positive
    >=45% → Mixed / neutral
    >=30% → Pressured / caution
    else  → Weak / negative
    """
    pct = score / max_score if max_score else 0.0
    if pct >= 0.80:
        return "Strong", "↑", "positive"
    if pct >= 0.65:
        return "Solid", "↑", "positive"
    if pct >= 0.45:
        return "Mixed", "→", "neutral"
    if pct >= 0.30:
        return "Pressured", "↓", "caution"
    return "Weak", "↓", "negative"


CATEGORY_META = [
    ("valuation",    "Valuation",         20),
    ("analyst",      "Analyst",           15),
    ("profitability","Profitability",      20),
    ("cashflow",     "Cash Flow & Debt",  20),
    ("technical",    "Technical",         15),
    ("confidence",   "Data Confidence",   10),
]


def _build_category_scores(scores: dict) -> List[dict]:
    result = []
    for key, name, max_score in CATEGORY_META:
        cat = scores[key]
        score = cat["score"]
        signal, arrow, color = _cat_status(score, max_score)
        # Primary reason is first entry in reasons list, or first warning
        reasons = cat.get("reasons", [])
        warnings = cat.get("warnings", [])
        primary_reason = reasons[0] if reasons else (warnings[0] if warnings else "")
        result.append({
            "key": key,
            "name": name,
            "score": score,
            "maxScore": max_score,
            "signal": signal,
            "signalArrow": arrow,
            "color": color,
            "reason": primary_reason,
            "reasons": reasons,
            "warnings": warnings,
        })
    return result


def _build_takeaways(raw: List[tuple]) -> List[dict]:
    """Convert (signal_type, label, text) tuples to dicts."""
    return [{"type": sig, "label": lbl, "text": txt} for sig, lbl, txt in raw]


def _build_metric_evidence(rows: List[dict]) -> List[dict]:
    """Map generate_metric_table rows to the metricEvidence schema."""
    result = []
    for row in rows:
        metric_name = row.get("Metric", "")
        signal_raw = row.get("Signal", "Neutral")
        # Normalise signal to lowercase
        signal = signal_raw.lower()
        # Look up tooltip — try exact metric name, then partial match
        tooltip = RICH_TOOLTIPS_BY_DISPLAY.get(metric_name, "")
        result.append({
            "category": row.get("Category", ""),
            "metric": metric_name,
            "value": row.get("Value", ""),
            "signal": signal,
            "notes": row.get("Notes", ""),
            "tooltip": tooltip,
        })
    return result


def _chart_points(
    history: Optional[pd.DataFrame], days: Optional[int], intraday: bool = False
) -> List[dict]:
    """
    Build chart points for the last `days` calendar days (None = full history),
    including full OHLC (so the frontend can render line OR candlestick views
    and read candle patterns) plus rolling 50/200-day moving averages computed
    over the full history for accuracy. Intraday bars skip the moving averages,
    which are meaningless at that resolution, and keep the time component.
    """
    if history is None or history.empty:
        return []

    df = history.copy()
    df.index = pd.to_datetime(df.index)
    # Flatten MultiIndex columns if present (yfinance sometimes returns them)
    df.columns = [c[0] if isinstance(c, tuple) else c for c in df.columns]

    if "Close" not in df.columns:
        return []

    if not intraday:
        full_closes = df["Close"]
        ma50_series = full_closes.rolling(50).mean()
        ma200_series = full_closes.rolling(200).mean()

    if days is not None:
        cutoff = df.index.max() - pd.Timedelta(days=days)
        sl = df[df.index >= cutoff].copy()
    else:
        sl = df.copy()
    if sl.empty:
        return []

    if not intraday:
        sl["ma50"] = ma50_series.reindex(sl.index)
        sl["ma200"] = ma200_series.reindex(sl.index)

    points = []
    for ts, row in sl.iterrows():
        close_val = _safe(row.get("Close"))
        if close_val is None:
            continue
        open_val = _safe(row.get("Open"))
        high_val = _safe(row.get("High"))
        low_val = _safe(row.get("Low"))
        ma50_val = _safe(row.get("ma50")) if not intraday else None
        ma200_val = _safe(row.get("ma200")) if not intraday else None
        if intraday:
            date_str = ts.strftime("%Y-%m-%d %H:%M") if hasattr(ts, "strftime") else str(ts)[:16]
        else:
            date_str = ts.strftime("%Y-%m-%d") if hasattr(ts, "strftime") else str(ts)[:10]
        points.append({
            "date": date_str,
            "price": round(close_val, 2),
            "open": round(open_val, 2) if open_val is not None else None,
            "high": round(high_val, 2) if high_val is not None else None,
            "low": round(low_val, 2) if low_val is not None else None,
            "close": round(close_val, 2),
            "ma50": round(ma50_val, 2) if ma50_val is not None else None,
            "ma200": round(ma200_val, 2) if ma200_val is not None else None,
        })

    return points


def _build_chart_data(history: Optional[pd.DataFrame]) -> List[dict]:
    """Default 1-year chart window (now enriched with OHLC). Backward compatible."""
    return _chart_points(history, 365)


def _build_chart_read(data: dict, technicals: dict, chart_read_text: str) -> dict:
    cur = technicals.get("current_price") or data.get("current_price")
    hi52 = technicals.get("fifty_two_week_high") or data.get("fifty_two_week_high")
    ma50 = technicals.get("fifty_day_ma") or data.get("fifty_day_ma")
    ma200 = technicals.get("two_hundred_day_ma") or data.get("two_hundred_day_ma")

    # vs 52W High
    if cur and hi52 and hi52 > 0:
        gap = (hi52 - cur) / cur
        if gap < 0:
            vs_hi = "Above 52W high"
        else:
            vs_hi = f"{gap * 100:.1f}% below"
    else:
        vs_hi = "N/A"

    # vs MAs
    vs_50 = "N/A"
    if cur and ma50:
        vs_50 = "Above" if cur > ma50 else "Below"

    vs_200 = "N/A"
    if cur and ma200:
        vs_200 = "Above" if cur > ma200 else "Below"

    return {
        "vs52WeekHigh": vs_hi,
        "vs50DayMA": vs_50,
        "vs200DayMA": vs_200,
        "summary": chart_read_text,
        "hi52Value": _safe(hi52),
    }


_RECOMMENDATION_LABELS = {
    "strong_buy": "Strong Buy",
    "buy": "Buy",
    "hold": "Hold",
    "underperform": "Underperform",
    "sell": "Sell",
}


def _build_analyst_consensus(data: dict, extras: dict) -> dict:
    """
    Structured analyst view for the consensus card. Only ever reports what the
    data source actually provides; missing pieces stay None and the frontend
    shows a fallback instead of fake numbers.
    """
    label = _RECOMMENDATION_LABELS.get(
        (data.get("analyst_recommendation") or "").lower().replace("-", "_")
    )
    count = data.get("analyst_count")
    mean = _safe(data.get("analyst_target_mean"))
    low = _safe(data.get("analyst_target_low"))
    high = _safe(data.get("analyst_target_high"))
    counts = extras.get("recommendation_counts")

    available = bool(label or count or mean)
    result = {
        "available": available,
        "label": label,
        "analystCount": int(count) if count else None,
        "targetLow": low,
        "targetMean": mean,
        "targetHigh": high,
        "currentPrice": _safe(data.get("current_price")),
        "counts": None,
    }
    if counts:
        result["counts"] = {
            "bullish": counts.get("strongBuy", 0) + counts.get("buy", 0),
            "neutral": counts.get("hold", 0),
            "bearish": counts.get("sell", 0) + counts.get("strongSell", 0),
        }
    return result


def _build_earnings_history(extras: dict) -> dict:
    """Quarterly EPS estimate vs actual. Beat/miss/match derived, never invented."""
    quarters = extras.get("earnings_quarters")
    if not quarters:
        return {"available": False, "quarters": []}

    out = []
    for q in quarters:
        est = q.get("epsEstimate")
        act = q.get("epsActual")
        result = None
        if est is not None and act is not None:
            if act > est * 1.001 + 1e-9:
                result = "beat"
            elif act < est * 0.999 - 1e-9:
                result = "miss"
            else:
                result = "match"
        out.append({
            "period": q.get("period"),
            "epsEstimate": est,
            "epsActual": act,
            "surprisePct": q.get("surprisePct"),
            "result": result,
        })
    # chronological order, oldest first, for the timeline read
    out.sort(key=lambda q: q.get("period") or "")
    return {"available": True, "quarters": out[-8:]}


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@app.get("/api/rate")
async def rate_stock(ticker: str = Query(..., min_length=1, max_length=24)):
    """
    Analyse a stock ticker and return the full Stonky scoring payload.
    """
    ticker = ticker.strip().upper()

    try:
        # 1. Fetch fundamental data
        data = fetch_stock_data(ticker)
        if "error" in data:
            raise HTTPException(
                status_code=400,
                detail={"detail": data["error"], "ticker": ticker},
            )

        # 2. Fetch historical prices
        history = fetch_historical_prices(ticker)

        # 3. Compute technicals
        technicals = compute_technicals(data, history)

        # 4. Score
        scores = calculate_overall_score(data, technicals, None)

        # 5. Narrative generation
        one_line = generate_one_line_verdict(scores, data)
        nuanced_label = get_nuanced_verdict_label(scores, data)
        rastogi_analyst = generate_rastogi_verdict(scores, data, technicals)
        rastogi_beginner = generate_beginner_verdict(scores, data)
        takeaways_raw = generate_key_takeaways(scores, data, technicals)
        anatomy = generate_score_anatomy(scores, data, technicals)
        metric_rows = generate_metric_table(data, scores, technicals)
        chart_read_text = generate_chart_read_text(data, technicals)

        # 6. Build structured response
        overall_score = int(round(scores["total"]))
        rating_label = get_rating_label(overall_score)
        data_confidence = int(scores["confidence"]["score"])

        category_scores = _build_category_scores(scores)
        takeaways = _build_takeaways(takeaways_raw)
        metric_evidence = _build_metric_evidence(metric_rows)
        chart_data = _build_chart_data(history)
        chart_read = _build_chart_read(data, technicals, chart_read_text)

        # 6b. Derived analysis layers (additive, backward compatible)
        investment_thesis = build_investment_thesis(data, scores, technicals)
        economic_moat = build_economic_moat(data, scores)
        valuation_context = build_valuation_context(data, scores)
        catalysts = build_catalysts(data, scores, technicals)
        long_term_bias = build_long_term_thesis_bias(data, scores)

        # 6c. Analyst consensus + earnings history (best effort, never faked)
        extras = fetch_analyst_extras(ticker)
        analyst_consensus = _build_analyst_consensus(data, extras)
        earnings_history = _build_earnings_history(extras)

        # Note when key fields are missing (common for some non-US tickers)
        missing_fields = []
        if data.get("analyst_target_mean") is None and data.get("analyst_count") is None:
            missing_fields.append("analyst")
        if data.get("free_cash_flow") is None:
            missing_fields.append("cash flow")
        data_note = ""
        if missing_fields:
            data_note = (
                f"Some {' and '.join(missing_fields)} data is unavailable for this ticker, so the score "
                "relies more on the metrics that are present. Data confidence reflects this."
            )

        response = {
            "ticker": data.get("ticker", ticker),
            "companyName": data.get("company_name", ticker),
            "sector": data.get("sector"),
            "industry": data.get("industry"),
            "currentPrice": _safe(data.get("current_price")),
            "marketCap": _safe(data.get("market_cap")),
            "currency": data.get("currency") or "USD",
            "overallScore": overall_score,
            "ratingLabel": rating_label,
            "nuancedLabel": nuanced_label,
            "dataConfidence": data_confidence,
            "oneLineVerdict": one_line,
            "rastogiVerdictAnalyst": rastogi_analyst,
            "rastogiVerdictBeginner": rastogi_beginner,
            "categoryScores": category_scores,
            "takeaways": takeaways,
            "drivers": anatomy.get("positives", []),
            "drags": anatomy.get("negatives", []),
            "neutral": anatomy.get("neutrals", []),
            "metricEvidence": metric_evidence,
            "chartData": chart_data,
            "chartRead": chart_read,
            "warnings": (
                scores["confidence"].get("warnings", [])
            ),
            # New analysis layers (additive)
            "longTermThesisBias": long_term_bias,
            "analystConsensus": analyst_consensus,
            "earningsHistory": earnings_history,
            "investmentThesis": investment_thesis,
            "economicMoat": economic_moat,
            "valuationContext": valuation_context,
            "catalysts": catalysts,
            "dataNote": data_note,
        }

        return response

    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={"detail": f"Internal error while analysing {ticker}: {exc}", "ticker": ticker},
        )


# Range -> (window days, yfinance fetch period, optional intraday interval).
# Daily ranges fetch enough history behind the window so the 200-day MA is
# populated across it. Legacy ranges (1M/3M/6M/1Y/5Y) keep their exact old
# behavior, so this endpoint stays backward compatible.
_RANGE_CONF: Dict[str, dict] = {
    "1D":  {"days": None, "period": "1d",  "interval": "5m"},
    "5D":  {"days": None, "period": "5d",  "interval": "30m"},
    "1M":  {"days": 31,   "period": "2y",  "interval": None},
    "3M":  {"days": 93,   "period": "2y",  "interval": None},
    "6M":  {"days": 186,  "period": "2y",  "interval": None},
    "YTD": {"days": -1,   "period": "2y",  "interval": None},  # days computed per request
    "1Y":  {"days": 365,  "period": "2y",  "interval": None},
    "5Y":  {"days": 1825, "period": "5y",  "interval": None},
    "MAX": {"days": None, "period": "max", "interval": None},
}


def _ytd_days() -> int:
    from datetime import date
    today = date.today()
    return max((today - date(today.year, 1, 1)).days, 1)


@app.get("/api/chart")
async def chart(
    ticker: str = Query(..., min_length=1, max_length=24),
    range: str = Query("1Y"),
):
    """
    Optional, backward-compatible endpoint that returns OHLC + moving-average
    chart points for a requested range. Used by the frontend when the user
    switches the chart range or the line/candlestick view. The main /api/rate
    endpoint is unchanged and already ships the default 1Y window.
    """
    ticker = ticker.strip().upper()
    rng = range.strip().upper()
    conf = _RANGE_CONF.get(rng, _RANGE_CONF["1Y"])
    days = _ytd_days() if conf["days"] == -1 else conf["days"]
    period = conf["period"]
    interval = conf["interval"]

    try:
        history = fetch_historical_prices(ticker, period=period, interval=interval)
        if (history is None or history.empty) and interval:
            # Some tickers lack intraday bars: fall back to recent daily candles
            # rather than failing the request.
            history = fetch_historical_prices(ticker, period="1mo")
            days = 7 if rng == "5D" else 3
            interval = None
        if history is None or history.empty:
            raise HTTPException(
                status_code=400,
                detail={"detail": f'No chart data found for "{ticker}".', "ticker": ticker},
            )
        points = _chart_points(history, days, intraday=bool(interval))
        return {"ticker": ticker, "range": rng, "chartData": points}
    except HTTPException:
        raise
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={"detail": f"Chart error for {ticker}: {exc}", "ticker": ticker},
        )


# Curated fallback so common names resolve instantly even if the live search
# is slow or unavailable. Includes US and international (suffix) tickers.
_CURATED = [
    {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ"},
    {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ"},
    {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ"},
    {"symbol": "TSLA", "name": "Tesla, Inc.", "exchange": "NASDAQ"},
    {"symbol": "AVGO", "name": "Broadcom Inc.", "exchange": "NASDAQ"},
    {"symbol": "AMZN", "name": "Amazon.com, Inc.", "exchange": "NASDAQ"},
    {"symbol": "GOOGL", "name": "Alphabet Inc. (Google)", "exchange": "NASDAQ"},
    {"symbol": "META", "name": "Meta Platforms, Inc.", "exchange": "NASDAQ"},
    {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "exchange": "NYSE"},
    {"symbol": "COST", "name": "Costco Wholesale Corporation", "exchange": "NASDAQ"},
    {"symbol": "NFLX", "name": "Netflix, Inc.", "exchange": "NASDAQ"},
    {"symbol": "BABA", "name": "Alibaba Group Holding", "exchange": "NYSE"},
    {"symbol": "TSM", "name": "Taiwan Semiconductor (TSMC)", "exchange": "NYSE"},
    # India (.NS = NSE)
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "exchange": "NSE India"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "exchange": "NSE India"},
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "exchange": "NSE India"},
    {"symbol": "INFY.NS", "name": "Infosys", "exchange": "NSE India"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "exchange": "NSE India"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "exchange": "NSE India"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "exchange": "NSE India"},
    {"symbol": "ASIANPAINT.NS", "name": "Asian Paints", "exchange": "NSE India"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "exchange": "NSE India"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "exchange": "NSE India"},
    # Other international
    {"symbol": "7203.T", "name": "Toyota Motor", "exchange": "Tokyo"},
    {"symbol": "005930.KS", "name": "Samsung Electronics", "exchange": "Korea"},
    {"symbol": "NESN.SW", "name": "Nestle", "exchange": "Switzerland"},
    {"symbol": "ASML", "name": "ASML Holding", "exchange": "NASDAQ"},
    {"symbol": "MC.PA", "name": "LVMH", "exchange": "Paris"},
    {"symbol": "0700.HK", "name": "Tencent Holdings", "exchange": "Hong Kong"},
]


def _curated_matches(q: str) -> List[dict]:
    ql = q.lower()
    return [c for c in _CURATED if ql in c["name"].lower() or ql in c["symbol"].lower()]


@app.get("/api/search")
async def search(q: str = Query(..., min_length=1, max_length=64)):
    """
    Resolve a company name or partial ticker to candidate symbols. Combines a
    curated list (instant, reliable, includes international suffixes) with a live
    lookup. Always returns a list, never crashes.
    """
    q = q.strip()
    results: List[dict] = _curated_matches(q)
    seen = {r["symbol"] for r in results}

    try:
        import yfinance as yf
        search_obj = yf.Search(q, max_results=8)
        for it in (search_obj.quotes or []):
            if it.get("quoteType") != "EQUITY":
                continue
            sym = it.get("symbol")
            if not sym or sym in seen:
                continue
            seen.add(sym)
            results.append({
                "symbol": sym,
                "name": it.get("shortname") or it.get("longname") or sym,
                "exchange": it.get("exchDisp") or "",
            })
    except Exception:
        # Live search unavailable: curated matches still returned.
        pass

    return {"query": q, "results": results[:10]}


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Stonky API"}
