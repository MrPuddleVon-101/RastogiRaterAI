"""
ui_helpers.py — RastogiRaterAI visual system.
Light institutional theme: research memo aesthetic.
Fonts: DM Sans (body) · DM Mono (numbers/prices/scores)
"""

import re
from typing import Any, Dict, List, Optional

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from scoring import get_rating_label
from tooltips import CATEGORY_TOOLTIPS, RICH_TOOLTIPS_BY_DISPLAY


# ---------------------------------------------------------------------------
# Safe HTML renderer
# ---------------------------------------------------------------------------

def _h(html: str) -> None:
    clean = re.sub(r"(?m)^[ \t]+", "", html)
    st.markdown(clean, unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Colour system — light institutional
# ---------------------------------------------------------------------------

BG       = "#F7F5EF"   # warm off-white base
SURFACE  = "#FFFFFF"   # white surface
SURFACE2 = "#EFECE4"   # slightly tinted
SURFACE3 = "#E8E4D8"   # deeper surface
BORDER   = "#D4CEC5"   # subtle divider
BORDER2  = "#C9C3B8"   # visible border
TEXT     = "#1A1A1A"   # near-black primary
MUTED    = "#5F625F"   # secondary text
FAINT    = "#9B9890"   # disabled / labels
ACCENT   = "#111111"   # dark accent
POS      = "#216E46"   # institutional green
NEG      = "#9B1C1C"   # deep red
CAUT     = "#B7791F"   # amber

RATING_COLOURS = {
    "Elite":     "#1A5C39",
    "Strong":    "#216E46",
    "Mixed":     "#B7791F",
    "Weak":      "#C05C1A",
    "High Risk": "#9B1C1C",
}

SIGNAL_COLOURS = {
    "positive": POS,
    "negative": NEG,
    "caution":  CAUT,
    "neutral":  MUTED,
}


def _cat_colour(score: float, max_score: float) -> str:
    p = score / max_score if max_score else 0
    if p >= 0.80: return POS
    if p >= 0.65: return "#2A8A58"
    if p >= 0.45: return CAUT
    if p >= 0.30: return "#C05C1A"
    return NEG


def _cat_status(score: float, max_score: float) -> tuple:
    p = score / max_score if max_score else 0
    if p >= 0.80: return "↑", "Strong"
    if p >= 0.65: return "↑", "Solid"
    if p >= 0.45: return "→", "Mixed"
    if p >= 0.30: return "↓", "Pressured"
    return "↓", "Weak"


# ---------------------------------------------------------------------------
# Tooltip helper
# ---------------------------------------------------------------------------

def _tt(label: str, tooltip_html: str, icon: bool = True) -> str:
    if not tooltip_html:
        return label
    icon_html = '<i class="rr-tt-i">?</i>' if icon else ""
    return (
        f'<span class="rr-tt">{label}{icon_html}'
        f'<span class="rr-tt-box">{tooltip_html}</span></span>'
    )


# ---------------------------------------------------------------------------
# Format helpers
# ---------------------------------------------------------------------------

def fmt_price(v: Optional[float]) -> str:
    return "N/A" if v is None else f"${v:,.2f}"

def fmt_market_cap(v: Optional[float]) -> str:
    if v is None: return "N/A"
    if v >= 1e12: return f"${v/1e12:.2f}T"
    if v >= 1e9:  return f"${v/1e9:.2f}B"
    if v >= 1e6:  return f"${v/1e6:.1f}M"
    return f"${v:,.0f}"


# ---------------------------------------------------------------------------
# CSS injection
# ---------------------------------------------------------------------------

def inject_css() -> None:
    st.markdown(
        '<link rel="preconnect" href="https://fonts.googleapis.com">'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link href="https://fonts.googleapis.com/css2?'
        'family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;'
        '1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">',
        unsafe_allow_html=True,
    )

    css = f"""<style>
html, body, .stApp {{
    background-color: {BG} !important;
    font-family: 'DM Sans', system-ui, sans-serif !important;
    color: {TEXT} !important;
}}
.main .block-container {{
    max-width: 1120px;
    padding: 1rem 2rem 5rem 2rem;
    background-color: {BG} !important;
}}
* {{ box-sizing: border-box; }}

/* header bar */
header[data-testid="stHeader"] {{
    background-color: {BG} !important;
    border-bottom: 1px solid {BORDER2} !important;
}}

/* h2 — quiet section labels */
.main h2, [data-testid="stMarkdownContainer"] h2 {{
    font-family: 'DM Sans', sans-serif !important;
    font-size: 0.6rem !important;
    font-weight: 600 !important;
    color: {FAINT} !important;
    letter-spacing: 0.15em !important;
    text-transform: uppercase !important;
    border: none !important;
    border-bottom: 1px solid {BORDER} !important;
    padding-bottom: 0.4rem !important;
    margin-top: 2rem !important;
    margin-bottom: 0.75rem !important;
}}

/* body text */
.main p, .main li {{ font-family: 'DM Sans', sans-serif !important; color: {TEXT} !important; }}

/* text input */
.stTextInput > div > div > input {{
    background: {SURFACE} !important;
    border: 1px solid {BORDER2} !important;
    border-radius: 3px !important;
    color: {TEXT} !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 0.95rem !important;
    padding: 0.55rem 0.8rem !important;
    box-shadow: none !important;
}}
.stTextInput > div > div > input::placeholder {{ color: {FAINT} !important; }}
.stTextInput > div > div > input:focus {{
    border-color: {TEXT} !important;
    box-shadow: none !important;
    outline: none !important;
}}

/* primary button — dark */
.stButton > button {{
    background: {ACCENT} !important;
    color: {SURFACE} !important;
    border: 1px solid {ACCENT} !important;
    border-radius: 3px !important;
    padding: 0.55rem 1.3rem !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 0.78rem !important;
    font-weight: 500 !important;
    letter-spacing: 0.02em !important;
    transition: opacity 0.1s !important;
}}
.stButton > button:hover {{ opacity: 0.78 !important; background: {ACCENT} !important; }}

/* tabs */
.stTabs [data-baseweb="tab-list"] {{
    background: transparent !important;
    border-bottom: 1px solid {BORDER2} !important;
    gap: 0 !important;
}}
.stTabs [data-baseweb="tab"] {{
    background: transparent !important;
    color: {MUTED} !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 0.7rem !important;
    font-weight: 500 !important;
    letter-spacing: 0.07em !important;
    text-transform: uppercase !important;
    padding: 0.6rem 1.1rem !important;
    border: none !important;
    border-bottom: 2px solid transparent !important;
    border-radius: 0 !important;
}}
.stTabs [aria-selected="true"] {{ color: {TEXT} !important; border-bottom-color: {TEXT} !important; }}
[data-testid="stTabContent"] {{ background: transparent !important; padding-top: 0.4rem !important; }}

/* expander */
details > summary {{
    background: {SURFACE2} !important;
    color: {TEXT} !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 0.8rem !important;
    font-weight: 500 !important;
    border: 1px solid {BORDER2} !important;
    border-radius: 3px !important;
    padding: 0.5rem 0.8rem !important;
}}
details {{ border: 1px solid {BORDER2} !important; border-radius: 3px !important; background: {SURFACE2} !important; }}
.streamlit-expanderContent {{
    background: {SURFACE} !important;
    border: 1px solid {BORDER2} !important;
    border-top: none !important;
    padding: 0.5rem !important;
}}

/* radio */
.stRadio > div {{ background: transparent !important; }}
.stRadio label {{ font-family: 'DM Sans', sans-serif !important; font-size: 0.82rem !important; color: {TEXT} !important; }}

/* selectbox */
.stSelectbox [data-baseweb="select"] > div {{
    background: {SURFACE} !important;
    border: 1px solid {BORDER2} !important;
    border-radius: 3px !important;
    color: {TEXT} !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 0.82rem !important;
}}
.stSelectbox [data-baseweb="select"] svg {{ fill: {MUTED} !important; }}

/* alerts */
.stAlert {{ background: {SURFACE2} !important; border-radius: 3px !important; color: {TEXT} !important; font-family: 'DM Sans', sans-serif !important; }}
.stWarning {{ border-left: 3px solid {CAUT} !important; background: rgba(183,121,31,0.05) !important; }}
.stError {{ border-left: 3px solid {NEG} !important; background: rgba(155,28,28,0.05) !important; }}
.stInfo {{ border-left: 3px solid {MUTED} !important; }}
.stSuccess {{ border-left: 3px solid {POS} !important; background: rgba(33,110,70,0.05) !important; }}

/* misc */
hr {{ border: none !important; border-top: 1px solid {BORDER} !important; margin: 1.8rem 0 !important; }}
::-webkit-scrollbar {{ width: 4px; height: 4px; }}
::-webkit-scrollbar-track {{ background: {BG}; }}
::-webkit-scrollbar-thumb {{ background: {BORDER2}; border-radius: 2px; }}
[data-testid="stStatusWidget"] {{
    background: {SURFACE} !important; color: {TEXT} !important;
    border: 1px solid {BORDER2} !important; border-radius: 3px !important;
    font-family: 'DM Sans', sans-serif !important;
}}
.stNumberInput [data-baseweb="input"] {{
    background: {SURFACE} !important; border: 1px solid {BORDER2} !important;
    border-radius: 3px !important; color: {TEXT} !important;
}}

/* overflow for tooltips */
.element-container, [data-testid="stMarkdownContainer"] {{ overflow: visible !important; }}

/* ─── TOOLTIP SYSTEM ─── */
.rr-tt {{
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    cursor: default;
}}
.rr-tt-i {{
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 13px;
    height: 13px;
    background: {BORDER};
    color: {MUTED};
    border-radius: 50%;
    font-size: 7px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-style: normal;
    cursor: help;
    flex-shrink: 0;
    user-select: none;
    transition: background 0.1s, color 0.1s;
}}
.rr-tt:hover .rr-tt-i {{ background: {ACCENT}; color: {SURFACE}; }}
.rr-tt-box {{
    display: none;
    position: absolute;
    z-index: 9999;
    bottom: calc(100% + 7px);
    left: 0;
    width: 250px;
    background: {SURFACE};
    border: 1px solid {BORDER2};
    border-left: 2px solid {MUTED};
    padding: 0.65rem 0.8rem;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.74rem;
    line-height: 1.6;
    color: {TEXT};
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    pointer-events: none;
    white-space: normal;
    border-radius: 3px;
}}
.rr-tt:hover .rr-tt-box {{ display: block; }}
.rr-ev-tbl .rr-tt-box {{ bottom: auto; top: calc(100% + 5px); }}

/* ─── SCORE TABLE ─── */
.rr-score-tbl {{
    width: 100%;
    border-collapse: collapse;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.84rem;
}}
.rr-score-tbl th {{
    font-size: 0.58rem;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: {FAINT};
    font-weight: 600;
    text-align: left;
    padding: 0.4rem 0.9rem;
    border-bottom: 1px solid {BORDER2};
    background: {SURFACE2};
}}
.rr-score-tbl td {{
    padding: 0.65rem 0.9rem;
    border-bottom: 1px solid {BORDER};
    vertical-align: middle;
    color: {TEXT};
    overflow: visible;
}}
.rr-score-tbl tr:last-child td {{ border-bottom: none; }}
.rr-score-tbl tr:hover td {{ background: {SURFACE2}; }}

/* ─── EVIDENCE TABLE ─── */
.rr-ev-tbl {{
    width: 100%;
    border-collapse: collapse;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.83rem;
    overflow: visible;
}}
.rr-ev-tbl th {{
    font-size: 0.57rem;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    color: {FAINT};
    font-weight: 600;
    text-align: left;
    padding: 0.45rem 0.9rem;
    border-bottom: 2px solid {BORDER2};
    background: {SURFACE2};
    white-space: nowrap;
}}
.rr-ev-tbl td {{
    padding: 0.55rem 0.9rem;
    border-bottom: 1px solid {BORDER};
    vertical-align: middle;
    overflow: visible;
    color: {TEXT};
}}
.rr-ev-tbl tr:hover td {{ background: {SURFACE2}; }}
.rr-ev-tbl .rr-cat-row td {{
    font-size: 0.57rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: {MUTED};
    background: {SURFACE2} !important;
    border-top: 1px solid {BORDER2};
    border-bottom: 1px solid {BORDER2};
    padding: 0.35rem 0.9rem;
}}
</style>"""
    st.markdown(css, unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Header — thin, refined
# ---------------------------------------------------------------------------

def render_header() -> None:
    _h(
        f'<div style="display:flex;justify-content:space-between;align-items:baseline;'
        f'padding:0.4rem 0 0.9rem 0;border-bottom:1px solid {BORDER2};'
        f'margin-bottom:1.4rem;">'
        f'<div>'
        f'<span style="font-family:\'DM Sans\',sans-serif;font-size:1.1rem;'
        f'font-weight:600;color:{TEXT};letter-spacing:-0.01em;">RastogiRaterAI</span>'
        f'<span style="font-family:\'DM Sans\',sans-serif;font-size:0.75rem;'
        f'color:{MUTED};margin-left:0.8rem;">A colder look at hot stocks.</span>'
        f'</div>'
        f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.64rem;'
        f'color:{FAINT};">Educational tool. Not financial advice.</div>'
        f'</div>'
    )


# ---------------------------------------------------------------------------
# Empty state
# ---------------------------------------------------------------------------

def render_empty_state() -> None:
    _h(
        f'<div style="max-width:640px;margin:1.5rem 0 2.5rem 0;">'
        f'<p style="font-family:\'DM Sans\',sans-serif;font-size:1rem;'
        f'color:{TEXT};line-height:1.75;margin:0 0 0.5rem 0;">'
        f'Enter a ticker. RastogiRaterAI checks whether the heat is earned.</p>'
        f'<p style="font-family:\'DM Sans\',sans-serif;font-size:0.8rem;'
        f'color:{MUTED};line-height:1.65;margin:0;">'
        f'Valuation &middot; Analyst expectations &middot; Profitability &middot; '
        f'Cash flow &middot; Debt &middot; Technical position &middot; Data confidence.</p>'
        f'</div>'
    )

    st.markdown("## What the score measures")

    cats = [
        ("Valuation", "20 pts", "P/E, P/B, P/S. Is the price reasonable for what the company earns?", "Valuation"),
        ("Analyst Expectations", "15 pts", "Consensus targets and coverage. Do professionals expect upside?", "Analyst"),
        ("Profitability", "20 pts", "Net margin, ROE, ROA. Is the business actually earning its keep?", "Profitability"),
        ("Cash Flow & Debt", "20 pts", "FCF, debt/equity, liquidity. Can it fund itself without optimism?", "Cash Flow & Debt"),
        ("Technical Position", "15 pts", "52W high gap, moving averages. Where is price relative to trend?", "Technical Position"),
        ("Data Confidence", "10 pts", "How complete is the data. How reliable is this score?", "Data Confidence"),
    ]

    rows = "".join(
        f'<tr style="border-bottom:1px solid {BORDER};">'
        f'<td style="padding:0.6rem 0.9rem;font-weight:500;overflow:visible;">'
        f'{_tt(name, CATEGORY_TOOLTIPS.get(tt_key, ""))}</td>'
        f'<td style="padding:0.6rem 0.9rem;font-family:\'DM Mono\',monospace;'
        f'font-size:0.82rem;color:{MUTED};white-space:nowrap;">{pts}</td>'
        f'<td style="padding:0.6rem 0.9rem;color:{MUTED};font-size:0.8rem;">{desc}</td>'
        f'</tr>'
        for name, pts, desc, tt_key in cats
    )

    _h(
        f'<table style="width:100%;border-collapse:collapse;font-family:\'DM Sans\',sans-serif;'
        f'font-size:0.84rem;background:{SURFACE};border:1px solid {BORDER2};'
        f'margin-bottom:1.5rem;overflow:visible;">'
        f'<thead><tr style="background:{SURFACE2};">'
        f'<th style="padding:0.45rem 0.9rem;text-align:left;font-size:0.57rem;'
        f'letter-spacing:0.13em;text-transform:uppercase;color:{FAINT};'
        f'font-weight:600;border-bottom:1px solid {BORDER2};">Category</th>'
        f'<th style="padding:0.45rem 0.9rem;text-align:left;font-size:0.57rem;'
        f'letter-spacing:0.13em;text-transform:uppercase;color:{FAINT};'
        f'font-weight:600;border-bottom:1px solid {BORDER2};">Weight</th>'
        f'<th style="padding:0.45rem 0.9rem;text-align:left;font-size:0.57rem;'
        f'letter-spacing:0.13em;text-transform:uppercase;color:{FAINT};'
        f'font-weight:600;border-bottom:1px solid {BORDER2};">What it measures</th>'
        f'</tr></thead><tbody>{rows}</tbody></table>'
    )

    _h(
        f'<p style="font-family:\'DM Sans\',sans-serif;font-size:0.78rem;'
        f'color:{FAINT};font-style:italic;margin:0;">'
        f'The score is a pressure test, not advice.</p>'
    )


# ---------------------------------------------------------------------------
# Hero — 3-column research memo card
# ---------------------------------------------------------------------------

def render_hero(
    company_name: str,
    ticker: str,
    price: Optional[float],
    market_cap: Optional[float],
    sector: Optional[str],
    industry: Optional[str],
    total_score: float,
    nuanced_label: str,
    one_liner: str,
    takeaways: Optional[list] = None,
    confidence_score: Optional[float] = None,
) -> None:
    label = get_rating_label(total_score)
    sc = RATING_COLOURS.get(label, ACCENT)

    meta_parts = [ticker]
    if sector:
        meta_parts.append(sector)
    if industry and industry != sector:
        meta_parts.append(industry)
    meta_str = " &middot; ".join(meta_parts)

    # Takeaway bullets (up to 3)
    tw_html = ""
    if takeaways:
        arrow = {"positive": "↑", "negative": "↓", "caution": "→", "neutral": "–"}
        for sig, lbl, txt in takeaways[:3]:
            colour = SIGNAL_COLOURS.get(sig, MUTED)
            icon = arrow.get(sig, "–")
            tw_html += (
                f'<div style="display:flex;gap:0.5rem;margin-bottom:0.3rem;'
                f'font-family:\'DM Sans\',sans-serif;">'
                f'<span style="color:{colour};font-size:0.78rem;flex-shrink:0;">{icon}</span>'
                f'<span style="font-size:0.78rem;color:{MUTED};line-height:1.4;">{txt}</span>'
                f'</div>'
            )

    # Confidence
    conf_html = ""
    if confidence_score is not None:
        cc = POS if confidence_score >= 8 else (CAUT if confidence_score >= 6 else NEG)
        conf_html = (
            f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.67rem;'
            f'color:{FAINT};margin-top:0.5rem;">'
            f'<span style="font-family:\'DM Mono\',monospace;font-weight:500;'
            f'color:{cc};">{int(confidence_score)}/10</span> data confidence</div>'
        )

    _h(
        f'<div style="background:{SURFACE};border:1px solid {BORDER2};'
        f'border-top:2px solid {sc};padding:1.5rem 1.8rem;margin-bottom:0.6rem;">'
        # 3-column grid
        f'<div style="display:grid;grid-template-columns:1fr 1.1fr 150px;'
        f'gap:1.8rem;align-items:start;">'

        # ── Col 1: Identity ──
        f'<div>'
        f'<div style="font-family:\'DM Sans\',sans-serif;font-size:1.8rem;'
        f'font-weight:600;color:{TEXT};line-height:1.1;margin-bottom:0.45rem;'
        f'letter-spacing:-0.01em;">{company_name}</div>'
        f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.7rem;'
        f'color:{MUTED};letter-spacing:0.03em;margin-bottom:0.75rem;">{meta_str}</div>'
        f'<div style="font-family:\'DM Mono\',monospace;font-size:1.55rem;'
        f'font-weight:500;color:{TEXT};margin-bottom:0.1rem;">{fmt_price(price)}</div>'
        f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.7rem;'
        f'color:{MUTED};">Market cap {fmt_market_cap(market_cap)}</div>'
        f'</div>'

        # ── Col 2: Verdict + bullets ──
        f'<div style="border-left:1px solid {BORDER};padding-left:1.6rem;">'
        f'<p style="font-family:\'DM Sans\',sans-serif;font-size:0.85rem;'
        f'font-style:italic;color:{MUTED};line-height:1.65;margin:0 0 0.75rem 0;">'
        f'"{one_liner}"</p>'
        + (f'<div>{tw_html}</div>' if tw_html else '')
        + f'</div>'

        # ── Col 3: Score ──
        f'<div style="border-left:1px solid {BORDER};padding-left:1.4rem;">'
        f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.56rem;'
        f'font-weight:600;letter-spacing:0.14em;text-transform:uppercase;'
        f'color:{FAINT};margin-bottom:0.2rem;">Score</div>'
        f'<div style="font-family:\'DM Mono\',monospace;font-size:4.2rem;'
        f'font-weight:500;color:{sc};line-height:1;letter-spacing:-0.02em;">'
        f'{int(total_score)}</div>'
        f'<div style="font-family:\'DM Mono\',monospace;font-size:0.7rem;'
        f'color:{FAINT};margin-bottom:0.55rem;">/ 100</div>'
        f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.68rem;'
        f'font-weight:600;color:{sc};letter-spacing:0.05em;">{nuanced_label}</div>'
        + conf_html
        + f'</div>'

        f'</div>'
        f'</div>'
    )


# ---------------------------------------------------------------------------
# Key takeaways — kept for API compatibility, no-op since hero shows them
# ---------------------------------------------------------------------------

def render_key_takeaways(takeaways: list) -> None:
    return


# ---------------------------------------------------------------------------
# Score breakdown — compact table
# ---------------------------------------------------------------------------

def render_score_breakdown(scores: dict) -> None:
    st.markdown("## Score Breakdown")

    cats = [
        ("Valuation",           "valuation",     20, "Valuation"),
        ("Analyst Expectations","analyst",        15, "Analyst"),
        ("Profitability",       "profitability",  20, "Profitability"),
        ("Cash Flow & Debt",    "cashflow",       20, "Cash Flow & Debt"),
        ("Technical Position",  "technical",      15, "Technical Position"),
        ("Data Confidence",     "confidence",     10, "Data Confidence"),
    ]

    rows_html = ""
    for display, key, max_s, tt_key in cats:
        res = scores[key]
        s = res["score"]
        colour = _cat_colour(s, max_s)
        arrow, status = _cat_status(s, max_s)
        tt_content = CATEGORY_TOOLTIPS.get(tt_key, "")
        name_html = _tt(display, tt_content)

        blurb = ""
        if res.get("reasons"):
            raw = res["reasons"][0]
            blurb = raw[:100] + ("…" if len(raw) > 100 else "")
        elif res.get("warnings"):
            raw = res["warnings"][0]
            blurb = raw[:100] + ("…" if len(raw) > 100 else "")

        rows_html += (
            f'<tr style="border-bottom:1px solid {BORDER};overflow:visible;">'
            f'<td style="padding:0.65rem 0.9rem;font-weight:500;overflow:visible;">'
            f'{name_html}</td>'
            f'<td style="padding:0.65rem 0.9rem;font-family:\'DM Mono\',monospace;'
            f'font-size:0.85rem;font-weight:500;color:{TEXT};text-align:right;'
            f'white-space:nowrap;">{s}&thinsp;/&thinsp;{max_s}</td>'
            f'<td style="padding:0.65rem 0.9rem;white-space:nowrap;">'
            f'<span style="color:{colour};font-weight:600;">{arrow}</span>'
            f'&nbsp;<span style="color:{colour};font-size:0.78rem;">{status}</span>'
            f'</td>'
            f'<td style="padding:0.65rem 0.9rem;color:{MUTED};font-size:0.78rem;'
            f'line-height:1.45;">{blurb}</td>'
            f'</tr>'
        )

    _h(
        f'<table class="rr-score-tbl" style="background:{SURFACE};'
        f'border:1px solid {BORDER2};margin-bottom:0.5rem;overflow:visible;">'
        f'<thead><tr>'
        f'<th>Category</th>'
        f'<th style="text-align:right;">Score</th>'
        f'<th>Signal</th>'
        f'<th>Key driver</th>'
        f'</tr></thead>'
        f'<tbody>{rows_html}</tbody>'
        f'</table>'
    )


# ---------------------------------------------------------------------------
# Score anatomy
# ---------------------------------------------------------------------------

def render_score_anatomy(anatomy: dict) -> None:
    st.markdown("## Score Anatomy")
    positives = anatomy.get("positives", [])
    negatives = anatomy.get("negatives", [])
    neutrals  = anatomy.get("neutrals", [])

    def _col(title: str, colour: str, icon: str, items: list) -> str:
        body = (
            "".join(
                f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.78rem;'
                f'color:{TEXT};padding:0.22rem 0;border-bottom:1px solid {BORDER};'
                f'line-height:1.45;">{item}</div>'
                for item in items
            ) if items else
            f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.75rem;'
            f'color:{FAINT};font-style:italic;">None identified</div>'
        )
        count_str = f" ({len(items)})" if items else ""
        return (
            f'<div style="background:{SURFACE};border:1px solid {BORDER2};'
            f'border-top:2px solid {colour};padding:0.9rem 1rem;">'
            f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.58rem;'
            f'font-weight:600;letter-spacing:0.14em;text-transform:uppercase;'
            f'color:{colour};margin-bottom:0.5rem;">{icon} {title}{count_str}</div>'
            f'{body}</div>'
        )

    _h(
        f'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;'
        f'gap:0.5rem;margin-bottom:0.5rem;">'
        + _col("Working for it", POS, "↑", positives)
        + _col("Pulling it down", NEG, "↓", negatives)
        + _col("Neutral factors", MUTED, "–", neutrals)
        + "</div>"
    )


# ---------------------------------------------------------------------------
# Rastogi Verdict — memo panel
# ---------------------------------------------------------------------------

def render_verdict_box(verdict_text: str, mode: str = "analyst") -> None:
    mode_label = "Plain-English Mode" if mode == "beginner" else "Analyst Mode"
    _h(
        f'<div style="border-left:3px solid {BORDER2};padding:1.1rem 1.4rem;'
        f'background:{SURFACE};margin-bottom:1rem;">'
        f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.57rem;'
        f'font-weight:600;letter-spacing:0.16em;text-transform:uppercase;'
        f'color:{FAINT};margin-bottom:0.65rem;">Rastogi Verdict &mdash; {mode_label}</div>'
        f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.9rem;'
        f'color:{TEXT};line-height:1.85;">{verdict_text}</div>'
        f'</div>'
    )


# ---------------------------------------------------------------------------
# Metric evidence table
# ---------------------------------------------------------------------------

def render_metric_table(
    rows: List[Dict[str, Any]],
    signal_filter: str = "all",
    category_filter: str = "all",
) -> None:

    if category_filter != "all":
        rows = [r for r in rows if r["Category"].lower() == category_filter.lower()]
    if signal_filter != "all":
        rows = [r for r in rows if r["Signal"].lower() == signal_filter.lower()]

    if not rows:
        _h(
            f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.82rem;'
            f'color:{MUTED};padding:1.2rem;background:{SURFACE};'
            f'border:1px solid {BORDER2};">No metrics match the selected filter.</div>'
        )
        return

    sig_badge = {
        "positive": f'<span style="color:{POS};font-weight:600;font-size:0.78rem;">↑ Positive</span>',
        "neutral":  f'<span style="color:{MUTED};font-size:0.78rem;">– Neutral</span>',
        "caution":  f'<span style="color:{CAUT};font-weight:500;font-size:0.78rem;">→ Caution</span>',
        "negative": f'<span style="color:{NEG};font-weight:600;font-size:0.78rem;">↓ Negative</span>',
    }

    html = (
        f'<table class="rr-ev-tbl" style="background:{SURFACE};'
        f'border:1px solid {BORDER2};overflow:visible;">'
        f'<thead><tr>'
        f'<th>Metric</th>'
        f'<th style="text-align:right;">Value</th>'
        f'<th>Signal</th>'
        f'<th>Notes</th>'
        f'</tr></thead><tbody>'
    )

    prev_cat = None
    for i, row in enumerate(rows):
        cat = row["Category"]
        if cat != prev_cat:
            prev_cat = cat
            html += (
                f'<tr class="rr-cat-row">'
                f'<td colspan="4">{cat}</td></tr>'
            )

        bg = SURFACE if i % 2 == 0 else SURFACE2
        sig_key = row["Signal"].lower()
        sig = sig_badge.get(sig_key, f'<span style="color:{MUTED};">{row["Signal"]}</span>')
        tooltip = row.get("tooltip", "")

        if tooltip:
            metric_cell = (
                f'<span class="rr-tt" style="overflow:visible;">'
                f'<span style="font-weight:500;color:{TEXT};">{row["Metric"]}</span>'
                f'<i class="rr-tt-i">?</i>'
                f'<span class="rr-tt-box">{tooltip}</span>'
                f'</span>'
            )
        else:
            metric_cell = f'<span style="font-weight:500;color:{TEXT};">{row["Metric"]}</span>'

        html += (
            f'<tr style="background:{bg};">'
            f'<td style="overflow:visible;">{metric_cell}</td>'
            f'<td style="text-align:right;font-family:\'DM Mono\',monospace;'
            f'font-weight:500;font-size:0.86rem;color:{TEXT};white-space:nowrap;">'
            f'{row["Value"]}</td>'
            f'<td style="white-space:nowrap;">{sig}</td>'
            f'<td style="color:{MUTED};font-size:0.78rem;line-height:1.45;">'
            f'{row["Notes"]}</td>'
            f'</tr>'
        )

    _h(html + "</tbody></table>")


# ---------------------------------------------------------------------------
# Category detail
# ---------------------------------------------------------------------------

def render_category_detail(
    display_name: str,
    result: dict,
    mode: str = "analyst",
    explainer: dict = None,
) -> None:
    reasons  = result.get("reasons", [])
    warnings = result.get("warnings", [])

    if not reasons and not warnings and not explainer:
        return

    st.markdown(f"## {display_name}")

    if explainer and mode == "beginner":
        _h(
            f'<div style="background:{SURFACE2};border-left:2px solid {BORDER2};'
            f'padding:0.7rem 1rem;margin-bottom:0.8rem;">'
            f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.57rem;'
            f'font-weight:600;letter-spacing:0.15em;text-transform:uppercase;'
            f'color:{FAINT};margin-bottom:0.35rem;">What this means</div>'
            f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.85rem;'
            f'color:{TEXT};line-height:1.75;">{explainer.get("beginner", "")}</div>'
            f'</div>'
        )

    if reasons:
        items = "".join(
            f'<li style="margin-bottom:0.3rem;line-height:1.55;font-size:0.82rem;'
            f'font-family:\'DM Sans\',sans-serif;">{r}</li>'
            for r in reasons
        )
        _h(f'<ul style="color:{TEXT};padding-left:1.2rem;margin-bottom:0.6rem;">{items}</ul>')

    if warnings:
        items = "".join(
            f'<li style="margin-bottom:0.2rem;color:{CAUT};font-size:0.78rem;'
            f'font-family:\'DM Sans\',sans-serif;">{w}</li>'
            for w in warnings
        )
        _h(f'<ul style="padding-left:1.2rem;margin-bottom:0.6rem;">{items}</ul>')

    if explainer and mode == "analyst":
        with st.expander("Why this category matters"):
            _h(
                f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.84rem;'
                f'color:{TEXT};line-height:1.75;padding:0.5rem 0;">'
                f'{explainer.get("analyst", "")}</div>'
            )


# ---------------------------------------------------------------------------
# Price chart — light theme
# ---------------------------------------------------------------------------

def render_price_chart(
    history: Optional[pd.DataFrame],
    data: dict,
    technicals: dict,
) -> None:
    if history is None or history.empty:
        st.info("No historical price data available.")
        return

    st.markdown("## 1-Year Price Chart")

    closes = history["Close"]
    ma50   = closes.rolling(50).mean()
    ma200  = closes.rolling(200).mean()

    cutoff = pd.Timestamp.now(tz=history.index.tz) - pd.DateOffset(years=1)
    disp       = history[history.index >= cutoff]
    disp_ma50  = ma50[ma50.index >= cutoff]
    disp_ma200 = ma200[ma200.index >= cutoff]
    if disp.empty:
        disp, disp_ma50, disp_ma200 = history, ma50, ma200

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=disp.index, y=disp["Close"], name="Price",
        line=dict(color=TEXT, width=1.5),
        fill="tozeroy", fillcolor="rgba(26,26,26,0.03)",
        hovertemplate="<b>$%{y:.2f}</b><extra>Price</extra>",
    ))
    fig.add_trace(go.Scatter(
        x=disp_ma50.index, y=disp_ma50.values, name="50D MA",
        line=dict(color=CAUT, width=1.3, dash="dash"),
        hovertemplate="$%{y:.2f}<extra>50D MA</extra>",
    ))
    fig.add_trace(go.Scatter(
        x=disp_ma200.index, y=disp_ma200.values, name="200D MA",
        line=dict(color=POS, width=1.3, dash="dot"),
        hovertemplate="$%{y:.2f}<extra>200D MA</extra>",
    ))

    hi52 = data.get("fifty_two_week_high") or technicals.get("fifty_two_week_high")
    if hi52:
        fig.add_hline(
            y=hi52,
            line=dict(color=NEG, width=0.8, dash="dot"),
            annotation_text=f"  52W Hi ${hi52:.2f}",
            annotation_font=dict(size=9, color=NEG, family="DM Mono, monospace"),
            annotation_position="right",
        )

    fig.update_layout(
        plot_bgcolor=SURFACE,
        paper_bgcolor=BG,
        font=dict(family="DM Sans, sans-serif", color=MUTED, size=10),
        xaxis=dict(
            showgrid=True, gridcolor=BORDER, gridwidth=0.5,
            tickformat="%b '%y", linecolor=BORDER2,
            tickfont=dict(size=9, color=MUTED),
            title=None, zeroline=False,
        ),
        yaxis=dict(
            showgrid=True, gridcolor=BORDER, gridwidth=0.5,
            tickprefix="$", linecolor=BORDER2, side="right",
            tickfont=dict(size=9, color=MUTED),
            title=None, zeroline=False,
        ),
        legend=dict(
            orientation="h", x=0, y=1.05,
            bgcolor="rgba(255,255,255,0.9)", bordercolor=BORDER2, borderwidth=1,
            font=dict(size=9, color=TEXT),
        ),
        margin=dict(l=20, r=75, t=25, b=40),
        hovermode="x unified",
        hoverlabel=dict(
            bgcolor=SURFACE, bordercolor=BORDER2,
            font=dict(family="DM Sans, sans-serif", size=10, color=TEXT),
        ),
        height=340,
    )
    st.plotly_chart(fig, use_container_width=True)


# ---------------------------------------------------------------------------
# Chart read panel
# ---------------------------------------------------------------------------

def render_chart_read_panel(text: str, data: dict, technicals: dict) -> None:
    st.markdown("## Chart Read")

    cur   = technicals.get("current_price") or data.get("current_price")
    hi52  = technicals.get("fifty_two_week_high") or data.get("fifty_two_week_high")
    ma50  = technicals.get("fifty_day_ma") or data.get("fifty_day_ma")
    ma200 = technicals.get("two_hundred_day_ma") or data.get("two_hundred_day_ma")

    chips = []
    if cur and hi52 and hi52 > 0:
        gap = (hi52 - cur) / cur
        val = f"{gap*100:.0f}% below 52W high" if gap > 0 else "Above 52W high"
        col = CAUT if 0.15 < gap <= 0.35 else (POS if gap <= 0.15 else (NEG if gap > 0.40 else MUTED))
        chips.append((val, col))
    if cur and ma50:
        above = cur > ma50
        chips.append((("Above" if above else "Below") + " 50D MA", POS if above else NEG))
    if cur and ma200:
        above = cur > ma200
        chips.append((("Above" if above else "Below") + " 200D MA", POS if above else NEG))

    if chips:
        chip_html = "".join(
            f'<span style="display:inline-block;background:{SURFACE2};'
            f'border:1px solid {BORDER2};border-left:2px solid {c};'
            f'padding:0.25rem 0.6rem;margin-right:0.4rem;margin-bottom:0.4rem;'
            f'font-family:\'DM Sans\',sans-serif;font-size:0.74rem;'
            f'font-weight:500;color:{c};">{v}</span>'
            for v, c in chips
        )
        _h(f'<div style="margin-bottom:0.8rem;">{chip_html}</div>')

    _h(
        f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.87rem;'
        f'color:{TEXT};line-height:1.8;background:{SURFACE};'
        f'border-left:2px solid {BORDER2};padding:0.9rem 1.2rem;'
        f'margin-bottom:1rem;">{text}</div>'
    )


# ---------------------------------------------------------------------------
# Glossary — compact, optional
# ---------------------------------------------------------------------------

def render_glossary(glossary: list) -> None:
    st.markdown("## Glossary")
    _h(
        f'<p style="font-family:\'DM Sans\',sans-serif;font-size:0.78rem;'
        f'color:{MUTED};margin-bottom:0.8rem;line-height:1.6;">'
        f'Plain-English definitions for every metric in this analysis.</p>'
    )
    for item in glossary:
        term = item.get("term", "")
        abbr = item.get("abbr", "")
        label = f"{abbr}  —  {term}" if abbr and abbr != term else term
        with st.expander(label):
            defn = item.get("definition", "")
            example = item.get("example", "")
            _h(
                f'<div style="padding:0.3rem 0;">'
                f'<p style="font-family:\'DM Sans\',sans-serif;font-size:0.83rem;'
                f'color:{TEXT};line-height:1.7;margin:0 0 0.4rem 0;">{defn}</p>'
                + (
                    f'<p style="font-family:\'DM Mono\',monospace;font-size:0.74rem;'
                    f'color:{MUTED};background:{SURFACE2};border-left:2px solid {BORDER2};'
                    f'padding:0.35rem 0.7rem;margin:0;">'
                    f'<span style="font-family:\'DM Sans\',sans-serif;font-size:0.57rem;'
                    f'font-weight:600;letter-spacing:0.1em;text-transform:uppercase;'
                    f'color:{FAINT};">Example: </span>{example}</p>'
                    if example else ""
                )
                + '</div>'
            )


# ---------------------------------------------------------------------------
# Disclaimer
# ---------------------------------------------------------------------------

def render_disclaimer() -> None:
    st.markdown("<hr>", unsafe_allow_html=True)
    _h(
        f'<p style="font-family:\'DM Sans\',sans-serif;font-size:0.71rem;'
        f'color:{FAINT};line-height:1.65;margin:0;">'
        f'<strong style="color:{MUTED};font-weight:500;">Disclaimer:</strong> '
        f'RastogiRaterAI is for educational purposes only and does not constitute '
        f'financial advice. Scores are analytical outputs based on publicly available data '
        f'and do not represent a recommendation to buy, sell, or hold any security. '
        f'Analyst consensus labels are third-party data — not RastogiRaterAI recommendations. '
        f'Conduct independent research and consult a qualified adviser before making '
        f'investment decisions.</p>'
    )
