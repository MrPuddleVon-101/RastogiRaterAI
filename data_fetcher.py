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


def fetch_historical_prices(ticker: str, period: str = "2y") -> Optional[pd.DataFrame]:
    """
    Return OHLCV history for a ticker.  We default to 2 years so that
    rolling 200-day MAs can be drawn across a full 1-year chart window.
    Returns None on failure or empty result.
    """
    try:
        stock = yf.Ticker(ticker.strip().upper())
        history = stock.history(period=period)
        return None if history.empty else history
    except Exception:
        return None


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
