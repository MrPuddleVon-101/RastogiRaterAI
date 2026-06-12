"""
scoring.py — Transparent, category-by-category scoring logic for Stonky.

Each public function returns a dict containing:
  score        — points awarded
  max_score    — maximum possible for this category
  reasons      — list of human-readable justification strings
  warnings     — list of data quality / caveat strings
  metrics      — raw values that fed the calculation
  components   — individual sub-scores (for transparency)
"""

from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _v(data: dict, key: str, default=None):
    """Safe dict access — returns default if key is absent or value is None."""
    val = data.get(key)
    return default if val is None else val


def _clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


def _pct(score: float, max_score: float) -> float:
    return score / max_score if max_score else 0.0


# ---------------------------------------------------------------------------
# 1. Valuation Score  (max 20)
# ---------------------------------------------------------------------------

def calculate_valuation_score(data: dict) -> dict:
    reasons: List[str] = []
    warnings: List[str] = []
    metrics: dict = {}
    components: dict = {}

    trailing_pe = _v(data, "trailing_pe")
    forward_pe = _v(data, "forward_pe")
    pb = _v(data, "price_to_book")
    ps = _v(data, "price_to_sales")

    # --- P/E component (max 10) ---
    if trailing_pe is not None:
        metrics["trailing_pe"] = trailing_pe
        if trailing_pe < 0:
            pe_score = 1
            reasons.append(f"P/E is negative ({trailing_pe:.1f}×), signalling current losses.")
        elif trailing_pe <= 15:
            pe_score = 10
            reasons.append(f"P/E of {trailing_pe:.1f}× is attractively valued by the model's standards.")
        elif trailing_pe <= 25:
            pe_score = 7
            reasons.append(f"P/E of {trailing_pe:.1f}× is within a reasonable, if not cheap, range.")
        elif trailing_pe <= 40:
            pe_score = 5
            reasons.append(f"P/E of {trailing_pe:.1f}× is elevated. Execution needs to stay clean.")
        elif trailing_pe <= 80:
            pe_score = 3
            reasons.append(f"P/E of {trailing_pe:.1f}× is stretched. The stock is priced for near-perfect delivery.")
        else:
            pe_score = 1
            reasons.append(f"P/E of {trailing_pe:.1f}× is very aggressive pricing. No margin for disappointment.")
    else:
        warnings.append("Trailing P/E unavailable — treated as uncertain valuation.")
        pe_score = 4  # slight below-neutral for uncertainty

    # Forward P/E improvement bonus
    if forward_pe is not None and trailing_pe is not None and trailing_pe > 0 and forward_pe > 0:
        metrics["forward_pe"] = forward_pe
        if forward_pe < trailing_pe * 0.80:
            pe_score = min(10, pe_score + 1)
            reasons.append(
                f"Forward P/E ({forward_pe:.1f}×) is meaningfully below trailing, "
                "suggesting expected earnings improvement."
            )
    elif forward_pe is not None:
        metrics["forward_pe"] = forward_pe

    components["pe_score"] = pe_score

    # --- Price / Sales component (max 5) ---
    if ps is not None:
        metrics["price_to_sales"] = ps
        if ps < 1:
            ps_score = 5
        elif ps < 3:
            ps_score = 4
        elif ps < 6:
            ps_score = 3
        elif ps < 10:
            ps_score = 2
        else:
            ps_score = 1
            reasons.append(f"Price/Sales of {ps:.1f}× is high; needs strong margin support to justify.")
    else:
        warnings.append("Price/Sales unavailable.")
        ps_score = 2  # neutral-ish

    components["ps_score"] = ps_score

    # --- Price / Book component (max 5) ---
    if pb is not None:
        metrics["price_to_book"] = pb
        if pb < 1:
            pb_score = 5
        elif pb < 2:
            pb_score = 4
        elif pb < 4:
            pb_score = 3
        elif pb < 8:
            pb_score = 2
        else:
            pb_score = 1
    else:
        warnings.append("Price/Book unavailable.")
        pb_score = 2

    components["pb_score"] = pb_score

    total = _clamp(pe_score + ps_score + pb_score, 0, 20)
    return {
        "score": total,
        "max_score": 20,
        "reasons": reasons,
        "warnings": warnings,
        "metrics": metrics,
        "components": components,
    }


# ---------------------------------------------------------------------------
# 2. Analyst Expectations Score  (max 15)
# ---------------------------------------------------------------------------

def calculate_analyst_score(data: dict, manual_targets: Optional[Dict[str, float]] = None) -> dict:
    reasons: List[str] = []
    warnings: List[str] = []
    metrics: dict = {}
    components: dict = {}

    current_price = _v(data, "current_price")
    if current_price is None or current_price <= 0:
        warnings.append("Current price unavailable — analyst upside cannot be calculated.")
        return {
            "score": 5,
            "max_score": 15,
            "reasons": reasons,
            "warnings": warnings,
            "metrics": metrics,
            "components": {},
        }

    # --- Determine average target ---
    avg_target = None
    target_count = 0
    dispersion_pct = 0.0
    source = "none"

    if manual_targets:
        valid = {k: v for k, v in manual_targets.items() if v and v > 0}
        if valid:
            vals = list(valid.values())
            avg_target = sum(vals) / len(vals)
            target_count = len(vals)
            if len(vals) > 1:
                dispersion_pct = (max(vals) - min(vals)) / avg_target
            source = "manual"
            metrics["manual_targets"] = valid
            metrics["avg_manual_target"] = round(avg_target, 2)

    if avg_target is None:
        avg_target = _v(data, "analyst_target_mean")
        raw_count = _v(data, "analyst_count")
        target_count = int(raw_count) if raw_count else 0
        source = "consensus"
        if avg_target:
            metrics["analyst_target_mean"] = avg_target
            metrics["analyst_count"] = target_count

    if avg_target is None or avg_target <= 0:
        warnings.append("No analyst price target data available.")
        return {
            "score": 5,
            "max_score": 15,
            "reasons": ["Analyst expectations score is neutral — no target data."],
            "warnings": warnings,
            "metrics": metrics,
            "components": {},
        }

    upside = (avg_target - current_price) / current_price
    metrics["implied_upside_pct"] = round(upside * 100, 1)

    # --- Upside score (max 10) ---
    if upside > 0.30:
        upside_score = 10
        reasons.append(f"Analyst targets imply {upside*100:.0f}% upside — strong consensus expectation.")
    elif upside > 0.20:
        upside_score = 8
        reasons.append(f"Analyst targets imply {upside*100:.0f}% upside.")
    elif upside > 0.10:
        upside_score = 6
        reasons.append(f"Analyst targets imply {upside*100:.0f}% upside — a modest positive signal.")
    elif upside > 0.03:
        upside_score = 4
        reasons.append(f"Analyst targets imply limited upside of {upside*100:.0f}%.")
    elif upside >= 0:
        upside_score = 3
        reasons.append("Analyst targets are barely above current price.")
    elif upside > -0.10:
        upside_score = 2
        reasons.append(f"Analyst targets imply modest downside of {abs(upside)*100:.0f}%.")
    else:
        upside_score = 1
        reasons.append(f"Analyst consensus implies {abs(upside)*100:.0f}% downside — a meaningful negative signal.")

    components["upside_score"] = upside_score

    # --- Coverage depth (max 3) ---
    if target_count >= 20:
        count_score = 3
    elif target_count >= 10:
        count_score = 2
    elif target_count >= 4:
        count_score = 1
    else:
        count_score = 0
        warnings.append(f"Only {target_count} analyst target(s) — low coverage reduces confidence.")

    components["count_score"] = count_score

    # --- Recommendation key (max 2) ---
    rec = (data.get("analyst_recommendation") or "").lower().replace("-", "_").replace(" ", "_")
    if rec in ("strong_buy",):
        rec_score = 2
        reasons.append("Consensus recommendation is Strong Buy.")
    elif rec in ("buy",):
        rec_score = 2
        reasons.append("Consensus recommendation is Buy.")
    elif rec in ("hold",):
        rec_score = 1
    elif rec in ("underperform", "sell", "strong_sell"):
        rec_score = 0
        reasons.append(f"Consensus recommendation is cautious ({rec.replace('_', ' ').title()}).")
    else:
        rec_score = 1  # neutral default
    components["rec_score"] = rec_score

    # --- Dispersion penalty (manual targets only) ---
    disp_penalty = 0
    if source == "manual" and dispersion_pct > 0.30:
        disp_penalty = 1
        warnings.append(
            f"Analyst target dispersion is {dispersion_pct*100:.0f}% — wide spread reduces confidence."
        )
    components["disp_penalty"] = disp_penalty

    total = _clamp(upside_score + count_score + rec_score - disp_penalty, 0, 15)
    return {
        "score": total,
        "max_score": 15,
        "reasons": reasons,
        "warnings": warnings,
        "metrics": metrics,
        "components": components,
    }


# ---------------------------------------------------------------------------
# 3. Profitability Score  (max 20)
# ---------------------------------------------------------------------------

def calculate_profitability_score(data: dict) -> dict:
    reasons: List[str] = []
    warnings: List[str] = []
    metrics: dict = {}
    components: dict = {}

    pm = _v(data, "profit_margin")
    om = _v(data, "operating_margin")
    roe = _v(data, "roe")
    roa = _v(data, "roa")

    # --- Profit margin (max 8) ---
    if pm is not None:
        metrics["profit_margin_pct"] = round(pm * 100, 1)
        if pm < 0:
            pm_score = 0
            reasons.append(f"Profit margin is negative ({pm*100:.1f}%) — the business is not earning its keep.")
        elif pm < 0.05:
            pm_score = 2
            reasons.append(f"Thin profit margin of {pm*100:.1f}% — meaningful pressure if volumes slip.")
        elif pm < 0.10:
            pm_score = 4
        elif pm < 0.15:
            pm_score = 5
        elif pm < 0.25:
            pm_score = 7
            reasons.append(f"Profit margin of {pm*100:.1f}% is well above average.")
        else:
            pm_score = 8
            reasons.append(f"Profit margin of {pm*100:.1f}% is genuinely strong — most businesses can't sustain this.")
    else:
        warnings.append("Profit margin unavailable.")
        pm_score = 3

    components["pm_score"] = pm_score

    # --- Operating margin (max 4) ---
    if om is not None:
        metrics["operating_margin_pct"] = round(om * 100, 1)
        if om < 0:
            om_score = 0
        elif om < 0.05:
            om_score = 1
        elif om < 0.15:
            om_score = 2
        elif om < 0.25:
            om_score = 3
        else:
            om_score = 4
    else:
        warnings.append("Operating margin unavailable.")
        om_score = 1

    components["om_score"] = om_score

    # --- Return on Equity (max 4) ---
    if roe is not None:
        metrics["roe_pct"] = round(roe * 100, 1)
        if roe < 0:
            roe_score = 0
        elif roe < 0.08:
            roe_score = 1
        elif roe < 0.15:
            roe_score = 2
        elif roe < 0.25:
            roe_score = 3
        else:
            roe_score = 4
    else:
        warnings.append("Return on Equity unavailable.")
        roe_score = 1

    components["roe_score"] = roe_score

    # --- Return on Assets (max 4) ---
    if roa is not None:
        metrics["roa_pct"] = round(roa * 100, 1)
        if roa < 0:
            roa_score = 0
        elif roa < 0.03:
            roa_score = 1
        elif roa < 0.08:
            roa_score = 2
        elif roa < 0.15:
            roa_score = 3
        else:
            roa_score = 4
    else:
        warnings.append("Return on Assets unavailable.")
        roa_score = 1

    components["roa_score"] = roa_score

    total = _clamp(pm_score + om_score + roe_score + roa_score, 0, 20)
    return {
        "score": total,
        "max_score": 20,
        "reasons": reasons,
        "warnings": warnings,
        "metrics": metrics,
        "components": components,
    }


# ---------------------------------------------------------------------------
# 4. Cash Flow and Debt Score  (max 20)
# ---------------------------------------------------------------------------

def calculate_cashflow_debt_score(data: dict) -> dict:
    reasons: List[str] = []
    warnings: List[str] = []
    metrics: dict = {}
    components: dict = {}

    fcf = _v(data, "free_cash_flow")
    ocf = _v(data, "operating_cash_flow")
    debt = _v(data, "total_debt")
    cash = _v(data, "total_cash")
    dte = _v(data, "debt_to_equity")
    cr = _v(data, "current_ratio")

    # --- Free cash flow (max 6) ---
    if fcf is not None:
        metrics["free_cash_flow"] = fcf
        if fcf > 5e9:
            fcf_score = 6
            reasons.append("Free cash flow is substantial — the business is a genuine cash generator.")
        elif fcf > 1e9:
            fcf_score = 5
        elif fcf > 0:
            fcf_score = 4
            reasons.append("Free cash flow is positive — the business is self-funding.")
        elif fcf > -5e8:
            fcf_score = 2
            reasons.append("Free cash flow is modestly negative — not alarming but worth monitoring.")
        else:
            fcf_score = 0
            reasons.append("Free cash flow is meaningfully negative — the business burns cash.")
    else:
        warnings.append("Free cash flow data unavailable.")
        fcf_score = 2

    components["fcf_score"] = fcf_score

    # --- Operating cash flow (max 4) ---
    if ocf is not None:
        metrics["operating_cash_flow"] = ocf
        if ocf > 0:
            ocf_score = 4 if ocf > 1e9 else 3
        else:
            ocf_score = 0
            reasons.append("Negative operating cash flow is a structural concern.")
    else:
        warnings.append("Operating cash flow unavailable.")
        ocf_score = 1

    components["ocf_score"] = ocf_score

    # --- Debt/Equity (max 5) ---
    if dte is not None:
        metrics["debt_to_equity"] = round(dte, 2)
        # Note: yfinance returns D/E as a ratio (e.g., 0.5 = 50%)
        if dte < 0:
            dte_score = 1  # negative equity (technically possible, treated cautiously)
        elif dte < 50:
            dte_score = 5
        elif dte < 100:
            dte_score = 4
        elif dte < 200:
            dte_score = 3
        elif dte < 400:
            dte_score = 2
        else:
            dte_score = 1
            reasons.append(f"Debt/Equity of {dte:.0f}% is elevated — a structural constraint.")
    else:
        warnings.append("Debt/Equity ratio unavailable.")
        dte_score = 2

    components["dte_score"] = dte_score

    # --- Cash vs Debt cushion (max 3) ---
    if debt is not None and cash is not None:
        metrics["total_debt"] = debt
        metrics["total_cash"] = cash
        net_debt = debt - cash
        if cash >= debt:
            cushion_score = 3
            reasons.append("Net cash position: the company holds more cash than debt.")
        elif net_debt < debt * 0.5:
            cushion_score = 2
        else:
            cushion_score = 1
            reasons.append("Debt exceeds cash reserves — relies on cash generation to service obligations.")
    elif debt is not None:
        metrics["total_debt"] = debt
        cushion_score = 1
        warnings.append("Cash data unavailable; debt cushion assessment is limited.")
    elif cash is not None:
        metrics["total_cash"] = cash
        cushion_score = 2
        warnings.append("Debt data unavailable.")
    else:
        warnings.append("Both cash and debt data unavailable.")
        cushion_score = 1

    components["cushion_score"] = cushion_score

    # --- Current ratio (max 2) ---
    if cr is not None:
        metrics["current_ratio"] = round(cr, 2)
        if cr >= 2.0:
            cr_score = 2
        elif cr >= 1.5:
            cr_score = 2
        elif cr >= 1.0:
            cr_score = 1
        else:
            cr_score = 0
            reasons.append(f"Current ratio of {cr:.2f} is below 1 — short-term liquidity pressure.")
    else:
        warnings.append("Current ratio unavailable.")
        cr_score = 1

    components["cr_score"] = cr_score

    total = _clamp(fcf_score + ocf_score + dte_score + cushion_score + cr_score, 0, 20)
    return {
        "score": total,
        "max_score": 20,
        "reasons": reasons,
        "warnings": warnings,
        "metrics": metrics,
        "components": components,
    }


# ---------------------------------------------------------------------------
# 5. Technical Position Score  (max 15)
# ---------------------------------------------------------------------------

def calculate_technical_score(data: dict, technicals: dict) -> dict:
    reasons: List[str] = []
    warnings: List[str] = []
    metrics: dict = {}
    components: dict = {}

    price = technicals.get("current_price") or data.get("current_price")
    hi52 = technicals.get("fifty_two_week_high") or data.get("fifty_two_week_high")
    lo52 = technicals.get("fifty_two_week_low") or data.get("fifty_two_week_low")
    ma50 = technicals.get("fifty_day_ma") or data.get("fifty_day_ma")
    ma200 = technicals.get("two_hundred_day_ma") or data.get("two_hundred_day_ma")
    hi1m = technicals.get("one_month_high")
    ret1m = technicals.get("one_month_return")

    if price is None or price <= 0:
        warnings.append("Price data unavailable — technical score is neutral.")
        return {
            "score": 7,
            "max_score": 15,
            "reasons": ["Technical score is neutral due to missing price data."],
            "warnings": warnings,
            "metrics": metrics,
            "components": {},
        }

    metrics["current_price"] = price

    # --- 52-week high gap (max 5) ---
    if hi52 is not None and hi52 > 0:
        metrics["fifty_two_week_high"] = hi52
        gap = (hi52 - price) / price  # positive means price is below high
        metrics["gap_from_52w_high_pct"] = round(gap * 100, 1)
        if gap < 0:
            # Above 52-week high — strong momentum
            hi52_score = 3
            reasons.append("Stock is trading above its 52-week high — very strong momentum, limited historical cushion.")
        elif gap < 0.10:
            hi52_score = 3
            reasons.append(f"Stock is near its 52-week high ({gap*100:.0f}% below) — strong short-term momentum.")
        elif gap < 0.20:
            hi52_score = 3
        elif gap <= 0.30:
            hi52_score = 5
            reasons.append(
                f"Stock sits {gap*100:.0f}% below its 52-week high — a pullback zone the model treats favourably. "
                "Price has cooled without structural collapse."
            )
        elif gap <= 0.50:
            hi52_score = 3
            reasons.append(
                f"Stock is {gap*100:.0f}% below its 52-week high — deeper discount, but the model notes this "
                "can reflect real deterioration rather than mispricing."
            )
        else:
            hi52_score = 1
            reasons.append(
                f"Stock has fallen {gap*100:.0f}% from its 52-week high — this level of drawdown "
                "requires strong fundamental support before the model rewards it."
            )
    else:
        warnings.append("52-week high unavailable.")
        hi52_score = 2

    components["hi52_score"] = hi52_score

    # --- 1-month pullback context (max 3) ---
    if hi1m is not None and hi1m > 0:
        metrics["one_month_high"] = hi1m
        ratio = hi1m / price if price > 0 else 1
        metrics["one_month_high_ratio"] = round(ratio, 3)
        if ratio < 1.0:
            pullback_score = 1
        elif ratio < 1.07:
            pullback_score = 1
            reasons.append("Stock is very close to its recent 1-month high — limited near-term margin of recovery.")
        elif ratio <= 1.10:
            pullback_score = 3
            reasons.append(
                f"Stock is {(ratio-1)*100:.0f}% below its recent 1-month high — a measured near-term pullback."
            )
        elif ratio <= 1.25:
            pullback_score = 2
        else:
            pullback_score = 1
    else:
        warnings.append("1-month high data unavailable.")
        pullback_score = 1

    components["pullback_score"] = pullback_score

    # --- Moving averages (max 5) ---
    above_50 = ma50 is not None and price > ma50
    above_200 = ma200 is not None and price > ma200
    golden_cross = ma50 is not None and ma200 is not None and ma50 > ma200

    if ma50 is not None:
        metrics["fifty_day_ma"] = round(ma50, 2)
    if ma200 is not None:
        metrics["two_hundred_day_ma"] = round(ma200, 2)

    if ma50 is None and ma200 is None:
        warnings.append("Moving average data unavailable.")
        ma_score = 2
    elif above_50 and above_200 and golden_cross:
        ma_score = 5
        reasons.append(
            "Price sits above both the 50-day and 200-day moving averages, and the shorter average "
            "is above the longer — trend structure is intact."
        )
    elif above_50 and above_200:
        ma_score = 4
    elif above_200 and not above_50:
        ma_score = 3
    elif above_50 and not above_200:
        ma_score = 2
    else:
        ma_score = 1
        if ma50 is not None and ma200 is not None and ma50 < ma200:
            reasons.append(
                "Price is below both moving averages and the short-term average is below the "
                "long-term average — the technical structure is under pressure."
            )
        else:
            reasons.append("Price is below key moving averages — technical backdrop is not supportive.")

    components["ma_score"] = ma_score

    # --- Short-term momentum (max 2) ---
    if ret1m is not None:
        metrics["one_month_return_pct"] = round(ret1m * 100, 1)
        if ret1m > 0.07:
            mom_score = 2
        elif ret1m > 0.01:
            mom_score = 1
        elif ret1m > -0.05:
            mom_score = 0
        else:
            mom_score = 0
    else:
        warnings.append("1-month return data unavailable.")
        mom_score = 1

    components["mom_score"] = mom_score

    total = _clamp(hi52_score + pullback_score + ma_score + mom_score, 0, 15)
    return {
        "score": total,
        "max_score": 15,
        "reasons": reasons,
        "warnings": warnings,
        "metrics": metrics,
        "components": components,
    }


# ---------------------------------------------------------------------------
# 6. Data Confidence Score  (max 10)
# ---------------------------------------------------------------------------

def calculate_data_confidence_score(data: dict, technicals: dict) -> dict:
    reasons: List[str] = []
    warnings: List[str] = []
    missing: List[str] = []
    deductions: dict = {}

    score = 10

    def _penalise(field_label: str, points: int):
        nonlocal score
        score -= points
        missing.append(field_label)
        deductions[field_label] = points

    # Fundamental data checks
    if data.get("trailing_pe") is None and data.get("forward_pe") is None:
        _penalise("P/E Ratios", 1)
    if data.get("profit_margin") is None and data.get("operating_margin") is None:
        _penalise("Profitability Margins", 1)
    if data.get("roe") is None and data.get("roa") is None:
        _penalise("Return Metrics (ROE/ROA)", 1)
    if data.get("free_cash_flow") is None and data.get("operating_cash_flow") is None:
        _penalise("Cash Flow Data", 1)
    if data.get("total_debt") is None:
        _penalise("Debt Data", 1)
    if data.get("analyst_target_mean") is None:
        _penalise("Analyst Target Price", 1)
    if data.get("price_to_book") is None:
        _penalise("Price/Book Ratio", 0)  # minor; no deduction
    if data.get("fifty_two_week_high") is None:
        _penalise("52-Week High", 1)

    # Historical price checks
    if technicals.get("one_month_return") is None:
        _penalise("1-Month Price History", 1)

    total = _clamp(score, 0, 10)

    if total < 6:
        warnings.append(
            "Data quality is limited. This score is based on available indicators only "
            "and should be interpreted with caution."
        )
    elif total < 8:
        warnings.append("Several data points are unavailable. Score reliability is moderately reduced.")

    return {
        "score": total,
        "max_score": 10,
        "reasons": reasons,
        "warnings": warnings,
        "missing_fields": missing,
        "deductions": deductions,
    }


# ---------------------------------------------------------------------------
# Overall aggregation
# ---------------------------------------------------------------------------

def calculate_overall_score(
    data: dict,
    technicals: dict,
    manual_targets: Optional[Dict[str, float]] = None,
) -> dict:
    """
    Run all six scoring functions and return a consolidated results dict.
    """
    val = calculate_valuation_score(data)
    analyst = calculate_analyst_score(data, manual_targets)
    prof = calculate_profitability_score(data)
    cf = calculate_cashflow_debt_score(data)
    tech = calculate_technical_score(data, technicals)
    conf = calculate_data_confidence_score(data, technicals)

    total = val["score"] + analyst["score"] + prof["score"] + cf["score"] + tech["score"] + conf["score"]
    total = _clamp(total, 0, 100)

    return {
        "total": total,
        "valuation": val,
        "analyst": analyst,
        "profitability": prof,
        "cashflow": cf,
        "technical": tech,
        "confidence": conf,
    }


def get_rating_label(score: float) -> str:
    if score >= 85:
        return "Elite"
    elif score >= 70:
        return "Strong"
    elif score >= 55:
        return "Mixed"
    elif score >= 40:
        return "Weak"
    else:
        return "High Risk"
