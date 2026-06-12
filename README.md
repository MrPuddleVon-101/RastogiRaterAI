# RastogiRaterAI

**A colder look at hot stocks.**

---

## Overview

RastogiRaterAI is a stock analysis platform available in two forms:

1. **Streamlit app** (`app.py`) — original Python interface, runs locally.
2. **Full-stack app** (`backend/` + `frontend/`) — FastAPI backend + Next.js 14 frontend with a polished dark-mode UI, particle animation, and interactive charts.

Both share the same scoring and data logic and produce identical results. The score is built from six weighted categories covering valuation, profitability, cash flow, analyst expectations, technical position, and data quality.

The output feels less like a generic dashboard and more like a brief analyst memo — specific, direct, and honest about what the numbers do and do not support.

---

## Full-stack app setup

### Backend (FastAPI)

```bash
cd /Users/vedantrastogi/RastogiRaterAI/backend

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start the API
uvicorn main:app --reload --port 8000
```

API available at: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

**Endpoint:** `GET /api/rate?ticker=AVGO`

### Frontend (Next.js 14)

```bash
cd /Users/vedantrastogi/RastogiRaterAI/frontend

npm install
npm run dev
```

Frontend available at: `http://localhost:3000`

The frontend expects the backend at `http://localhost:8000`. Override via:
```
NEXT_PUBLIC_API_URL=http://your-backend-url
```

### Architecture

```
RastogiRaterAI/
├── app.py                  # Original Streamlit app (unchanged)
├── data_fetcher.py         # Shared source — yfinance data retrieval
├── scoring.py              # Shared source — category scoring engine
├── explanations.py         # Shared source — narrative text generation
├── tooltips.py             # Shared source — metric definitions
│
├── backend/                # FastAPI backend
│   ├── main.py             # GET /api/rate?ticker=AVGO
│   ├── data_fetcher.py     # (copy of shared module)
│   ├── scoring.py          # (copy of shared module)
│   ├── explanations.py     # (copy of shared module)
│   ├── tooltips.py         # (copy of shared module)
│   └── requirements.txt
│
└── frontend/               # Next.js 14 + TypeScript + Tailwind + Recharts
    ├── app/                # App Router pages
    ├── components/         # UI + domain components
    ├── hooks/              # useScreenSize, useDimensions
    └── lib/                # API client, types, utils, tooltips
```

---

---

## Features

- Real-time data retrieval via `yfinance`
- Six-category scoring framework (total: 100 points)
- Sharp, analyst-style written verdict ("Rastogi Verdict")
- Full metric evidence table with signal indicators
- 1-year price chart with 50-day / 200-day moving averages and 52-week high marker
- Optional manual analyst price target input (Morgan Stanley, Goldman Sachs, JP Morgan, UBS, Citi, BofA, custom firms)
- Analyst target dispersion analysis
- Graceful handling of missing / unavailable data
- Premium editorial design (no neon, no gradients, no AI-SaaS aesthetics)

---

## Tech Stack

| Component | Library |
|---|---|
| App framework | Streamlit |
| Market data | yfinance |
| Data manipulation | pandas |
| Charts | Plotly |
| Language | Python 3.9+ |

---

## Installation

```bash
git clone <repo-url>
cd RastogiRaterAI
pip install -r requirements.txt
```

---

## Running the App

```bash
streamlit run app.py
```

Then open [http://localhost:8501](http://localhost:8501) in your browser.

---

## Project Structure

```
RastogiRaterAI/
├── app.py              # Streamlit app entry point
├── data_fetcher.py     # yfinance data retrieval
├── scoring.py          # Transparent scoring logic (6 categories)
├── explanations.py     # Analyst-style narrative generation
├── ui_helpers.py       # CSS, chart, and rendering components
├── requirements.txt
└── README.md
```

---

## Scoring Methodology

| Category | Max Points | Key Inputs |
|---|---|---|
| Valuation | 20 | Trailing P/E, Forward P/E, Price/Book, Price/Sales |
| Analyst Expectations | 15 | Consensus target price, analyst count, recommendation key |
| Profitability | 20 | Net margin, operating margin, ROE, ROA |
| Cash Flow & Debt | 20 | Free cash flow, operating cash flow, debt/equity, current ratio |
| Technical Position | 15 | 52-week high gap, 1-month pullback, moving averages, momentum |
| Data Confidence | 10 | Deducted for each missing data category |
| **Total** | **100** | |

### Valuation thresholds (P/E)
- ≤ 15×: attractive
- 15–25×: reasonable
- 25–40×: elevated
- 40–80×: stretched
- > 80×: very aggressive

### Technical preferred zone
A 20–30% pullback from the 52-week high is scored most favourably — far enough from the top to offer recovery room, close enough that the broader trend has not broken down.

---

## Explanation Methodology

The "Rastogi Verdict" is a paragraph built from conditional logic tied to specific metric values. It identifies:

1. The dominant reason the score is where it is
2. The strongest scoring category with specific metric context
3. The weakest category with honest framing
4. The technical backdrop (moving averages, pullback context)
5. A balanced closing statement

The language is deliberately non-generic. Phrases like "the stock is poised for growth" or "unlocking value" do not appear. The verdict is direct and specific.

---

## Rating Labels

| Score | Label |
|---|---|
| 85–100 | Elite |
| 70–84 | Strong |
| 55–69 | Mixed |
| 40–54 | Weak |
| 0–39 | High Risk |

Labels are rendered with nuance: e.g., "Strong, but valuation is stretched." or "Mixed, but balance-sheet pressure."

---

## Limitations

- Data sourced exclusively from `yfinance`, which mirrors Yahoo Finance. Coverage and freshness vary.
- Some tickers (especially non-US, OTC, or recently listed stocks) may have limited or no fundamental data.
- The 200-day moving average requires approximately 200 days of trading history to display on the chart.
- Scoring thresholds are generalist and do not adjust for sector norms (e.g., banks typically carry higher D/E; REITs use different profitability metrics). Sector-relative scoring is a planned future improvement.
- The model does not adjust for growth stage: an early-stage company with negative margins scores poorly on profitability by design — that is the model's honest read, not a flaw.

---

## Disclaimer

**RastogiRaterAI is for educational purposes only and does not provide financial advice.** Scores are analytical outputs based on publicly available data and do not constitute a recommendation to buy, sell, or hold any security. Past data does not guarantee future performance. Always conduct independent research and consult a qualified financial adviser before making investment decisions.

---

## Future Improvements

- Sector-relative scoring (compare P/E vs. sector median, not absolute thresholds)
- Peer comparison (rate 5 comparable stocks simultaneously)
- Portfolio scoring (aggregate view across multiple tickers)
- PDF report export
- Backtesting (how did the score predict forward returns historically?)
- Monte Carlo risk simulation
- Richer analyst consensus data (Financial Modeling Prep, Alpha Vantage)
- AI-generated narrative using only calculated metrics as structured input
- Sentiment analysis from earnings call transcripts and financial news
- User watchlist with score tracking over time
