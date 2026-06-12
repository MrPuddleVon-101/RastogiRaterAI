"""
data_fetcher.py — Retrieves stock fundamentals and historical price data via yfinance.
"""

import math
from typing import Any, Dict, Optional

import pandas as pd
import yfinance as yf


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _safe_float(val) -> Optional[float]:
    """Return a valid float or None — handles None, NaN, and Inf cleanly."""
    if val is None:
        return None
    try:
        f = float(val)
        return None if (math.isnan(f) or math.isinf(f)) else f
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def fetch_stock_data(ticker: str) -> Dict[str, Any]:
    """
    Fetch all fundamental, analyst, and snapshot metrics for a given ticker.

    Returns a flat dict of clean values, or a dict with key 'error' if the
    ticker is invalid or data cannot be retrieved.
    """
    ticker = ticker.strip().upper()
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        if not info:
            return {"error": f'No data found for "{ticker}". Verify the ticker symbol and try again.'}

        # Derive a reliable current price (multiple possible fields in yfinance)
        current_price = _safe_float(
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or info.get("previousClose")
        )

        # If even company name is absent the ticker is almost certainly wrong
        company_name = info.get("longName") or info.get("shortName") or ""
        if not company_name and current_price is None:
            return {"error": f'"{ticker}" does not appear to be a valid ticker. Check the symbol and try again.'}

        return {
            # Identity
            "ticker": ticker,
            "company_name": company_name or ticker,
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            # Price / market
            "current_price": current_price,
            "market_cap": _safe_float(info.get("marketCap")),
            "currency": info.get("currency") or "USD",
            # ----- Valuation -----
            "trailing_pe": _safe_float(info.get("trailingPE")),
            "forward_pe": _safe_float(info.get("forwardPE")),
            "price_to_book": _safe_float(info.get("priceToBook")),
            "price_to_sales": _safe_float(info.get("priceToSalesTrailing12Months")),
            # ----- Profitability -----
            "profit_margin": _safe_float(info.get("profitMargins")),
            "operating_margin": _safe_float(info.get("operatingMargins")),
            "roe": _safe_float(info.get("returnOnEquity")),
            "roa": _safe_float(info.get("returnOnAssets")),
            "revenue_growth": _safe_float(info.get("revenueGrowth")),
            "earnings_growth": _safe_float(info.get("earningsGrowth")),
            # ----- Cash flow / debt -----
            "free_cash_flow": _safe_float(info.get("freeCashflow")),
            "operating_cash_flow": _safe_float(info.get("operatingCashflow")),
            "total_debt": _safe_float(info.get("totalDebt")),
            "total_cash": _safe_float(info.get("totalCash")),
            "debt_to_equity": _safe_float(info.get("debtToEquity")),
            "current_ratio": _safe_float(info.get("currentRatio")),
            # ----- Analyst -----
            "analyst_target_mean": _safe_float(info.get("targetMeanPrice")),
            "analyst_target_low": _safe_float(info.get("targetLowPrice")),
            "analyst_target_high": _safe_float(info.get("targetHighPrice")),
            "analyst_recommendation": info.get("recommendationKey"),
            "analyst_count": _safe_float(info.get("numberOfAnalystOpinions")),
            # ----- Technical snapshot -----
            "beta": _safe_float(info.get("beta")),
            "fifty_two_week_high": _safe_float(info.get("fiftyTwoWeekHigh")),
            "fifty_two_week_low": _safe_float(info.get("fiftyTwoWeekLow")),
            "fifty_day_ma": _safe_float(info.get("fiftyDayAverage")),
            "two_hundred_day_ma": _safe_float(info.get("twoHundredDayAverage")),
        }

    except Exception as exc:
        return {"error": f'Failed to retrieve data for "{ticker}": {exc}'}


def fetch_historical_prices(
    ticker: str, period: str = "2y", interval: Optional[str] = None
) -> Optional[pd.DataFrame]:
    """
    Return OHLCV history for a ticker.  We default to 2 years so that
    rolling 200-day MAs can be drawn across a full 1-year chart window.
    Pass an interval (e.g. "5m", "30m") for intraday ranges.
    Returns None on failure or empty result.
    """
    try:
        stock = yf.Ticker(ticker.strip().upper())
        if interval:
            history = stock.history(period=period, interval=interval)
        else:
            history = stock.history(period=period)
        return None if history.empty else history
    except Exception:
        return None


def fetch_analyst_extras(ticker: str) -> Dict[str, Any]:
    """
    Best-effort fetch of analyst recommendation counts and quarterly EPS
    estimate-vs-actual history. Every part is optional: a failure returns
    empty fields rather than raising, and nothing here is ever fabricated.
    """
    out: Dict[str, Any] = {"recommendation_counts": None, "earnings_quarters": None}
    try:
        stock = yf.Ticker(ticker.strip().upper())
    except Exception:
        return out

    # Recommendation counts (strongBuy/buy/hold/sell/strongSell), latest period
    try:
        rec = stock.recommendations_summary
        if rec is not None and not rec.empty:
            row = rec.iloc[0]
            counts = {
                "strongBuy": int(row.get("strongBuy", 0) or 0),
                "buy": int(row.get("buy", 0) or 0),
                "hold": int(row.get("hold", 0) or 0),
                "sell": int(row.get("sell", 0) or 0),
                "strongSell": int(row.get("strongSell", 0) or 0),
            }
            if sum(counts.values()) > 0:
                out["recommendation_counts"] = counts
    except Exception:
        pass

    # Quarterly EPS estimate vs actual
    try:
        eh = stock.earnings_history
        if eh is not None and not eh.empty:
            quarters = []
            for idx, row in eh.iterrows():
                est = _safe_float(row.get("epsEstimate"))
                act = _safe_float(row.get("epsActual"))
                if est is None and act is None:
                    continue
                surprise = _safe_float(row.get("surprisePercent"))
                quarters.append({
                    "period": str(idx)[:10],
                    "epsEstimate": est,
                    "epsActual": act,
                    "surprisePct": surprise,
                })
            if quarters:
                out["earnings_quarters"] = quarters
    except Exception:
        pass

    return out


def compute_technicals(data: Dict[str, Any], history: Optional[pd.DataFrame]) -> Dict[str, Any]:
    """
    Derive momentum and pullback metrics from historical closes.
    Falls back to info-level snapshot values where history is unavailable.
    """
    tech = {
        "current_price": data.get("current_price"),
        "fifty_two_week_high": data.get("fifty_two_week_high"),
        "fifty_two_week_low": data.get("fifty_two_week_low"),
        "fifty_day_ma": data.get("fifty_day_ma"),
        "two_hundred_day_ma": data.get("two_hundred_day_ma"),
        "one_month_high": None,
        "one_month_return": None,
        "three_month_return": None,
        "six_month_return": None,
    }

    if history is None or history.empty:
        return tech

    closes = history["Close"].dropna()
    if closes.empty:
        return tech

    latest = float(closes.iloc[-1])

    # Fill current price from history if info level failed
    if tech["current_price"] is None:
        tech["current_price"] = latest

    # 1-month high (≈21 trading days)
    lookback_1m = min(21, len(closes))
    tech["one_month_high"] = float(closes.iloc[-lookback_1m:].max())

    # Rolling returns
    def _ret(n):
        if len(closes) >= n and float(closes.iloc[-n]) > 0:
            return (latest - float(closes.iloc[-n])) / float(closes.iloc[-n])
        return None

    tech["one_month_return"] = _ret(21)
    tech["three_month_return"] = _ret(63)
    tech["six_month_return"] = _ret(126)

    # Recompute MAs from history if info-level values are absent
    if tech["fifty_day_ma"] is None and len(closes) >= 50:
        tech["fifty_day_ma"] = float(closes.rolling(50).mean().iloc[-1])
    if tech["two_hundred_day_ma"] is None and len(closes) >= 200:
        tech["two_hundred_day_ma"] = float(closes.rolling(200).mean().iloc[-1])

    return tech
