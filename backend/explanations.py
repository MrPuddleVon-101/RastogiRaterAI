"""
explanations.py — Generates the analyst-style narrative for Stonky.

Tone: sharp, direct, premium. No generic finance-speak.
"""

from typing import Any, Dict, List, Optional
from scoring import get_rating_label


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _pct(score, max_score) -> float:
    return score / max_score if max_score else 0.0


def _fmt_pct(val: Optional[float], decimals: int = 1) -> str:
    if val is None:
        return "N/A"
    return f"{val * 100:.{decimals}f}%"


def _fmt_ratio(val: Optional[float], suffix: str = "×") -> str:
    if val is None:
        return "N/A"
    return f"{val:.1f}{suffix}"


def _fmt_cash(val: Optional[float]) -> str:
    if val is None:
        return "N/A"
    if abs(val) >= 1e12:
        return f"${val/1e12:.2f}T"
    if abs(val) >= 1e9:
        return f"${val/1e9:.2f}B"
    if abs(val) >= 1e6:
        return f"${val/1e6:.1f}M"
    return f"${val:,.0f}"


def _category_pcts(scores: dict) -> dict:
    return {
        "valuation": _pct(scores["valuation"]["score"], 20),
        "analyst": _pct(scores["analyst"]["score"], 15),
        "profitability": _pct(scores["profitability"]["score"], 20),
        "cashflow": _pct(scores["cashflow"]["score"], 20),
        "technical": _pct(scores["technical"]["score"], 15),
        "confidence": _pct(scores["confidence"]["score"], 10),
    }


def _rank_categories(pcts: dict) -> List[str]:
    """Return category names from weakest to strongest."""
    return [k for k, _ in sorted(pcts.items(), key=lambda x: x[1])]


# ---------------------------------------------------------------------------
# One-line verdict
# ---------------------------------------------------------------------------

def generate_one_line_verdict(scores: dict, data: dict) -> str:
    total = scores["total"]
    pcts = _category_pcts(scores)

    val_p = pcts["valuation"]
    prof_p = pcts["profitability"]
    cf_p = pcts["cashflow"]
    tech_p = pcts["technical"]
    analyst_p = pcts["analyst"]
    conf_p = pcts["confidence"]

    if total >= 85:
        if val_p < 0.45:
            return "Elite fundamentals — the price is the only argument against it."
        if tech_p < 0.45:
            return "The numbers are strong. The chart needs to earn its keep."
        return "Strong business, well-priced, and technically intact."

    if total >= 70:
        if val_p < 0.40:
            return "Quality score, not a bargain score."
        if prof_p >= 0.75 and cf_p >= 0.75:
            return "Strong business. Expensive ticket."
        if tech_p >= 0.70:
            return "Good numbers, and the chart is cooperating."
        return "The model likes the business more than the price."

    if total >= 55:
        if prof_p < 0.40:
            return "Momentum is alive. The fundamentals are not fully convinced."
        if val_p < 0.35:
            return "There are numbers here — just not enough cushion in the price."
        if cf_p < 0.40:
            return "Revenue exists. The cash flow story still needs to be built."
        if tech_p < 0.40:
            return "The numbers are passable. The chart is not helping the argument."
        return "Mixed signals. There is a case here, but it is not clean."

    if total >= 40:
        if conf_p < 0.50:
            return "Limited data makes this difficult to assess with any confidence."
        if prof_p < 0.30:
            return "Cheap for a reason."
        if analyst_p >= 0.60:
            return "Analyst optimism is running ahead of the underlying numbers."
        return "The model cannot build conviction from what is available."

    if conf_p < 0.40:
        return "Insufficient data to form a reliable view."
    return "The numbers do not earn the benefit of the doubt."


# ---------------------------------------------------------------------------
# Nuanced verdict label (e.g. "Strong, but valuation is stretched.")
# ---------------------------------------------------------------------------

def get_nuanced_verdict_label(scores: dict, data: dict) -> str:
    base = get_rating_label(scores["total"])
    pcts = _category_pcts(scores)
    ranked = _rank_categories(pcts)
    weakest = ranked[0]

    weakness_phrases = {
        "valuation": "valuation is stretched",
        "profitability": "margins need more work",
        "cashflow": "balance-sheet pressure",
        "technical": "technically under pressure",
        "analyst": "limited analyst conviction",
        "confidence": "data coverage is thin",
    }

    if pcts[weakest] < 0.42:
        return f"{base}, but {weakness_phrases[weakest]}."

    return f"{base}."


# ---------------------------------------------------------------------------
# Full Rastogi Verdict paragraph
# ---------------------------------------------------------------------------

def generate_rastogi_verdict(scores: dict, data: dict, technicals: dict) -> str:
    total = scores["total"]
    company = data.get("company_name", "This company")
    label = get_rating_label(total)
    pcts = _category_pcts(scores)
    ranked = _rank_categories(pcts)
    weakest = ranked[0]
    strongest = ranked[-1]
    conf_p = pcts["confidence"]

    # --- Opening ---
    if label == "High Risk":
        if conf_p < 0.50:
            opening = (
                f"{company} scores High Risk. "
                "Data coverage is too limited to form a reliable view, "
                "and the indicators that are available do not make a positive case."
            )
        else:
            opening = (
                f"{company} scores High Risk. "
                "The available metrics, read together, do not support a constructive position."
            )
    elif label == "Elite":
        opening = (
            f"{company} scores Elite. "
            "The fundamental case holds across multiple dimensions — "
            "this is not one strong metric carrying a weak overall picture."
        )
    elif label == "Strong":
        if pcts["valuation"] < 0.45:
            opening = (
                f"{company} scores Strong. "
                "Business quality is carrying the score. "
                "The price is the constraint, not the business."
            )
        else:
            opening = (
                f"{company} scores Strong. "
                "The fundamentals build a coherent case without obvious gaps."
            )
    elif label == "Mixed":
        opening = (
            f"{company} scores Mixed. "
            "The evidence cuts in both directions — "
            "enough to hold interest, not enough to build conviction."
        )
    else:  # Weak
        opening = (
            f"{company} scores Weak. "
            "The numbers available do not build a clean case."
        )

    # --- Strength paragraph ---
    strength = _get_strength_paragraph(strongest, scores, data)

    # --- Weakness paragraph ---
    if weakest != strongest:
        weakness = _get_weakness_paragraph(weakest, scores, data)
    else:
        weakness = ""

    # --- Technical paragraph ---
    tech_note = _get_technical_paragraph(scores["technical"], technicals, data)

    # --- Closing ---
    closing = _get_closing(total, strongest, weakest, pcts)

    parts = [p for p in [opening, strength, weakness, tech_note, closing] if p]
    return " ".join(parts)


def _get_strength_paragraph(cat: str, scores: dict, data: dict) -> str:
    p = _pct(scores[cat]["score"], {"valuation": 20, "analyst": 15, "profitability": 20, "cashflow": 20, "technical": 15, "confidence": 10}[cat])

    if p < 0.5:
        return ""

    pm = data.get("profit_margin")
    fcf = data.get("free_cash_flow")
    pe = data.get("trailing_pe")

    if cat == "profitability":
        if pm and pm > 0.20:
            return (
                f"Margins are the strongest argument here. "
                f"At {pm*100:.1f}%, the business keeps more of each revenue dollar than most. "
                "That kind of efficiency is harder to sustain than it sounds."
            )
        elif pm and pm > 0.08:
            return (
                "Profitability is the clearest positive in this score. "
                "The business converts revenue into income at a level that supports the overall case."
            )
        return (
            "Profitability is the strongest category here. "
            "The margins are not exceptional, but they are good enough to build on."
        )

    if cat == "cashflow":
        if fcf and fcf > 0:
            return (
                f"The balance sheet is the clearest positive. "
                f"The company generates {_fmt_cash(fcf)} in free cash flow — "
                "enough to fund itself without depending on external capital."
            )
        return (
            "Cash flow and debt are the strongest leg of this score. "
            "The business carries its obligations at a manageable level, "
            "and cash generation, while not exceptional, is not a concern."
        )

    if cat == "valuation":
        if pe and 0 < pe <= 20:
            return (
                f"Valuation provides the main reason for interest. "
                f"At {pe:.1f}× earnings, the stock is not priced for perfection — "
                "there is room for the fundamental story to develop."
            )
        return (
            "Valuation is the most constructive element here. "
            "The stock is not aggressively priced, which lowers the execution bar."
        )

    if cat == "analyst":
        target = data.get("analyst_target_mean")
        price = data.get("current_price")
        if target and price and price > 0:
            upside = (target - price) / price
            return (
                f"Analyst consensus is supportive. "
                f"Targets imply {upside*100:.0f}% upside — a positive signal when backed by adequate coverage."
            )
        return (
            "Analyst expectations are the strongest element here. "
            "The consensus view is constructive, though not a substitute for fundamental quality."
        )

    if cat == "technical":
        return (
            "The technical setup is constructive. "
            "Price holds above key moving averages with a measured pullback from the recent high."
        )

    return ""


def _get_weakness_paragraph(cat: str, scores: dict, data: dict) -> str:
    p = _pct(scores[cat]["score"], {"valuation": 20, "analyst": 15, "profitability": 20, "cashflow": 20, "technical": 15, "confidence": 10}[cat])

    if p > 0.65:
        return ""

    pe = data.get("trailing_pe")
    pm = data.get("profit_margin")
    debt = data.get("total_debt")
    cash = data.get("total_cash")
    fcf = data.get("free_cash_flow")

    if cat == "valuation":
        if pe and pe > 40:
            return (
                f"The problem is price. At {pe:.1f}× earnings, "
                "the market has already priced in a lot of good news. "
                "That leaves limited room for the numbers to disappoint."
            )
        return (
            "Valuation is where this score pulls back. "
            "The stock is not cheap by the measures used here, "
            "and premium pricing raises the bar for execution."
        )

    if cat == "profitability":
        if pm and pm < 0:
            return (
                "The company is currently loss-making. "
                "The investment case depends on future improvement, not current delivery."
            )
        if pm and pm < 0.05:
            return (
                f"Margins are a real weakness. "
                f"At {pm*100:.1f}%, there is limited cushion if volumes slow or costs rise."
            )
        return (
            "Profitability is the weakest leg of this score. "
            "The business is not converting revenue into income convincingly enough."
        )

    if cat == "cashflow":
        if fcf and fcf < 0:
            return (
                "The cash flow picture is a concern. "
                "The business is consuming cash rather than generating it, "
                "which creates dependency on continued financing or improving operations."
            )
        if debt and cash and debt > cash * 2:
            return (
                "Debt meaningfully exceeds cash reserves. "
                "Cash generation is present but working hard to service existing obligations."
            )
        return (
            "Cash flow and debt are the main constraint here. "
            "The business does not yet meet the bar for financial self-sufficiency."
        )

    if cat == "analyst":
        return (
            "Analyst coverage is not providing meaningful support. "
            "Targets are limited, coverage is thin, or consensus is lukewarm — "
            "there is not much signal here either way."
        )

    if cat == "technical":
        return (
            "The technical setup is not helpful. "
            "Price position relative to moving averages and recent highs "
            "does not provide a constructive backdrop. The chart is not making the case."
        )

    if cat == "confidence":
        return (
            "Data coverage is limited. "
            "The score should be treated as directional, not precise."
        )

    return ""


def _get_technical_paragraph(tech_result: dict, technicals: dict, data: dict) -> str:
    tech_score = tech_result["score"]
    tech_max = 15

    price = technicals.get("current_price") or data.get("current_price")
    hi52 = technicals.get("fifty_two_week_high") or data.get("fifty_two_week_high")
    ma50 = technicals.get("fifty_day_ma") or data.get("fifty_day_ma")
    ma200 = technicals.get("two_hundred_day_ma") or data.get("two_hundred_day_ma")

    if price is None:
        return ""

    gap_note = ""
    ma_note = ""

    if hi52 and hi52 > 0 and price > 0:
        gap = (hi52 - price) / price
        if gap < 0:
            gap_note = "The stock is trading above its 52-week high — momentum is strong but historical cushion is limited."
        elif gap < 0.10:
            gap_note = f"The stock is close to its 52-week high, sitting just {gap*100:.0f}% below — short-term momentum is firm."
        elif gap <= 0.20:
            gap_note = f"The stock sits {gap*100:.0f}% below its 52-week high — a modest pullback that keeps the trend intact."
        elif gap <= 0.30:
            gap_note = (
                f"The stock has pulled back {gap*100:.0f}% from its 52-week high. "
                "That range is what the model treats as a measured recovery setup — far enough from the top "
                "to allow room, close enough that the broader story has not broken down."
            )
        elif gap <= 0.50:
            gap_note = (
                f"The stock is {gap*100:.0f}% below its 52-week high — a deeper discount that the model "
                "treats cautiously. The pullback creates apparent room, but deeper drawdowns can reflect "
                "real deterioration rather than temporary mispricing."
            )
        else:
            gap_note = (
                f"The stock has fallen {gap*100:.0f}% from its 52-week high. "
                "A drawdown of this magnitude demands strong fundamental support before the model "
                "treats it as an opportunity rather than a warning."
            )

    if ma50 is not None and ma200 is not None and price is not None:
        above_50 = price > ma50
        above_200 = price > ma200
        golden = ma50 > ma200
        if above_50 and above_200 and golden:
            ma_note = "The moving-average structure is intact: price holds above both the 50-day and 200-day averages, with the shorter average sitting above the longer."
        elif above_50 and above_200:
            ma_note = "Price holds above both the 50-day and 200-day moving averages — a supportive technical backdrop."
        elif above_200:
            ma_note = "Price is below its 50-day moving average but still above the 200-day — the longer-term trend is intact, even as short-term momentum has faded."
        elif above_50:
            ma_note = "Price is above its 50-day average but below the 200-day — short-term momentum is present, but the longer trend structure remains under pressure."
        else:
            ma_note = "Price is below both the 50-day and 200-day moving averages — the technical structure is not providing cover here."
    elif ma50 is None and ma200 is None:
        ma_note = ""

    parts = [p for p in [gap_note, ma_note] if p]
    if not parts:
        return ""

    # Only lowercase the very first item so it flows from "Technically, "
    # Subsequent items are new sentences and keep their own capitalisation
    first = parts[0][0].lower() + parts[0][1:]
    rest  = parts[1:]
    return "Technically, " + " ".join([first] + rest)


def _get_closing(total: float, strongest: str, weakest: str, pcts: dict) -> str:
    label = get_rating_label(total)
    val_p = pcts["valuation"]
    prof_p = pcts["profitability"]
    cf_p = pcts["cashflow"]

    if label == "Elite":
        if val_p >= 0.60:
            return "Quality and reasonable pricing are working together. That combination is not common."
        return "This is a quality-driven score. The fundamentals earn it, and nothing in the data provides a clear reason to walk it back."

    if label == "Strong":
        if val_p < 0.45:
            return "This is a quality score, not a cheap-stock score."
        if prof_p >= 0.70 and cf_p >= 0.70:
            return "The business earns its score on what it produces and how it manages capital."
        return "The evidence leans constructive — not without reservation, but without a decisive reason to dismiss it."

    if label == "Mixed":
        if strongest == "analyst" and prof_p < 0.45:
            return "Analyst optimism is not a substitute for the fundamental progress that would make this a cleaner score."
        return "There is a case here. It is not clean."

    if label == "Weak":
        return "The numbers need more time."

    # High Risk
    return "Caution is more appropriate than conviction at this level."


# ---------------------------------------------------------------------------
# Metric evidence table
# ---------------------------------------------------------------------------

def generate_metric_table(data: dict, scores: dict, technicals: dict) -> List[Dict[str, Any]]:
    """
    Return a list of dicts for rendering the evidence table.
    Each row: Category, Metric, Value, Signal, Notes
    """
    rows = []

    def _row(category, metric, value, signal, notes):
        rows.append({
            "Category": category,
            "Metric": metric,
            "Value": value,
            "Signal": signal,
            "Notes": notes,
        })

    # ---- Valuation ----
    pe = data.get("trailing_pe")
    if pe is not None:
        if pe < 0:
            sig, note = "Negative", "Negative earnings — P/E not meaningful."
        elif pe <= 15:
            sig, note = "Positive", f"Attractively valued at {pe:.1f}×."
        elif pe <= 25:
            sig, note = "Neutral", f"Reasonable multiple at {pe:.1f}×."
        elif pe <= 40:
            sig, note = "Caution", f"Elevated multiple at {pe:.1f}× — less room for error."
        else:
            sig, note = "Negative", f"Stretched at {pe:.1f}×. Priced for near-perfect delivery."
        _row("Valuation", "Trailing P/E", f"{pe:.1f}×", sig, note)

    fpe = data.get("forward_pe")
    if fpe is not None:
        sig = "Positive" if (pe and pe > 0 and fpe < pe * 0.85) else "Neutral"
        _row("Valuation", "Forward P/E", f"{fpe:.1f}×", sig, "Forward consensus estimate." + (" Improvement implied." if sig == "Positive" else ""))

    pb = data.get("price_to_book")
    if pb is not None:
        if pb < 1:
            sig, note = "Positive", "Below book value — rare and often attractive."
        elif pb < 3:
            sig, note = "Neutral", "Reasonable book multiple."
        elif pb < 8:
            sig, note = "Caution", "Premium to book value."
        else:
            sig, note = "Negative", f"High P/B of {pb:.1f}× — depends on asset-light model to justify."
        _row("Valuation", "Price/Book", f"{pb:.1f}×", sig, note)

    ps = data.get("price_to_sales")
    if ps is not None:
        if ps < 2:
            sig, note = "Positive", "Low price/sales multiple."
        elif ps < 5:
            sig, note = "Neutral", "Moderate revenue pricing."
        elif ps < 10:
            sig, note = "Caution", "Elevated revenue multiple — needs strong margins."
        else:
            sig, note = "Negative", f"High P/S of {ps:.1f}× requires exceptional margin expansion."
        _row("Valuation", "Price/Sales", f"{ps:.1f}×", sig, note)

    # ---- Profitability ----
    pm = data.get("profit_margin")
    if pm is not None:
        if pm < 0:
            sig, note = "Negative", "Net loss. Business is not yet earning at the bottom line."
        elif pm < 0.05:
            sig, note = "Caution", f"Thin net margin of {pm*100:.1f}%."
        elif pm < 0.15:
            sig, note = "Neutral", f"Decent net margin of {pm*100:.1f}%."
        elif pm < 0.25:
            sig, note = "Positive", f"Strong net margin of {pm*100:.1f}%."
        else:
            sig, note = "Positive", f"Exceptional net margin of {pm*100:.1f}%."
        _row("Profitability", "Net Profit Margin", f"{pm*100:.1f}%", sig, note)

    om = data.get("operating_margin")
    if om is not None:
        if om < 0:
            sig, note = "Negative", "Operating loss."
        elif om < 0.10:
            sig, note = "Caution", f"Thin operating margin of {om*100:.1f}%."
        else:
            sig, note = "Positive", f"Operating margin of {om*100:.1f}%."
        _row("Profitability", "Operating Margin", f"{om*100:.1f}%", sig, note)

    roe = data.get("roe")
    if roe is not None:
        if roe < 0:
            sig, note = "Negative", "Negative return on equity."
        elif roe < 0.10:
            sig, note = "Caution", f"Modest ROE of {roe*100:.1f}%."
        elif roe < 0.20:
            sig, note = "Positive", f"Solid ROE of {roe*100:.1f}%."
        else:
            sig, note = "Positive", f"Strong ROE of {roe*100:.1f}%."
        _row("Profitability", "Return on Equity", f"{roe*100:.1f}%", sig, note)

    roa = data.get("roa")
    if roa is not None:
        if roa < 0:
            sig, note = "Negative", "Negative return on assets."
        elif roa < 0.05:
            sig, note = "Caution", f"Low ROA of {roa*100:.1f}%."
        else:
            sig, note = "Positive", f"ROA of {roa*100:.1f}%."
        _row("Profitability", "Return on Assets", f"{roa*100:.1f}%", sig, note)

    # ---- Cash Flow / Debt ----
    fcf = data.get("free_cash_flow")
    if fcf is not None:
        if fcf > 0:
            sig, note = "Positive", f"Generates {_fmt_cash(fcf)} in free cash flow."
        else:
            sig, note = "Negative", f"Consumes {_fmt_cash(abs(fcf))} in free cash flow."
        _row("Cash Flow & Debt", "Free Cash Flow", _fmt_cash(fcf), sig, note)

    ocf = data.get("operating_cash_flow")
    if ocf is not None:
        sig = "Positive" if ocf > 0 else "Negative"
        _row("Cash Flow & Debt", "Operating Cash Flow", _fmt_cash(ocf), sig,
             "Cash generated from core operations.")

    debt = data.get("total_debt")
    if debt is not None:
        _row("Cash Flow & Debt", "Total Debt", _fmt_cash(debt), "Neutral", "Gross debt load.")

    cash = data.get("total_cash")
    if cash is not None:
        _row("Cash Flow & Debt", "Total Cash", _fmt_cash(cash), "Neutral", "Liquid reserves.")

    dte = data.get("debt_to_equity")
    if dte is not None:
        if dte < 50:
            sig, note = "Positive", f"Conservative leverage at {dte:.0f}%."
        elif dte < 150:
            sig, note = "Neutral", f"Moderate leverage at {dte:.0f}%."
        else:
            sig, note = "Caution", f"Elevated leverage at {dte:.0f}% — a structural constraint."
        _row("Cash Flow & Debt", "Debt/Equity", f"{dte:.0f}%", sig, note)

    cr = data.get("current_ratio")
    if cr is not None:
        if cr >= 1.5:
            sig, note = "Positive", f"Comfortable short-term liquidity ({cr:.2f})."
        elif cr >= 1.0:
            sig, note = "Neutral", f"Adequate liquidity ({cr:.2f})."
        else:
            sig, note = "Caution", f"Current ratio below 1 ({cr:.2f}) — short-term pressure."
        _row("Cash Flow & Debt", "Current Ratio", f"{cr:.2f}", sig, note)

    # ---- Analyst ----
    target = data.get("analyst_target_mean")
    price = data.get("current_price")
    if target and price and price > 0:
        upside = (target - price) / price
        sig = "Positive" if upside > 0.05 else ("Neutral" if upside >= -0.05 else "Caution")
        _row("Analyst", "Consensus Target", f"${target:.2f}",
             sig, f"Implies {upside*100:+.1f}% from current price.")

    count = data.get("analyst_count")
    if count:
        sig = "Positive" if count >= 10 else "Caution"
        _row("Analyst", "Analyst Coverage", f"{int(count)} analysts", sig,
             "Higher coverage = more reliable consensus.")

    rec = data.get("analyst_recommendation")
    if rec:
        label_map = {
            "strong_buy": ("Positive", "Strong Buy"),
            "buy": ("Positive", "Buy"),
            "hold": ("Neutral", "Hold"),
            "underperform": ("Caution", "Underperform"),
            "sell": ("Negative", "Sell"),
        }
        clean_rec = rec.lower().replace("-", "_").replace(" ", "_")
        sig, display = label_map.get(clean_rec, ("Neutral", rec.title()))
        _row("Analyst", "Recommendation", display, sig, "Aggregate analyst recommendation key.")

    # ---- Technical ----
    cur = technicals.get("current_price") or data.get("current_price")
    h52 = technicals.get("fifty_two_week_high") or data.get("fifty_two_week_high")
    l52 = technicals.get("fifty_two_week_low") or data.get("fifty_two_week_low")
    m50 = technicals.get("fifty_day_ma") or data.get("fifty_day_ma")
    m200 = technicals.get("two_hundred_day_ma") or data.get("two_hundred_day_ma")

    if cur and h52:
        gap = (h52 - cur) / cur
        if gap < 0:
            sig, note = "Positive", "Trading above 52-week high."
        elif gap <= 0.10:
            sig, note = "Positive", "Near 52-week high — strong momentum."
        elif gap <= 0.30:
            sig, note = "Neutral", f"{gap*100:.0f}% below 52-week high."
        else:
            sig, note = "Caution", f"{gap*100:.0f}% below 52-week high — deeper drawdown."
        _row("Technical", "52-Week High Gap", f"${h52:.2f} high / ${cur:.2f} now", sig, note)

    if cur and l52:
        from_low = (cur - l52) / l52 if l52 > 0 else None
        if from_low is not None:
            sig = "Positive" if from_low > 0.20 else "Neutral"
            _row("Technical", "52-Week Low Buffer", f"${l52:.2f} low", sig,
                 f"{from_low*100:.0f}% above 52-week low.")

    if cur and m50:
        sig = "Positive" if cur > m50 else "Caution"
        _row("Technical", "vs 50-Day MA", f"${m50:.2f}",
             sig, ("Above" if cur > m50 else "Below") + " 50-day moving average.")

    if cur and m200:
        sig = "Positive" if cur > m200 else "Caution"
        _row("Technical", "vs 200-Day MA", f"${m200:.2f}",
             sig, ("Above" if cur > m200 else "Below") + " 200-day moving average.")

    ret1m = technicals.get("one_month_return")
    if ret1m is not None:
        sig = "Positive" if ret1m > 0.03 else ("Caution" if ret1m < -0.05 else "Neutral")
        _row("Technical", "1-Month Return", f"{ret1m*100:+.1f}%", sig, "Recent price momentum.")

    beta = data.get("beta")
    if beta is not None:
        if beta < 0.8:
            sig, note = "Positive", "Low volatility relative to market."
        elif beta < 1.2:
            sig, note = "Neutral", "Approximately market-correlated."
        else:
            sig, note = "Caution", f"Beta of {beta:.2f} — above-average market sensitivity."
        _row("Technical", "Beta", f"{beta:.2f}", sig, note)

    return rows


# ---------------------------------------------------------------------------
# Key takeaways — 3-4 sharp bullets for the hero section
# ---------------------------------------------------------------------------

def generate_key_takeaways(scores: dict, data: dict, technicals: dict) -> List[tuple]:
    """
    Return list of (signal_type, label, text) tuples.
    signal_type: 'positive' | 'negative' | 'caution' | 'neutral'
    label: short badge text
    text: one punchy line
    """
    pcts = _category_pcts(scores)
    takeaways: List[tuple] = []

    # --- Best argument ---
    best_cat = max(pcts.items(), key=lambda x: x[1])
    best_p = best_cat[1]
    if best_p >= 0.60:
        if best_cat[0] == "profitability":
            pm = data.get("profit_margin")
            if pm and pm > 0.15:
                takeaways.append(("positive", "Best argument", f"Profit margin of {pm*100:.0f}% — earns its keep"))
            else:
                takeaways.append(("positive", "Best argument", "Profitability is the strongest element"))
        elif best_cat[0] == "cashflow":
            fcf = data.get("free_cash_flow")
            if fcf and fcf > 1e9:
                takeaways.append(("positive", "Best argument", f"Generates {_fmt_cash(fcf)} in free cash flow"))
            else:
                takeaways.append(("positive", "Best argument", "Cash flow and debt are manageable"))
        elif best_cat[0] == "valuation":
            pe = data.get("trailing_pe")
            if pe and 0 < pe <= 20:
                takeaways.append(("positive", "Best argument", f"P/E of {pe:.0f}× — not priced for perfection"))
            else:
                takeaways.append(("positive", "Best argument", "Valuation is the most constructive element"))
        elif best_cat[0] == "analyst":
            target = data.get("analyst_target_mean")
            price = data.get("current_price")
            if target and price and price > 0:
                upside = (target - price) / price
                if upside > 0.10:
                    takeaways.append(("positive", "Best argument", f"Analysts imply {upside*100:.0f}% upside from consensus"))
                else:
                    takeaways.append(("positive", "Best argument", "Analyst coverage is supportive"))
            else:
                takeaways.append(("positive", "Best argument", "Analyst expectations are the strongest signal"))
        elif best_cat[0] == "technical":
            takeaways.append(("positive", "Best argument", "Technical position is the most supportive element"))
        else:
            takeaways.append(("neutral", "Note", f"{best_cat[0].replace('_', ' ').title()} is the most constructive category"))

    # --- Main concern ---
    worst_cat = min(pcts.items(), key=lambda x: x[1])
    worst_p = worst_cat[1]
    if worst_p < 0.50:
        if worst_cat[0] == "valuation":
            pe = data.get("trailing_pe")
            if pe and pe > 50:
                takeaways.append(("negative", "Main concern", f"P/E of {pe:.0f}× prices in near-perfect execution"))
            elif pe and pe > 30:
                takeaways.append(("negative", "Main concern", f"Valuation stretched at {pe:.0f}× earnings"))
            else:
                takeaways.append(("caution", "Main concern", "Valuation is the ceiling on this score"))
        elif worst_cat[0] == "profitability":
            pm = data.get("profit_margin")
            if pm and pm < 0:
                takeaways.append(("negative", "Main concern", "Company is currently loss-making"))
            elif pm and pm < 0.05:
                takeaways.append(("caution", "Main concern", f"Thin margins of {pm*100:.1f}% leave little cushion"))
            else:
                takeaways.append(("caution", "Main concern", "Profitability has not built a decisive case"))
        elif worst_cat[0] == "cashflow":
            fcf = data.get("free_cash_flow")
            if fcf and fcf < 0:
                takeaways.append(("negative", "Main concern", "Negative free cash flow — business burns cash"))
            else:
                takeaways.append(("caution", "Main concern", "Balance-sheet picture introduces caution"))
        elif worst_cat[0] == "technical":
            takeaways.append(("caution", "Main concern", "Technical structure is not providing cover"))
        elif worst_cat[0] == "analyst":
            takeaways.append(("neutral", "Note", "Analyst data is limited or cautious"))

    # --- Technical read ---
    cur = technicals.get("current_price") or data.get("current_price")
    hi52 = technicals.get("fifty_two_week_high") or data.get("fifty_two_week_high")
    ma50 = technicals.get("fifty_day_ma") or data.get("fifty_day_ma")
    ma200 = technicals.get("two_hundred_day_ma") or data.get("two_hundred_day_ma")

    if cur and hi52 and hi52 > 0:
        gap = (hi52 - cur) / cur
        if gap < 0:
            tech_text = "Trading above 52-week high — momentum is running"
            tech_sig = "positive"
        elif gap < 0.10:
            tech_text = f"Near 52-week high ({gap*100:.0f}% gap) — limited pullback"
            tech_sig = "positive"
        elif gap <= 0.30:
            tech_text = f"{gap*100:.0f}% below 52-week high"
            if ma50 and ma200 and cur > ma50 and cur > ma200:
                tech_text += " — structure intact"
                tech_sig = "positive"
            elif ma200 and cur > ma200:
                tech_text += " — longer trend holding"
                tech_sig = "neutral"
            else:
                tech_text += " — MAs under pressure"
                tech_sig = "caution"
        else:
            tech_text = f"{gap*100:.0f}% below 52-week high — deep drawdown"
            tech_sig = "negative"
        takeaways.append((tech_sig, "Technical", tech_text))

    # --- Data confidence ---
    conf_s = scores["confidence"]["score"]
    if conf_s >= 9:
        takeaways.append(("positive", "Data", f"Full coverage — {conf_s}/10 confidence"))
    elif conf_s >= 7:
        takeaways.append(("neutral", "Data", f"Mostly complete — {conf_s}/10 confidence"))
    else:
        takeaways.append(("caution", "Data", f"Limited data — {conf_s}/10 confidence"))

    return takeaways[:4]


# ---------------------------------------------------------------------------
# Beginner-mode verdict
# ---------------------------------------------------------------------------

def generate_beginner_verdict(scores: dict, data: dict) -> str:
    """Plain-language version of the score — no jargon, no childish framing."""
    total = scores["total"]
    company = data.get("company_name", "This company")
    label = get_rating_label(total)
    pcts = _category_pcts(scores)
    val_p = pcts["valuation"]
    prof_p = pcts["profitability"]
    cf_p = pcts["cashflow"]

    # Opening
    if label in ("Elite", "Strong"):
        if val_p < 0.45:
            opening = (
                f"{company} scores {label}. "
                "The company's underlying financials look solid — it earns real money, "
                "generates cash, and carries debt at manageable levels. "
                "The main question is price. "
                "Investors are already paying a significant premium for those earnings, "
                "so the business needs to continue delivering to justify it."
            )
        else:
            opening = (
                f"{company} scores {label}. "
                "The financials — how much the company earns, how efficiently it operates, "
                "and how it manages debt — paint a reasonable picture overall. "
                "It is not perfect, but the overall reading is constructive."
            )
    elif label == "Mixed":
        opening = (
            f"{company} scores Mixed. "
            "Some indicators look healthy, others raise questions. "
            "There is enough here to be interested, but the picture is not clean enough to be confident. "
            "The business has a case to make — it has not made it fully yet."
        )
    elif label == "Weak":
        opening = (
            f"{company} scores Weak. "
            "The available numbers are not building a strong case right now. "
            "That does not mean the company cannot recover, "
            "but the data does not yet support meaningful confidence."
        )
    else:
        opening = (
            f"{company} scores High Risk. "
            "Several key metrics are either missing, negative, or concerning. "
            "Significantly more research would be needed before forming any view on this stock."
        )

    # Strength
    strength = ""
    if prof_p >= 0.70:
        pm = data.get("profit_margin")
        if pm and pm > 0.15:
            strength = (
                f"On the positive side, the company keeps a meaningful share of its revenue as profit — "
                f"{pm*100:.0f} cents from every dollar earned. "
                "That kind of efficiency signals genuine pricing power."
            )
        else:
            strength = "The profitability numbers provide a genuine foundation for this score."
    elif cf_p >= 0.70:
        strength = (
            "The company generates real cash from its operations. "
            "That matters because it means the business funds itself — "
            "it does not need to keep raising money to keep running."
        )

    # Concern
    concern = ""
    if val_p < 0.45:
        pe = data.get("trailing_pe")
        if pe and pe > 30:
            concern = (
                f"The main concern is price. "
                f"At {pe:.0f}× last year's earnings, investors are paying a lot "
                "for what the company currently produces. "
                "If growth slows or results disappoint, "
                "that premium is hard to sustain."
            )
        else:
            concern = (
                "The main limitation is valuation. "
                "The stock is not cheap by standard measures, "
                "which reduces the margin of safety."
            )

    parts = [p for p in [opening, strength, concern] if p]
    parts.append(
        "This score is an educational tool, not investment advice. "
        "It reads publicly available numbers and reports what they suggest."
    )
    return " ".join(parts)


# ---------------------------------------------------------------------------
# Score anatomy — positive drivers / negative drags / neutral factors
# ---------------------------------------------------------------------------

def generate_score_anatomy(scores: dict, data: dict, technicals: dict) -> dict:
    """Return {positives: [...], negatives: [...], neutrals: [...]}"""
    positives: List[str] = []
    negatives: List[str] = []
    neutrals: List[str] = []

    def pos(t): positives.append(t)
    def neg(t): negatives.append(t)
    def neu(t): neutrals.append(t)

    # Valuation
    pe = data.get("trailing_pe")
    if pe is not None:
        if 0 < pe <= 18:
            pos(f"Attractive P/E of {pe:.0f}×")
        elif pe > 50:
            neg(f"Stretched P/E of {pe:.0f}× — demands continued outperformance")
        elif pe > 30:
            neg(f"Elevated P/E of {pe:.0f}× — limited room for disappointment")
        elif pe < 0:
            neg("Negative earnings — P/E not meaningful")
        else:
            neu(f"Moderate P/E of {pe:.0f}×")

    ps = data.get("price_to_sales")
    if ps is not None:
        if ps > 10:
            neg(f"Price/Sales of {ps:.1f}× needs exceptional growth to justify")
        elif ps < 2:
            pos(f"Low Price/Sales of {ps:.1f}×")
        else:
            neu(f"Price/Sales of {ps:.1f}×")

    # Profitability
    pm = data.get("profit_margin")
    if pm is not None:
        if pm > 0.20:
            pos(f"Strong net margin of {pm*100:.0f}%")
        elif pm > 0.08:
            pos(f"Decent net margin of {pm*100:.0f}%")
        elif pm < 0:
            neg(f"Net loss (negative margin) — not yet earning")
        else:
            neg(f"Thin net margin of {pm*100:.1f}%")

    roe = data.get("roe")
    if roe is not None:
        if roe > 0.20:
            pos(f"Strong ROE of {roe*100:.0f}%")
        elif roe > 0.10:
            pos(f"Solid ROE of {roe*100:.0f}%")
        elif roe < 0:
            neg("Negative return on equity")

    # Cash flow
    fcf = data.get("free_cash_flow")
    if fcf is not None:
        if fcf > 1e9:
            pos(f"Strong free cash flow of {_fmt_cash(fcf)}")
        elif fcf > 0:
            pos("Positive free cash flow")
        else:
            neg(f"Negative free cash flow — burns {_fmt_cash(abs(fcf))}")

    # Debt
    dte = data.get("debt_to_equity")
    if dte is not None:
        if dte < 50:
            pos(f"Conservative debt/equity ratio ({dte:.0f}%)")
        elif dte > 300:
            neg(f"Heavy debt/equity of {dte:.0f}%")
        elif dte > 150:
            neg(f"Elevated debt/equity of {dte:.0f}%")
        else:
            neu(f"Moderate debt/equity of {dte:.0f}%")

    cash = data.get("total_cash")
    debt = data.get("total_debt")
    if cash and debt:
        if cash >= debt:
            pos("Net cash position — holds more cash than debt")
        elif debt > cash * 3:
            neg("Debt significantly exceeds cash reserves")
        else:
            neu("Moderate net debt position")

    # Technical
    cur = technicals.get("current_price") or data.get("current_price")
    hi52 = technicals.get("fifty_two_week_high") or data.get("fifty_two_week_high")
    ma50 = technicals.get("fifty_day_ma") or data.get("fifty_day_ma")
    ma200 = technicals.get("two_hundred_day_ma") or data.get("two_hundred_day_ma")

    if cur and hi52 and hi52 > 0:
        gap = (hi52 - cur) / cur
        if 0.20 <= gap <= 0.30:
            pos(f"{gap*100:.0f}% pullback from 52-week high (preferred zone)")
        elif gap < 0.10:
            neu(f"Near 52-week high ({gap*100:.0f}% gap) — limited recovery room")
        elif gap > 0.45:
            neg(f"{gap*100:.0f}% below 52-week high — significant drawdown")
        else:
            neu(f"{gap*100:.0f}% below 52-week high")

    if cur and ma50:
        if cur > ma50:
            pos("Price above 50-day moving average")
        else:
            neg("Price below 50-day moving average")

    if cur and ma200:
        if cur > ma200:
            pos("Price above 200-day moving average")
        else:
            neg("Price below 200-day moving average")

    # Analyst
    target = data.get("analyst_target_mean")
    price = data.get("current_price")
    if target and price and price > 0:
        upside = (target - price) / price
        if upside > 0.15:
            pos(f"Analyst consensus implies {upside*100:.0f}% upside")
        elif upside < -0.10:
            neg(f"Analyst consensus implies {abs(upside)*100:.0f}% downside")
        else:
            neu(f"Analyst consensus near current price ({upside*100:+.0f}%)")

    count = data.get("analyst_count")
    if count and count >= 15:
        pos(f"Strong analyst coverage ({int(count)} analysts)")
    elif count and count < 5:
        neg(f"Low analyst coverage ({int(count)} analysts) — thin consensus")

    return {"positives": positives, "negatives": negatives, "neutrals": neutrals}


# ---------------------------------------------------------------------------
# Chart read — natural language interpretation
# ---------------------------------------------------------------------------

def generate_chart_read_text(data: dict, technicals: dict) -> str:
    """Natural language interpretation of the current price setup."""
    cur = technicals.get("current_price") or data.get("current_price")
    hi52 = technicals.get("fifty_two_week_high") or data.get("fifty_two_week_high")
    lo52 = technicals.get("fifty_two_week_low") or data.get("fifty_two_week_low")
    ma50 = technicals.get("fifty_day_ma") or data.get("fifty_day_ma")
    ma200 = technicals.get("two_hundred_day_ma") or data.get("two_hundred_day_ma")

    if not cur:
        return "Price data unavailable for chart interpretation."

    parts = []

    # 52-week high gap
    if hi52 and hi52 > 0:
        gap = (hi52 - cur) / cur
        if gap < 0:
            parts.append(f"The stock is trading above its 52-week high of ${hi52:.2f} — the current move is breaking new ground. Strong momentum, but no recent high to recover toward.")
        elif gap < 0.10:
            parts.append(f"At just {gap*100:.0f}% below its 52-week high of ${hi52:.2f}, the stock is running close to its recent peak. Short-term momentum is strong, but there is limited historical overhead to recover toward.")
        elif gap <= 0.20:
            parts.append(f"The stock is {gap*100:.0f}% below its 52-week high of ${hi52:.2f} — a modest pullback from the recent peak. Momentum has cooled, but the move down has not been dramatic.")
        elif gap <= 0.30:
            parts.append(f"At {gap*100:.0f}% below its 52-week high of ${hi52:.2f}, the stock sits in what Stonky treats as a structured pullback zone — far enough from the top to allow room, close enough that the longer story has not broken down.")
        elif gap <= 0.50:
            parts.append(f"The stock is {gap*100:.0f}% below its 52-week high of ${hi52:.2f} — a deeper discount. At this level, the model does not automatically treat price weakness as opportunity. The question is whether the fundamentals support a recovery or whether the drawdown reflects real deterioration.")
        else:
            parts.append(f"The stock has fallen {gap*100:.0f}% from its 52-week high of ${hi52:.2f}. A drawdown of this magnitude raises questions about what drove the decline and whether the conditions are correctable.")

    # Moving averages
    if ma50 and ma200:
        above_50 = cur > ma50
        above_200 = cur > ma200
        golden = ma50 > ma200
        if above_50 and above_200 and golden:
            parts.append(f"The stock holds above both the 50-day MA (${ma50:.2f}) and 200-day MA (${ma200:.2f}), with the shorter average above the longer. This is considered a healthy trend structure — short and long-term momentum are both intact.")
        elif above_50 and above_200:
            parts.append(f"The stock is above both the 50-day MA (${ma50:.2f}) and 200-day MA (${ma200:.2f}). Overall trend direction is positive, though the 50-day sits below the 200-day, suggesting the recovery is still building.")
        elif above_200:
            parts.append(f"Below its 50-day MA (${ma50:.2f}) but still above the 200-day MA (${ma200:.2f}) — short-term momentum has faded, but the broader structure is intact. A return above the 50-day would be a constructive development.")
        elif above_50:
            parts.append(f"Above its 50-day MA (${ma50:.2f}) but below the 200-day MA (${ma200:.2f}) — short-term momentum is present, but the stock has not yet reclaimed its longer-term trend. A mixed technical picture.")
        else:
            parts.append(f"Below both moving averages — 50-day at ${ma50:.2f}, 200-day at ${ma200:.2f}. A technically weak setup. Return above both would be needed before calling a trend reversal.")
    elif ma50:
        above_50 = cur > ma50
        parts.append(f"The stock is {'above' if above_50 else 'below'} its 50-day MA of ${ma50:.2f}.")

    # 52-week low context
    if lo52 and lo52 > 0:
        from_low = (cur - lo52) / lo52
        if from_low < 0.08:
            parts.append(f"Notably, the stock sits only {from_low*100:.0f}% above its 52-week low of ${lo52:.2f} — close to the worst price of the past year.")
        elif from_low > 0.60:
            parts.append(f"The stock is {from_low*100:.0f}% above its 52-week low of ${lo52:.2f}, providing meaningful buffer from the bottom of the recent range.")

    return " ".join(parts) if parts else "Insufficient price history for detailed chart interpretation."

    return rows
