"""
insights.py - Derived, educational analysis layers for Stonky.

These functions take the SAME inputs the scoring/explanation layer already uses
(the fundamentals `data` dict, the `scores` dict, and `technicals`) and produce
higher-level reads: an investment thesis, an economic moat assessment, a
valuation context with a simplified educational DCF, and potential catalysts.

Nothing here changes the score. Nothing here is financial advice. All language
avoids buy/sell/hold and avoids the em dash character.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional


def _f(v: Any) -> Optional[float]:
    try:
        if v is None:
            return None
        f = float(v)
        return f
    except (TypeError, ValueError):
        return None


def _pct(cat: dict) -> float:
    s = cat.get("score") or 0
    m = cat.get("max_score") or 1
    return (s / m) if m else 0.0


_CURRENCY_SYMBOLS = {
    "USD": "$", "INR": "₹", "EUR": "€", "GBP": "£", "JPY": "¥",
    "KRW": "₩", "HKD": "HK$", "TWD": "NT$", "CHF": "CHF ", "CNY": "¥",
}


def _money(v: float, sym: str = "$") -> str:
    """Format a per-share value as a rounded currency string."""
    if v >= 1000:
        return f"{sym}{v:,.0f}"
    if v >= 100:
        return f"{sym}{v:.0f}"
    return f"{sym}{v:.2f}"


# ---------------------------------------------------------------------------
# Investment Thesis
# ---------------------------------------------------------------------------

def build_investment_thesis(data: dict, scores: dict, technicals: dict) -> dict:
    val = _pct(scores.get("valuation", {}))
    prof = _pct(scores.get("profitability", {}))
    cf = _pct(scores.get("cashflow", {}))
    analyst = _pct(scores.get("analyst", {}))
    tech = _pct(scores.get("technical", {}))
    conf = scores.get("confidence", {}).get("score", 10)
    total = scores.get("total", 0)

    quality = (prof + cf) / 2.0
    rev_growth = _f(data.get("revenue_growth"))
    earn_growth = _f(data.get("earnings_growth"))
    growthy = (rev_growth is not None and rev_growth > 0.12) or (earn_growth is not None and earn_growth > 0.15)

    cheap = val >= 0.65
    expensive = val <= 0.40
    high_quality = quality >= 0.70
    weak_quality = quality <= 0.45

    # Label selection
    if conf < 6:
        label = "Watchlist, not enough evidence"
    elif high_quality and cheap:
        label = "Undervalued compounder"
    elif high_quality and expensive:
        label = "Quality but expensive"
    elif high_quality and val < 0.55:
        label = "Strong business, stretched price"
    elif cheap and weak_quality:
        label = "Cheap for a reason"
    elif growthy and expensive and not high_quality:
        label = "Overpriced growth story"
    elif high_quality and tech < 0.45:
        label = "Strong fundamentals, weak catalyst"
    elif growthy and val < 0.55:
        label = "Improving business, uncertain valuation"
    else:
        label = "Fairly valued, limited edge"

    summary_map = {
        "Undervalued compounder": "A high quality business that also screens reasonably on price.",
        "Quality but expensive": "The business quality is strong. The price is the main constraint.",
        "Strong business, stretched price": "Fundamentals are solid, but the valuation leaves little room for disappointment.",
        "Cheap for a reason": "The low multiple may reflect real weakness rather than a bargain.",
        "Overpriced growth story": "Growth is the story, but the price already assumes a lot of it.",
        "Strong fundamentals, weak catalyst": "The business is sound, but momentum and near-term triggers are quiet.",
        "Improving business, uncertain valuation": "The trajectory is improving, though the right price is hard to pin down.",
        "Watchlist, not enough evidence": "Too much data is missing to form a confident view yet.",
        "Fairly valued, limited edge": "Price and quality look broadly balanced, with no obvious mispricing.",
    }

    # Bull case
    bull: List[str] = []
    if prof >= 0.7:
        pm = _f(data.get("profit_margin"))
        bull.append(f"Profitability is strong{f' with a {pm*100:.0f}% net margin' if pm else ''}.")
    if cf >= 0.7:
        bull.append("Free cash flow generation supports the business funding itself.")
    if analyst >= 0.65:
        bull.append("Analyst expectations are constructive.")
    if cheap:
        bull.append("Valuation multiples leave room for the price to re-rate higher.")
    if growthy:
        bull.append("Revenue or earnings growth is running above a typical mature business.")
    if tech >= 0.6:
        bull.append("The technical position is constructive, holding key trend levels.")
    if not bull:
        bull.append("The strongest support is data completeness rather than any single standout metric.")

    # Bear case
    bear: List[str] = []
    if expensive:
        pe = _f(data.get("trailing_pe"))
        bear.append(f"Valuation is demanding{f' at a {pe:.0f}x P/E' if pe else ''}, so expectations are high.")
    de = _f(data.get("debt_to_equity"))
    if de is not None and de > 150:
        bear.append(f"Leverage is elevated with debt to equity near {de:.0f}%.")
    if rev_growth is not None and rev_growth < 0.04:
        bear.append("Revenue growth is slow, which limits the room for upside surprises.")
    if tech <= 0.4:
        bear.append("Short-term momentum has cooled.")
    if analyst <= 0.4:
        bear.append("Analyst support is thin or cautious.")
    if weak_quality:
        bear.append("Margins or returns on capital are below what a durable franchise usually shows.")
    if not bear:
        bear.append("The clearest risk is that a lot of the good news may already be in the price.")

    # What the market may be missing
    missing: List[str] = []
    if high_quality and cheap:
        missing.append("The market may be underestimating the durability of cash flow.")
    if high_quality and expensive:
        missing.append("The market may already be pricing in most of the good news.")
    if growthy and expensive:
        missing.append("The market may be overestimating how long current growth can continue.")
    if prof >= 0.7 and val <= 0.5:
        missing.append("The market may be pricing the company like a slower business despite improving returns.")
    if cf >= 0.7 and val >= 0.6:
        missing.append("The market may be missing the quality of the cash conversion here.")
    if not missing:
        missing.append("There is no obvious mispricing. Price and fundamentals look broadly aligned.")

    # What needs to be true
    needs: List[str] = []
    if growthy or rev_growth is not None:
        needs.append("Revenue growth holds up, ideally above sector averages.")
    needs.append("Margins hold rather than compress.")
    if cf >= 0.5:
        needs.append("Free cash flow keeps improving.")
    if de is not None and de > 100:
        needs.append("Debt stays manageable as rates and cash flow move.")
    if analyst >= 0.6:
        needs.append("Analyst expectations prove achievable rather than too optimistic.")
    needs.append("The competitive position stays intact.")

    # What could break it
    breaks: List[str] = []
    if expensive:
        breaks.append("Valuation compression if growth or sentiment fades.")
    breaks.append("Margin pressure from competition or costs.")
    if de is not None and de > 120:
        breaks.append("A heavier debt burden if cash flow weakens.")
    if growthy:
        breaks.append("Slowing growth that undercuts the premium multiple.")
    breaks.append("A weakening competitive position.")
    breaks.append("A broad macro slowdown or sector rotation.")

    return {
        "label": label,
        "summary": summary_map.get(label, ""),
        "bullCase": bull[:5],
        "bearCase": bear[:5],
        "marketMayBeMissing": missing[:3],
        "whatNeedsToBeTrue": needs[:5],
        "whatCouldBreak": breaks[:5],
    }


# ---------------------------------------------------------------------------
# Long-Term Thesis Bias
# ---------------------------------------------------------------------------

def build_long_term_thesis_bias(data: dict, scores: dict) -> dict:
    """
    A directional long-term read derived from the same inputs as the score:
    overall score, valuation, profitability, cash flow, analyst expectations,
    growth, and data confidence. Educational only. Never buy/sell/hold.
    """
    total = scores.get("total", 0)
    val = _pct(scores.get("valuation", {}))
    prof = _pct(scores.get("profitability", {}))
    cf = _pct(scores.get("cashflow", {}))
    analyst = _pct(scores.get("analyst", {}))
    conf_score = scores.get("confidence", {}).get("score", 10)

    quality = (prof + cf) / 2.0
    rev_growth = _f(data.get("revenue_growth"))
    earn_growth = _f(data.get("earnings_growth"))
    growthy = (rev_growth is not None and rev_growth > 0.12) or (earn_growth is not None and earn_growth > 0.15)

    stretched = val <= 0.40
    very_stretched = val <= 0.25

    if total >= 70 and quality >= 0.65 and not stretched:
        label, direction = "Bullish", "Bullish"
        reason = (
            "The overall score, profitability, and cash flow all support the long-term case, "
            "and valuation is not the main obstacle."
        )
    elif total >= 70 and quality >= 0.65 and very_stretched:
        label, direction = "Bullish, but price-sensitive", "Bullish"
        reason = (
            "Business quality is strong across margins and cash flow, but the price already assumes "
            "a lot of success, so the entry valuation carries most of the risk."
        )
    elif total >= 60 and quality >= 0.55:
        label, direction = "Cautiously bullish", "Bullish"
        reason = (
            "Strong profitability and cash flow support the thesis, but valuation limits the margin of safety."
            if stretched
            else "The fundamentals lean positive, though no single pillar is strong enough for a full bullish read."
        )
    elif quality >= 0.60 and very_stretched and analyst < 0.5:
        label, direction = "Cautiously bearish", "Bearish"
        reason = (
            "The business itself is sound, but an extremely stretched valuation with little analyst support "
            "leaves the long-term case dependent on near-perfect execution."
        )
    elif total < 45 or (quality <= 0.40 and total < 55):
        label, direction = "Bearish", "Bearish"
        reason = (
            "A weak overall score with soft profitability or strained cash flow and debt undercuts "
            "the long-term case on current evidence."
        )
    elif total >= 52 and (quality >= 0.5 or growthy):
        label, direction = "Cautiously bullish", "Bullish"
        reason = (
            "The evidence is mixed, but quality or growth tilts the long-term balance slightly positive."
        )
    else:
        label, direction = "Cautiously bearish", "Bearish"
        reason = (
            "The evidence is mixed and the weaker pillars, such as valuation or momentum, "
            "currently outweigh the supports."
        )

    if conf_score >= 9:
        confidence = "High"
    elif conf_score >= 7:
        confidence = "Medium"
    else:
        confidence = "Low"
        reason += " Missing data lowers confidence in this read."

    return {
        "label": label,
        "direction": direction,
        "reason": reason,
        "confidence": confidence,
    }


# ---------------------------------------------------------------------------
# Economic Moat
# ---------------------------------------------------------------------------

_SECTOR_MOAT_HINTS = {
    "technology": ["Intellectual property / patents", "Ecosystem lock-in", "Switching costs"],
    "communication services": ["Network effects", "Brand strength", "Data advantage"],
    "consumer defensive": ["Brand strength", "Distribution advantage", "Customer loyalty"],
    "consumer cyclical": ["Brand strength", "Scale advantage"],
    "healthcare": ["Intellectual property / patents", "Regulatory barriers"],
    "financial services": ["Switching costs", "Scale advantage", "Regulatory barriers"],
    "industrials": ["Scale advantage", "Cost advantage"],
    "energy": ["Cost advantage", "Scale advantage"],
    "utilities": ["Regulatory barriers", "Scale advantage"],
    "basic materials": ["Cost advantage", "Scale advantage"],
    "real estate": ["Scale advantage", "Switching costs"],
}


def build_economic_moat(data: dict, scores: dict) -> dict:
    op = _f(data.get("operating_margin"))
    pm = _f(data.get("profit_margin"))
    roe = _f(data.get("roe"))
    roa = _f(data.get("roa"))
    mc = _f(data.get("market_cap"))
    sector = (data.get("sector") or "").lower()
    industry = data.get("industry") or ""

    # Score the durability signals we can read publicly.
    signals = 0
    have = 0
    if op is not None:
        have += 1
        if op >= 0.25:
            signals += 2
        elif op >= 0.15:
            signals += 1
    if roe is not None:
        have += 1
        if roe >= 0.20:
            signals += 2
        elif roe >= 0.12:
            signals += 1
    if roa is not None:
        have += 1
        if roa >= 0.10:
            signals += 1
    if mc is not None:
        have += 1
        if mc >= 2e11:
            signals += 2
        elif mc >= 2e10:
            signals += 1

    if have < 2:
        level = "Unclear"
    elif signals >= 6:
        level = "Very strong"
    elif signals >= 4:
        level = "Strong"
    elif signals >= 2:
        level = "Moderate"
    else:
        level = "Weak"

    sources: List[str] = list(_SECTOR_MOAT_HINTS.get(sector, ["Scale advantage"]))
    if op is not None and op >= 0.25 and "Cost advantage" not in sources:
        sources.append("Cost advantage")
    if mc is not None and mc >= 1e11 and "Scale advantage" not in sources:
        sources.append("Scale advantage")
    sources = sources[:3]

    margin_txt = f"{op*100:.0f}% operating margin" if op is not None else "limited margin data"
    roe_txt = f"a {roe*100:.0f}% return on equity" if roe is not None else "limited return data"

    if level in ("Strong", "Very strong"):
        explanation = (
            f"The business shows {margin_txt} and {roe_txt}, which is hard to sustain without some "
            f"durable advantage. In {industry or 'its industry'}, that protection likely comes from "
            f"{', '.join(s.lower() for s in sources)}. A wider moat can let a company keep margins high for longer."
        )
    elif level == "Moderate":
        explanation = (
            f"The business shows {margin_txt} and {roe_txt}. That points to a real but not unbreakable "
            f"advantage, likely tied to {', '.join(s.lower() for s in sources)}. Competitors could chip away at it over time."
        )
    elif level == "Weak":
        explanation = (
            f"Margins and returns are modest ({margin_txt}, {roe_txt}), which suggests competition keeps "
            f"pressure on pricing and profitability. A narrow moat means strong profits may be harder to defend."
        )
    else:
        explanation = (
            "There is not enough public margin and return data to judge the moat confidently. "
            "Moat is inferred from available public data and industry context."
        )

    risk = (
        "The moat could weaken from new competition, technology shifts, regulation, pricing pressure, or "
        "customers switching to alternatives. This read is inferred from available public data and industry context, "
        "not proprietary information."
    )

    return {
        "level": level,
        "sources": sources,
        "explanation": explanation,
        "risk": risk,
    }


# ---------------------------------------------------------------------------
# Valuation Context (incl. simplified educational DCF)
# ---------------------------------------------------------------------------

def _simple_dcf(data: dict) -> dict:
    fcf = _f(data.get("free_cash_flow"))
    mc = _f(data.get("market_cap"))
    price = _f(data.get("current_price"))
    rev_growth = _f(data.get("revenue_growth"))

    if not fcf or fcf <= 0 or not mc or not price or price <= 0:
        return {
            "available": False,
            "method": "Simplified discounted cash flow",
            "bearCase": "",
            "baseCase": "",
            "bullCase": "",
            "assumptions": [],
        }

    shares = mc / price
    if shares <= 0:
        return {"available": False, "method": "Simplified discounted cash flow", "bearCase": "", "baseCase": "", "bullCase": "", "assumptions": []}

    sym = _CURRENCY_SYMBOLS.get(data.get("currency") or "USD", "$")
    base_g = rev_growth if (rev_growth is not None and rev_growth > 0) else 0.06
    base_g = max(0.02, min(0.18, base_g))
    term_g = 0.025
    years = 10

    def value(growth: float, discount: float) -> float:
        pv = 0.0
        f = fcf
        for t in range(1, years + 1):
            # fade growth toward terminal over the projection
            g = growth + (term_g - growth) * (t - 1) / (years - 1)
            f = f * (1 + g)
            pv += f / ((1 + discount) ** t)
        terminal = f * (1 + term_g) / (discount - term_g)
        pv += terminal / ((1 + discount) ** years)
        return pv / shares

    bear = value(max(0.0, base_g - 0.04), 0.115)
    base = value(base_g, 0.10)
    bull = value(min(0.22, base_g + 0.03), 0.09)

    # Sensitivity: how much fair value swings with the assumptions. A wide
    # bear-to-bull spread, or a high growth input, means small assumption
    # changes move the answer a lot.
    spread = (bull - bear) / base if base > 0 else 0.0
    if spread >= 0.9 or base_g >= 0.14:
        sensitivity = "High"
    elif spread >= 0.45:
        sensitivity = "Medium"
    else:
        sensitivity = "Low"

    # Interpretation: confident, educational, never a prediction.
    if price > bull * 1.02:
        interpretation = (
            "The current market price sits above the model's bull case. That does not mean the stock is "
            "expected to fall. It means investors are paying for growth, margins, or durability beyond what this "
            "simplified cash-flow model assumes. The real question is whether future earnings and cash flow can "
            "grow into that premium."
        )
    elif price < bear * 0.98:
        interpretation = (
            "The current market price sits below the model's bear case. On these simplified assumptions that can "
            "point to deep value or to risks the model cannot see. The key debate is what the market is worried about."
        )
    else:
        interpretation = (
            "The current market price sits inside the model's range, so this simplified cash-flow view and the "
            "market are broadly aligned."
        )

    return {
        "available": True,
        "method": "Simplified discounted cash flow (educational range, not a price target)",
        "bearCase": _money(bear, sym),
        "baseCase": _money(base, sym),
        "bullCase": _money(bull, sym),
        "sensitivity": sensitivity,
        "interpretation": interpretation,
        "assumptions": [
            f"Base free cash flow growth near {base_g*100:.0f}%, fading toward {term_g*100:.1f}% terminal growth.",
            "Discount rate between 9% and 11.5% across the scenarios.",
            "A 10-year projection with a terminal value, divided by current shares outstanding.",
        ],
        "_base": base,
        "_price": price,
    }


def build_valuation_context(data: dict, scores: dict) -> dict:
    val = _pct(scores.get("valuation", {}))
    prof = _pct(scores.get("profitability", {}))
    cf = _pct(scores.get("cashflow", {}))
    quality = (prof + cf) / 2.0

    pe = _f(data.get("trailing_pe"))
    fpe = _f(data.get("forward_pe"))
    ps = _f(data.get("price_to_sales"))
    pb = _f(data.get("price_to_book"))

    # Multiple read
    parts: List[str] = []
    if pe is not None:
        if pe < 0:
            parts.append("Trailing P/E is negative, which points to current losses rather than a bargain.")
        elif pe > 40:
            parts.append(f"A {pe:.0f}x P/E is high. That can be justified by strong growth, margins, and cash flow, but it is risky if expectations slip.")
        elif pe < 15:
            parts.append(f"A {pe:.0f}x P/E is modest, which can mean either value or a market that doubts future growth.")
        else:
            parts.append(f"A {pe:.0f}x P/E sits in a reasonable range.")
    if fpe is not None and pe is not None and pe > 0 and fpe < pe * 0.85:
        parts.append("The forward P/E is meaningfully lower than trailing, so analysts expect earnings to grow.")
    if ps is not None and ps > 10:
        parts.append(f"Price to sales near {ps:.0f}x only makes sense with high margins or fast growth.")
    if pb is not None and pb < 1:
        parts.append("Price to book is below 1, which is unusual and can signal deep value or real trouble.")
    if not parts:
        parts.append("Valuation multiples are incomplete for this ticker, so the read leans on quality and cash flow instead.")
    multiple_read = " ".join(parts)
    if quality >= 0.7 and val <= 0.45:
        multiple_read += " The premium here is at least partly earned by genuine business quality."
    elif quality <= 0.45 and val <= 0.45:
        multiple_read += " A high multiple on a weaker business leaves little room for error."

    # Status
    if pe is None and ps is None and pb is None:
        status = "Cannot assess confidently"
    elif val >= 0.7 and quality >= 0.55:
        status = "Appears undervalued"
    elif val >= 0.55:
        status = "Appears fairly valued"
    elif val >= 0.4:
        status = "Appears stretched"
    else:
        status = "Appears expensive"

    fair = _simple_dcf(data)
    # Refine status with DCF if available and confident.
    if fair.get("available"):
        base = fair.get("_base")
        price = fair.get("_price")
        if base and price:
            if base > price * 1.2:
                status = "Appears undervalued" if status != "Cannot assess confidently" else status
            elif base < price * 0.8 and status in ("Appears fairly valued", "Appears stretched"):
                status = "Appears stretched"
    # strip internal keys
    fair.pop("_base", None)
    fair.pop("_price", None)

    comps = {
        "available": False,
        "summary": (
            "Live peer comparison is not fetched automatically, so this is framed with sector and industry context "
            f"({data.get('industry') or data.get('sector') or 'general market'}) rather than exact peer multiples."
        ),
        "metrics": [],
    }

    return {
        "status": status,
        "multipleRead": multiple_read,
        "fairValueView": fair,
        "tradingComps": comps,
    }


# ---------------------------------------------------------------------------
# Catalysts and Future Direction
# ---------------------------------------------------------------------------

def build_catalysts(data: dict, scores: dict, technicals: dict) -> dict:
    sector = (data.get("sector") or "").lower()
    industry = (data.get("industry") or "").lower()
    cf = _pct(scores.get("cashflow", {}))
    de = _f(data.get("debt_to_equity"))
    op = _f(data.get("operating_margin"))
    tech = _pct(scores.get("technical", {}))
    rev_growth = _f(data.get("revenue_growth"))

    near: List[str] = ["An earnings beat or a guidance update relative to expectations."]
    if op is not None and op >= 0.15:
        near.append("Further margin expansion if cost discipline holds.")
    if de is not None and de > 100:
        near.append("Debt reduction that lowers financial risk.")
    if cf >= 0.7:
        near.append("Buybacks or a dividend step-up funded by free cash flow.")
    if "semiconductor" in industry or "technology" in sector or "software" in industry:
        near.append("Continued AI and data-center demand as an industry tailwind.")
    if "health" in sector or "pharma" in industry or "biotech" in industry:
        near.append("Regulatory approvals, trial readouts, or litigation resolution.")
    if "bank" in industry or "financial" in sector:
        near.append("Rate moves and credit trends that shift net interest income.")

    long_dir: List[str] = []
    if rev_growth is not None and rev_growth > 0.1:
        long_dir.append("The company is still in a growth phase, so reinvestment and share gains matter most.")
    else:
        long_dir.append("The company looks more mature, so margins, cash returns, and efficiency matter most.")
    long_dir.append(f"Direction will track the {industry or sector or 'sector'} cycle and the firm's competitive position.")

    watch: List[str] = [
        "Whether margins hold or expand in the next reports.",
        "Whether free cash flow keeps improving.",
        "Analyst revisions to targets and estimates.",
        "Price action relative to the 50-day and 200-day moving averages.",
    ]
    if de is not None and de > 100:
        watch.append("The trend in debt and interest coverage.")

    risks: List[str] = [
        "Potential catalysts may not arrive on the expected timeline.",
        "A macro slowdown or sector rotation could overpower company-specific news.",
    ]
    if tech <= 0.4:
        risks.append("Weak momentum could persist until a clear positive surprise appears.")

    return {
        "nearTerm": near[:5],
        "longTermDirection": long_dir[:3],
        "whatToWatch": watch[:5],
        "risks": risks[:4],
    }
