# RastogiRaterAI — Backend

FastAPI backend that wraps the existing scoring and data logic and exposes it over HTTP for the Next.js frontend.

## Setup

```bash
cd /Users/vedantrastogi/RastogiRaterAI/backend

# Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

## Endpoint

### `GET /api/rate?ticker=AVGO`

Returns the full scoring payload for a given ticker.

**Query parameters:**
| Parameter | Type   | Required | Description             |
|-----------|--------|----------|-------------------------|
| ticker    | string | Yes      | US stock ticker symbol  |

**Success response (200):**
```json
{
  "ticker": "AVGO",
  "companyName": "Broadcom Inc.",
  "sector": "Technology",
  "industry": "Semiconductors",
  "currentPrice": 376.90,
  "marketCap": 920000000000,
  "overallScore": 74,
  "ratingLabel": "Strong",
  "nuancedLabel": "Strong, but valuation is stretched.",
  "dataConfidence": 9,
  "oneLineVerdict": "Quality score, not a bargain score.",
  "rastogiVerdictAnalyst": "...",
  "rastogiVerdictBeginner": "...",
  "categoryScores": [
    {
      "key": "valuation",
      "name": "Valuation",
      "score": 6,
      "maxScore": 20,
      "signal": "Pressured",
      "signalArrow": "↓",
      "color": "caution",
      "reason": "P/E of 63× prices in a lot of good news.",
      "reasons": ["..."],
      "warnings": []
    }
  ],
  "takeaways": [
    { "type": "positive", "label": "Best argument", "text": "..." },
    { "type": "negative", "label": "Main concern",  "text": "..." },
    { "type": "neutral",  "label": "Technical",     "text": "..." },
    { "type": "positive", "label": "Data",          "text": "9/10 confidence" }
  ],
  "drivers": ["Strong free cash flow of $18B"],
  "drags":   ["P/E of 63× is stretched"],
  "neutral": ["Moderate D/E ratio"],
  "metricEvidence": [
    {
      "category": "Valuation",
      "metric":   "Trailing P/E",
      "value":    "62.5×",
      "signal":   "negative",
      "notes":    "Stretched at 62.5×. Priced for near-perfect delivery.",
      "tooltip":  "Price divided by annual earnings per share..."
    }
  ],
  "chartData": [
    { "date": "2024-06-01", "price": 320.10, "ma50": 310.50, "ma200": 280.20 }
  ],
  "chartRead": {
    "vs52WeekHigh": "12.0% below",
    "vs50DayMA": "Above",
    "vs200DayMA": "Above",
    "summary": "...",
    "hi52Value": 429.00
  },
  "warnings": []
}
```

**Error response (400) — invalid ticker:**
```json
{
  "detail": {
    "detail": "\"XYZ123\" does not appear to be a valid ticker.",
    "ticker": "XYZ123"
  }
}
```

**Error response (500) — unexpected failure:**
```json
{
  "detail": {
    "detail": "Internal error while analysing AAPL: ...",
    "ticker": "AAPL"
  }
}
```

### `GET /health`

Returns `{ "status": "ok", "service": "RastogiRaterAI API" }`.

## Architecture

```
backend/
├── main.py            # FastAPI app and endpoint logic
├── data_fetcher.py    # yfinance data retrieval and technicals
├── scoring.py         # Category-by-category scoring engine
├── explanations.py    # Narrative text generation
├── tooltips.py        # Metric definitions and rich hover text
└── requirements.txt   # Python dependencies
```

## Notes

- CORS is configured to allow `http://localhost:3000` (the Next.js dev server).
- `marketCap` is returned as a raw integer, not a formatted string. The frontend formats it.
- Chart data covers the last 365 days. Rolling 50-day and 200-day MAs are computed on the full 2-year history so the early window values are accurate.
- The backend does not cache responses. Each request hits yfinance live. A caching layer (Redis, etc.) can be added between main.py and data_fetcher.py for production use.
