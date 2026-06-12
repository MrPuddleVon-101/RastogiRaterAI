"""
app.py — RastogiRaterAI: A colder look at hot stocks.
"""

import streamlit as st

st.set_page_config(
    page_title="RastogiRaterAI",
    page_icon="▲",
    layout="wide",
    initial_sidebar_state="collapsed",
)

import pandas as pd

from data_fetcher import compute_technicals, fetch_historical_prices, fetch_stock_data
from explanations import (
    generate_beginner_verdict,
    generate_chart_read_text,
    generate_key_takeaways,
    generate_metric_table,
    generate_one_line_verdict,
    generate_rastogi_verdict,
    generate_score_anatomy,
    get_nuanced_verdict_label,
)
from scoring import calculate_overall_score, get_rating_label
from tooltips import CATEGORY_EXPLAINERS, GLOSSARY, METRIC_TOOLTIPS, RICH_TOOLTIPS_BY_DISPLAY
from ui_helpers import (
    fmt_market_cap,
    fmt_price,
    inject_css,
    render_category_detail,
    render_chart_read_panel,
    render_disclaimer,
    render_empty_state,
    render_glossary,
    render_header,
    render_hero,
    render_key_takeaways,
    render_metric_table,
    render_price_chart,
    render_score_anatomy,
    render_score_breakdown,
    render_verdict_box,
    _h,
    ACCENT, BG, SURFACE, BORDER2, TEXT, MUTED, FAINT, NEG, POS, CAUT,
)

# ---------------------------------------------------------------------------
# CSS & fonts
# ---------------------------------------------------------------------------

inject_css()

# ---------------------------------------------------------------------------
# Session state bootstrap
# ---------------------------------------------------------------------------

if "results" not in st.session_state:
    st.session_state.results = None
if "mode" not in st.session_state:
    st.session_state.mode = "Analyst"
if "signal_filter" not in st.session_state:
    st.session_state.signal_filter = "all"
if "cat_filter" not in st.session_state:
    st.session_state.cat_filter = "all"

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------

render_header()

# ---------------------------------------------------------------------------
# Input zone
# ---------------------------------------------------------------------------

# Handle quick-pick prefill
_prefill = st.session_state.pop("_prefill_ticker", "")

col_input, col_btn, col_mode, _ = st.columns([3, 1, 2, 2])

with col_input:
    ticker_input = st.text_input(
        label="Ticker",
        label_visibility="collapsed",
        value=_prefill or (st.session_state.results or {}).get("ticker", ""),
        placeholder="Enter ticker — AAPL, MSFT, NVDA, TSLA…",
        key="ticker_field",
    )

with col_btn:
    rate_clicked = st.button("Rate Stock", type="primary", use_container_width=True)

with col_mode:
    mode = st.radio(
        "Mode",
        ["Analyst", "Beginner"],
        horizontal=True,
        label_visibility="collapsed",
        key="mode",
        help="Analyst Mode uses sharp analytical language. Beginner Mode explains the score in plain English.",
    )

# Quick-pick ticker buttons
SAMPLE_TICKERS = ["AAPL", "MSFT", "NVDA", "TSLA", "AVGO", "JPM", "COST"]
qcols = st.columns(len(SAMPLE_TICKERS) + 1)
qcols[0].markdown(
    f'<span style="font-family:\'DM Sans\',sans-serif;font-size:0.62rem;'
    f'letter-spacing:0.08em;text-transform:uppercase;color:{FAINT};">Quick pick:</span>',
    unsafe_allow_html=True,
)
for i, t in enumerate(SAMPLE_TICKERS):
    if qcols[i + 1].button(t, key=f"quick_{t}"):
        st.session_state["_prefill_ticker"] = t
        st.rerun()

# ---------------------------------------------------------------------------
# Manual analyst target expander
# ---------------------------------------------------------------------------

with st.expander("Manual Analyst Price Targets  (optional)"):
    _h(
        f'<div style="font-family:\'DM Sans\',sans-serif;font-size:0.78rem;color:{MUTED};'
        f'margin-bottom:0.8rem;line-height:1.6;">'
        f'Enter targets from specific firms. When provided, these replace automated consensus data '
        f'in the Analyst Expectations score and trigger dispersion analysis.</div>'
    )
    mc1, mc2, mc3 = st.columns(3)
    with mc1:
        ms_t   = st.text_input("Morgan Stanley",  placeholder="e.g. 225.00", key="ms")
        gs_t   = st.text_input("Goldman Sachs",   placeholder="e.g. 230.00", key="gs")
        jpm_t  = st.text_input("JP Morgan",       placeholder="e.g. 220.00", key="jpm")
    with mc2:
        ubs_t  = st.text_input("UBS",             placeholder="e.g. 215.00", key="ubs")
        citi_t = st.text_input("Citi",            placeholder="e.g. 210.00", key="citi")
        bofa_t = st.text_input("Bank of America", placeholder="e.g. 225.00", key="bofa")
    with mc3:
        c1n    = st.text_input("Custom Firm 1 — Name",   placeholder="e.g. Jefferies", key="c1n")
        c1t    = st.text_input("Custom Firm 1 — Target", placeholder="e.g. 235.00",    key="c1t")
        c2n    = st.text_input("Custom Firm 2 — Name",   placeholder="e.g. Barclays",  key="c2n")
        c2t    = st.text_input("Custom Firm 2 — Target", placeholder="e.g. 240.00",    key="c2t")


def _parse_targets() -> dict:
    raw = {
        "Morgan Stanley": ms_t, "Goldman Sachs": gs_t, "JP Morgan": jpm_t,
        "UBS": ubs_t, "Citi": citi_t, "Bank of America": bofa_t,
        (c1n.strip() or "Custom 1"): c1t, (c2n.strip() or "Custom 2"): c2t,
    }
    out = {}
    for firm, val in raw.items():
        if val and val.strip():
            try:
                v = float(val.replace(",", "").replace("$", "").strip())
                if v > 0:
                    out[firm] = v
            except ValueError:
                pass
    return out


# ---------------------------------------------------------------------------
# Execute rating
# ---------------------------------------------------------------------------

should_rate = rate_clicked or bool(_prefill)
ticker = (ticker_input or _prefill).strip().upper()

if should_rate and ticker:
    manual_targets = _parse_targets()

    with st.status(f"Analysing {ticker}…", expanded=True) as status:
        st.write("Pulling market data…")
        data = fetch_stock_data(ticker)

        if "error" in data:
            status.update(label="Failed to retrieve data", state="error", expanded=True)
            _h(
                f'<div style="background:rgba(217,82,82,0.08);border-left:3px solid {NEG};'
                f'padding:0.8rem 1.1rem;font-family:\'DM Sans\',sans-serif;'
                f'font-size:0.82rem;color:{TEXT};margin-top:0.8rem;">'
                f'<strong style="color:{NEG};">Data retrieval failed.</strong><br>'
                f'{data["error"]}</div>'
            )
            st.stop()

        st.write("Fetching 2 years of price history…")
        history = fetch_historical_prices(ticker)

        # Fallback current price
        if data.get("current_price") is None and history is not None and not history.empty:
            data["current_price"] = float(history["Close"].iloc[-1])
        if data.get("current_price") is None:
            status.update(label="Price unavailable", state="error")
            st.error("Unable to determine current price. The data source may be unavailable for this ticker.")
            st.stop()

        technicals = compute_technicals(data, history)

        st.write("Checking valuation and analyst expectations…")
        st.write("Testing profitability and cash flow strength…")
        st.write("Mapping technical position…")
        scores = calculate_overall_score(data, technicals, manual_targets if manual_targets else None)

        st.write("Building Rastogi Verdict…")
        one_liner      = generate_one_line_verdict(scores, data)
        nuanced_label  = get_nuanced_verdict_label(scores, data)
        analyst_verdict  = generate_rastogi_verdict(scores, data, technicals)
        beginner_verdict = generate_beginner_verdict(scores, data)
        takeaways        = generate_key_takeaways(scores, data, technicals)
        anatomy          = generate_score_anatomy(scores, data, technicals)
        metric_rows      = generate_metric_table(data, scores, technicals)
        chart_read       = generate_chart_read_text(data, technicals)

        # Attach rich tooltips to metric rows
        for row in metric_rows:
            tip = RICH_TOOLTIPS_BY_DISPLAY.get(row["Metric"], "")
            if not tip:
                metric_key = row["Metric"].lower().replace("/", "_").replace(" ", "_").replace("-", "_")
                tip = METRIC_TOOLTIPS.get(metric_key, "")
                if not tip:
                    for k, v in METRIC_TOOLTIPS.items():
                        if k in metric_key or metric_key in k:
                            tip = v
                            break
            row["tooltip"] = tip

        # Store in session state so results survive reruns
        st.session_state.results = {
            "ticker": ticker,
            "data": data,
            "history": history,
            "technicals": technicals,
            "scores": scores,
            "one_liner": one_liner,
            "nuanced_label": nuanced_label,
            "analyst_verdict": analyst_verdict,
            "beginner_verdict": beginner_verdict,
            "takeaways": takeaways,
            "anatomy": anatomy,
            "metric_rows": metric_rows,
            "chart_read": chart_read,
            "manual_targets": manual_targets,
        }

        status.update(
            label=f"Analysis complete — {data.get('company_name', ticker)}  ·  Score: {scores['total']}/100",
            state="complete",
            expanded=False,
        )

elif should_rate and not ticker:
    st.warning("Please enter a ticker symbol.")

# ---------------------------------------------------------------------------
# Render dashboard from session state
# ---------------------------------------------------------------------------

if st.session_state.results:
    r = st.session_state.results
    data       = r["data"]
    history    = r["history"]
    technicals = r["technicals"]
    scores     = r["scores"]
    mode_val   = st.session_state.mode  # 'Analyst' or 'Beginner'

    st.markdown("<hr>", unsafe_allow_html=True)

    # ---- Tabs ----
    tab_overview, tab_evidence, tab_chart = st.tabs([
        "Overview",
        "Evidence",
        "Chart",
    ])

    # ================================================================
    # TAB 1: OVERVIEW
    # ================================================================
    with tab_overview:
        render_hero(
            company_name     = data.get("company_name", r["ticker"]),
            ticker           = r["ticker"],
            price            = data.get("current_price"),
            market_cap       = data.get("market_cap"),
            sector           = data.get("sector"),
            industry         = data.get("industry"),
            total_score      = scores["total"],
            nuanced_label    = r["nuanced_label"],
            one_liner        = r["one_liner"],
            takeaways        = r["takeaways"],
            confidence_score = scores["confidence"]["score"],
        )

        render_score_breakdown(scores)

        st.markdown("## Rastogi Verdict")
        if mode_val == "Beginner":
            render_verdict_box(r["beginner_verdict"], mode="beginner")
        else:
            render_verdict_box(r["analyst_verdict"], mode="analyst")

    # ================================================================
    # TAB 2: EVIDENCE
    # ================================================================
    with tab_evidence:

        # Score anatomy
        render_score_anatomy(r["anatomy"])

        # Metric table with category + signal filters
        st.markdown("## Metric Evidence")

        filter_col1, filter_col2 = st.columns([2, 3])
        with filter_col1:
            cat_options = {
                "All Categories": "all",
                "Valuation": "valuation",
                "Profitability": "profitability",
                "Cash Flow & Debt": "cash flow & debt",
                "Analyst": "analyst",
                "Technical": "technical",
            }
            sel_cat = st.selectbox(
                "Category",
                list(cat_options.keys()),
                key="cat_sel",
                label_visibility="collapsed",
            )
            st.session_state.cat_filter = cat_options[sel_cat]

        with filter_col2:
            sig_map = {"All": "all", "Positive": "positive", "Caution": "caution", "Negative": "negative", "Neutral": "neutral"}
            scols = st.columns(len(sig_map))
            for i, (lbl, val) in enumerate(sig_map.items()):
                if scols[i].button(lbl, key=f"filter_{val}"):
                    st.session_state.signal_filter = val

        render_metric_table(
            r["metric_rows"],
            signal_filter=st.session_state.signal_filter,
            category_filter=st.session_state.cat_filter,
        )

        # Category deep dives
        cat_map = [
            ("Valuation Analysis",       "valuation",    "valuation"),
            ("Analyst Expectations",     "analyst",      "analyst"),
            ("Profitability Analysis",   "profitability","profitability"),
            ("Cash Flow & Debt",         "cashflow",     "cashflow"),
            ("Technical Position",       "technical",    "technical"),
            ("Data Confidence",          "confidence",   "confidence"),
        ]
        for display, key, explainer_key in cat_map:
            explainer = CATEGORY_EXPLAINERS.get(explainer_key, {})
            render_category_detail(
                display_name=display,
                result=scores[key],
                mode=mode_val.lower(),
                explainer=explainer,
            )

        # Manual analyst target summary
        manual = r.get("manual_targets", {})
        if manual:
            st.markdown("## Manual Analyst Targets")
            cur = data.get("current_price") or 0
            rows_t = []
            for firm, tgt in manual.items():
                upside = (tgt - cur) / cur if cur > 0 else None
                rows_t.append({
                    "Firm": firm,
                    "Target": f"${tgt:,.2f}",
                    "vs Current": f"{upside*100:+.1f}%" if upside is not None else "N/A",
                })
            avg_t  = sum(manual.values()) / len(manual)
            hi_t   = max(manual.values())
            lo_t   = min(manual.values())
            disp_v = (hi_t - lo_t) / avg_t if avg_t > 0 else 0
            rows_t.append({"Firm": "— Average",         "Target": f"${avg_t:,.2f}", "vs Current": f"{(avg_t-cur)/cur*100:+.1f}%" if cur > 0 else "N/A"})
            rows_t.append({"Firm": "— High / Low",      "Target": f"${hi_t:,.2f} / ${lo_t:,.2f}", "vs Current": f"Dispersion: {disp_v*100:.0f}%"})
            st.dataframe(pd.DataFrame(rows_t), use_container_width=True, hide_index=True)

        # Data warnings (inside Evidence tab)
        all_warnings = []
        for key in ["valuation", "analyst", "profitability", "cashflow", "technical", "confidence"]:
            all_warnings.extend(scores[key].get("warnings", []))
        if all_warnings:
            with st.expander(f"Data warnings ({len(all_warnings)})"):
                for w in all_warnings:
                    st.warning(w)

        # Optional glossary
        with st.expander("Glossary", expanded=False):
            render_glossary(GLOSSARY)

    # ================================================================
    # TAB 3: CHART
    # ================================================================
    with tab_chart:
        render_price_chart(history, data, technicals)
        render_chart_read_panel(r["chart_read"], data, technicals)

    render_disclaimer()

else:
    # ---- Empty state ----
    render_empty_state()
