"""
tooltips.py — All metric tooltip text, category explainers, and glossary definitions.

Single source of truth for educational content used throughout the app.
"""

# ---------------------------------------------------------------------------
# Short inline tooltips — used in metric table hover titles and st.help params
# ---------------------------------------------------------------------------

METRIC_TOOLTIPS = {
    "trailing_pe": "P/E ratio: price ÷ earnings per share. Higher = more expensive. P/E of 30 means you pay $30 for every $1 earned last year.",
    "forward_pe": "Forward P/E uses expected future earnings instead of past. Lower than trailing P/E suggests analysts expect earnings growth.",
    "price_to_book": "Price relative to net assets. P/B below 1 means the stock is priced below the company's accounting value on paper.",
    "price_to_sales": "Price per dollar of revenue. A high P/S needs strong margins or fast growth to justify. Low P/S is only attractive if the business is healthy.",
    "profit_margin": "Profit kept per dollar of revenue. 20% margin means $0.20 profit from every $1.00 of sales.",
    "operating_margin": "Profit from core operations before interest and taxes — shows how efficient the business model is.",
    "roe": "Return on Equity: profit generated per dollar of shareholder equity. Measures management's efficiency.",
    "roa": "Return on Assets: how efficiently the company uses everything it owns to generate profit.",
    "free_cash_flow": "Cash left after operating expenses and capital investment. Positive FCF = self-funding. Negative = cash burn.",
    "operating_cash_flow": "Cash from core operations. Consistently positive suggests the business runs on its own without external financing.",
    "total_debt": "All money the company owes. Evaluated relative to cash generation — not just as an absolute number.",
    "total_cash": "Liquid reserves. High cash gives the company options: repay debt, survive downturns, or invest in growth.",
    "debt_to_equity": "Debt as a percentage of equity. 150% = $1.50 owed for every $1 of equity. High leverage amplifies both gains and losses.",
    "current_ratio": "Short-term assets ÷ short-term liabilities. Above 1.0 = near-term obligations covered. Below 1.0 = potential liquidity concern.",
    "analyst_target_mean": "Average analyst 12-month price target. Implies expected upside or downside. Third-party data — not an RastogiRaterAI forecast.",
    "analyst_count": "Number of analysts covering the stock. More analysts = more reliable consensus. A single target is almost meaningless.",
    "analyst_recommendation": "Aggregate analyst label from the data provider. Third-party consensus — not RastogiRaterAI's view.",
    "beta": "Sensitivity to market moves. Beta 1.5 = stock tends to move 1.5× the index. Higher = more volatile in both directions.",
    "fifty_two_week_high_gap": "Gap from the 52-week high. RastogiRaterAI treats a 20–30% pullback as a structured opportunity zone.",
    "fifty_two_week_low_buffer": "Distance above the 52-week low. Low buffer = close to recent lows, potential stress signal.",
    "fifty_day_ma": "Average closing price over the past 50 trading days. Short-term trend indicator.",
    "two_hundred_day_ma": "Average closing price over the past 200 trading days. Long-term trend indicator — widely watched threshold.",
    "one_month_return": "Price change over the past month. Positive = recent upward momentum.",
}


# ---------------------------------------------------------------------------
# Category explainers — "Why this category matters" in two modes
# ---------------------------------------------------------------------------

CATEGORY_EXPLAINERS = {
    "valuation": {
        "title": "Why Valuation Matters",
        "analyst": (
            "Valuation measures whether the market is charging a reasonable price for the company's "
            "earnings, assets, and revenue. Premium pricing can be warranted by superior quality or "
            "growth — but it compresses the margin of safety. RastogiRaterAI reduces the valuation "
            "score when multiples are elevated relative to what the underlying numbers support."
        ),
        "beginner": (
            "Think of valuation like the price tag at a restaurant. Even if the food is excellent, "
            "paying $500 for a burger raises the question: is it actually worth that? "
            "In investing, P/E and P/S ratios are the price tags. RastogiRaterAI checks whether "
            "investors are paying a reasonable price for what the company actually earns and sells."
        ),
    },
    "analyst": {
        "title": "Why Analyst Expectations Matter",
        "analyst": (
            "Analyst consensus provides a market-informed view of expected value. It is an imperfect "
            "signal — analysts can be systematically optimistic, delayed, or wrong — but the direction "
            "and magnitude of targets add real information that the model incorporates with appropriate "
            "weight, adjusted for coverage depth and target dispersion."
        ),
        "beginner": (
            "Analysts at banks and research firms spend their careers studying specific companies. "
            "Their price targets give a sense of what informed professionals expect. But they are "
            "frequently wrong, often overly optimistic, and regularly revise. "
            "RastogiRaterAI treats this as one input among many — not a final word."
        ),
    },
    "profitability": {
        "title": "Why Profitability Matters",
        "analyst": (
            "Profitability measures whether revenue is being converted into income with discipline. "
            "High-margin businesses are more resilient to cost pressure and economic cycles. "
            "Persistent losses require the future to carry the entire weight of the investment "
            "case — a burden the model reflects explicitly in the score."
        ),
        "beginner": (
            "Profitability is simple: can the company actually make money? "
            "A business earning huge revenue but spending nearly all of it is fragile. "
            "A business that keeps a healthy portion as profit has more cushion when "
            "things get harder. RastogiRaterAI rewards businesses that convert sales into real income."
        ),
    },
    "cashflow": {
        "title": "Why Cash Flow & Debt Matter",
        "analyst": (
            "Free cash flow is the oxygen of a business. Strong FCF indicates the company generates "
            "more than it spends on operations and maintenance capital — creating financial flexibility. "
            "Debt is evaluated relative to cash generation, not in isolation. The concern is whether "
            "leverage becomes a constraint under stress, not whether it exists at all."
        ),
        "beginner": (
            "Imagine someone earning a solid salary but carrying so much credit card debt they can "
            "barely make monthly payments. That is what high debt and weak cash flow looks like for a "
            "company. RastogiRaterAI checks whether the business generates enough cash to operate "
            "independently, and whether the debt load is manageable relative to that cash."
        ),
    },
    "technical": {
        "title": "Why Technical Position Matters",
        "analyst": (
            "The technical score does not predict future prices. It describes where the stock currently "
            "sits relative to its recent history — whether momentum is supportive or a headwind. "
            "The model scores favourably when a pullback from highs has been structured without "
            "breaking longer-term moving averages, suggesting temporary cooling rather than real damage."
        ),
        "beginner": (
            "Technical analysis looks at the price chart rather than company finances. "
            "It asks: where is the price compared to its recent high? Is it above or below its "
            "average price over the last few months? RastogiRaterAI uses these to understand whether "
            "the stock's price momentum is healthy, cooling, or broken — but does not predict where "
            "the price will go."
        ),
    },
    "confidence": {
        "title": "Why Data Confidence Matters",
        "analyst": (
            "The confidence score reflects the completeness of available data. When key metrics are "
            "absent, the model cannot score those dimensions accurately and must neutralise them. "
            "A lower confidence score does not indicate a bad company — it indicates a less complete "
            "analysis. Treat low-confidence scores as directional, not precise."
        ),
        "beginner": (
            "Not every company has all its financial data cleanly available. When numbers are missing, "
            "RastogiRaterAI scores lower on confidence — essentially saying: 'I can only see part of "
            "the picture here.' A 10/10 confidence score means the model had full data to work with. "
            "A 5/10 means the score is based on about half the normal inputs."
        ),
    },
}


# ---------------------------------------------------------------------------
# Full glossary — used in the Glossary tab
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Rich hover tooltips — keyed by metric display name for direct lookup
# ---------------------------------------------------------------------------

RICH_TOOLTIPS_BY_DISPLAY = {
    "Trailing P/E": (
        "Price divided by annual earnings per share. A P/E of 30 means you pay $30 for each $1 the company earned last year.<br><br>"
        "High P/E = expensive, usually because investors expect growth. Low P/E = cheaper, or the market doubts future earnings.<br><br>"
        "RastogiRaterAI penalises extreme P/E values — expensive stocks leave less room for operational disappointment."
    ),
    "Forward P/E": (
        "Same as trailing P/E but uses analyst estimates of future earnings. A forward P/E meaningfully below trailing P/E suggests analysts expect earnings growth.<br><br>"
        "RastogiRaterAI treats a significant forward improvement as a minor positive, but does not over-weight analyst estimates."
    ),
    "Price/Book": (
        "Stock price divided by net assets per share. P/B below 1 means the stock trades below its accounting value on paper.<br><br>"
        "Very high P/B is common in asset-light businesses (software, consumer brands). RastogiRaterAI penalises extreme values but accounts for sector context."
    ),
    "Price/Sales": (
        "Market cap divided by annual revenue. A P/S of 10 means investors pay $10 for every $1 of revenue.<br><br>"
        "High P/S is only justified by strong margins or fast growth. Low P/S is only attractive if the business is otherwise healthy."
    ),
    "Net Profit Margin": (
        "What percentage of revenue becomes profit after all costs, taxes, and interest. A 20% margin means $0.20 of profit from every $1 of sales.<br><br>"
        "Above 20% is genuinely strong. Under 5% is thin and vulnerable to cost pressure. RastogiRaterAI rewards high margins heavily — they signal pricing power."
    ),
    "Operating Margin": (
        "Profit from core operations before interest and taxes. Shows how efficient the business model is, separate from how the company is financed.<br><br>"
        "RastogiRaterAI uses this alongside net margin to check whether profitability is genuine or an accounting artefact."
    ),
    "Return on Equity": (
        "Annual profit divided by shareholder equity. Measures how efficiently management uses the capital shareholders have put in.<br><br>"
        "Above 15% is solid. Above 25% often signals a durable competitive advantage. RastogiRaterAI reads ROE alongside debt — high leverage can inflate the figure."
    ),
    "Return on Assets": (
        "Annual profit divided by total assets. Measures how efficiently the company uses everything it owns to generate earnings.<br><br>"
        "High ROE can be faked with debt. High ROA is harder to manufacture. RastogiRaterAI uses both together."
    ),
    "Free Cash Flow": (
        "Cash left after paying operating costs and capital investments. What remains for debt repayment, reinvestment, or returning to shareholders.<br><br>"
        "Positive FCF means the business funds itself. Negative FCF means it depends on external financing. RastogiRaterAI treats this as one of the clearest quality signals."
    ),
    "Operating Cash Flow": (
        "Cash generated from core business operations before capital expenditures. Harder to manipulate than reported earnings.<br><br>"
        "A company reporting profits but negative operating cash flow warrants scrutiny. RastogiRaterAI uses OCF as a sanity check."
    ),
    "Total Debt": (
        "All money owed by the company — bonds, bank loans, leases. The absolute number means little on its own; it must be read against cash generation.<br><br>"
        "RastogiRaterAI compares debt against cash and free cash flow to assess whether the load is manageable."
    ),
    "Total Cash": (
        "Liquid assets on hand. High cash gives options: repay debt, survive downturns, invest in growth, or return capital to shareholders.<br><br>"
        "RastogiRaterAI compares cash against total debt to assess net financial position."
    ),
    "Debt/Equity": (
        "Total debt as a percentage of shareholder equity. Shows how much of the business is funded by borrowed money versus owner capital.<br><br>"
        "Under 50% is conservative. Above 400% amplifies both gains and losses significantly. Some sectors (banks, utilities) routinely carry higher ratios."
    ),
    "Current Ratio": (
        "Short-term assets divided by short-term liabilities. Measures ability to cover obligations due within 12 months.<br><br>"
        "Above 1.5 is comfortable. Below 1.0 means current obligations exceed liquid assets — a potential liquidity concern."
    ),
    "Consensus Target": (
        "The average 12-month price target from analysts covering the stock. Implies expected upside or downside from the current price.<br><br>"
        "This is third-party data — not a RastogiRaterAI forecast or recommendation. Coverage depth matters: 20 analysts is meaningful; 2 is not."
    ),
    "Analyst Coverage": (
        "Number of analysts actively providing price targets. More analysts means more diverse views and a more reliable consensus.<br><br>"
        "RastogiRaterAI reduces the analyst score when coverage is thin — a consensus of 2 is not really a consensus."
    ),
    "Recommendation": (
        "The aggregate analyst recommendation from data providers: Strong Buy, Buy, Hold, Underperform, Sell.<br><br>"
        "This is third-party data. RastogiRaterAI does not make buy, sell, or hold recommendations. This label is used as a supporting signal only."
    ),
    "Beta": (
        "Measures how much the stock tends to move relative to the broader market. Beta 1.0 = moves with the market. Beta 1.5 = tends to move 50% more in both directions.<br><br>"
        "RastogiRaterAI notes beta as context — volatile growth stocks can still be strong businesses."
    ),
    "vs 50-Day MA": (
        "The average closing price over the past 50 trading days. A widely watched short-term trend indicator.<br><br>"
        "Price above the 50-day MA suggests short-term momentum is intact. Price below means it has faded. RastogiRaterAI looks for price above both 50-day and 200-day as a constructive setup."
    ),
    "vs 200-Day MA": (
        "The average closing price over the past 200 trading days (~10 months). The most watched long-term trend indicator — used widely by institutions.<br><br>"
        "Falling below the 200-day is a widely noted bearish signal. Holding above it means the longer-term trend is intact."
    ),
    "52-Week High Gap": (
        "The percentage distance between the current price and the highest price of the past year.<br><br>"
        "0–10% below: near-peak momentum. 20–30% below: measured pullback — RastogiRaterAI treats this zone as potentially constructive. 50%+ below: significant drawdown that may reflect real deterioration."
    ),
    "52-Week Low Buffer": (
        "How far the current price sits above the lowest price of the past year. Small buffer means the stock is close to its recent worst level.<br><br>"
        "A large buffer provides more historical support. A small buffer may signal ongoing stress."
    ),
    "1-Month Return": (
        "Percentage price change over the past ~21 trading days. Captures recent short-term momentum.<br><br>"
        "RastogiRaterAI uses 1-month return as a minor supporting signal — directional context, not a primary driver."
    ),
}


# ---------------------------------------------------------------------------
# Category-level rich tooltips — for score breakdown hover icons
# ---------------------------------------------------------------------------

CATEGORY_TOOLTIPS = {
    "Valuation": (
        "Scores how reasonably priced the stock is relative to what the company earns, sells, and owns. Uses P/E, Price/Sales, and Price/Book. Max 20 pts.<br><br>"
        "A low valuation score means the stock is expensive — it raises the bar for execution, not that the business is bad."
    ),
    "Analyst": (
        "Scores the consensus view from Wall Street analysts: 12-month price targets, coverage depth, and recommendation label. Third-party data. Max 15 pts.<br><br>"
        "Weighted as a supporting signal. Analyst consensus can be wrong — coverage depth matters."
    ),
    "Profitability": (
        "Scores how well the company converts revenue into earnings. Uses net margin, operating margin, ROE, and ROA. Max 20 pts.<br><br>"
        "Strong profitability signals pricing power. It is one of the two most important categories in the score."
    ),
    "Cash Flow & Debt": (
        "Scores the financial structure: free cash flow, operating cash flow, debt-to-equity, cash vs. debt, and current ratio. Max 20 pts.<br><br>"
        "A company that generates its own cash is different from one that depends on continued financing. This category tests that."
    ),
    "Technical Position": (
        "Scores the stock's price position relative to recent history: 52-week high gap, moving averages, short-term momentum. Max 15 pts.<br><br>"
        "This does not predict future prices. It tells you where the stock is relative to trend — not where it is going."
    ),
    "Data Confidence": (
        "Deducts points for each major data field that was unavailable. A score of 10/10 means full data coverage. Max 10 pts.<br><br>"
        "A low confidence score means the other five categories are working with incomplete information. Treat a low-confidence score as directional, not precise."
    ),
}


GLOSSARY = [
    {
        "term": "Market Capitalisation",
        "abbr": "Market Cap",
        "definition": (
            "The total market value of all a company's outstanding shares. "
            "Calculated by multiplying the share price by the number of shares in existence. "
            "Large-cap stocks (above $10B) are typically more established. "
            "Small-cap stocks (below $2B) can grow faster but carry more risk."
        ),
        "example": "If a stock trades at $100 and there are 10 million shares, market cap = $1 billion.",
    },
    {
        "term": "Price-to-Earnings Ratio (Trailing)",
        "abbr": "Trailing P/E",
        "definition": (
            "Compares the current stock price to earnings per share over the past 12 months. "
            "A high P/E means investors are paying more for each dollar of current earnings — "
            "usually because they expect strong future growth. "
            "If that growth doesn't arrive, high-P/E stocks often fall harder."
        ),
        "example": "P/E of 40 means you pay $40 for every $1 the company earned last year.",
    },
    {
        "term": "Price-to-Earnings Ratio (Forward)",
        "abbr": "Forward P/E",
        "definition": (
            "Uses analyst estimates of future earnings rather than historical figures. "
            "If forward P/E is significantly lower than trailing P/E, analysts expect earnings growth. "
            "But analyst estimates can be — and frequently are — wrong."
        ),
        "example": "Trailing P/E of 40 and forward P/E of 25 implies analysts expect 60% earnings growth.",
    },
    {
        "term": "Price-to-Book Ratio",
        "abbr": "P/B Ratio",
        "definition": (
            "Compares the stock price to net assets (book value). "
            "A P/B below 1 means you are technically buying assets at a discount. "
            "Very high P/B is common in asset-light businesses (software, brands) "
            "but needs strong earnings to justify."
        ),
        "example": "P/B of 5 means the market values the company at 5× its net assets on paper.",
    },
    {
        "term": "Price-to-Sales Ratio",
        "abbr": "P/S Ratio",
        "definition": (
            "Compares the stock price to revenue per share. "
            "Useful for companies without profits yet. "
            "A high P/S requires strong margins or very fast growth to justify. "
            "Low P/S is attractive only if the business model is otherwise healthy."
        ),
        "example": "P/S of 10 means the market pays $10 for every $1 of annual revenue.",
    },
    {
        "term": "Net Profit Margin",
        "abbr": "Profit Margin",
        "definition": (
            "The percentage of revenue that becomes net profit after all costs, taxes, and interest. "
            "Higher margins mean the business is more efficient at converting sales into income. "
            "Strong margins give more cushion during downturns."
        ),
        "example": "A 20% profit margin means the company keeps $0.20 of profit from every $1.00 of sales.",
    },
    {
        "term": "Operating Margin",
        "abbr": "Op. Margin",
        "definition": (
            "Profit from core business operations as a percentage of revenue, before interest and taxes. "
            "Shows how efficient the company's main business is, "
            "separate from how it finances itself."
        ),
        "example": "Operating margin of 15% means $0.15 earned from every $1 in sales before interest and taxes.",
    },
    {
        "term": "Return on Equity",
        "abbr": "ROE",
        "definition": (
            "How much profit the company generates for every dollar of shareholder equity. "
            "High ROE usually signals effective capital deployment. "
            "Very high ROE can also result from heavy debt — so best viewed alongside leverage."
        ),
        "example": "ROE of 25% means the company earned $0.25 for every $1 shareholders have invested.",
    },
    {
        "term": "Return on Assets",
        "abbr": "ROA",
        "definition": (
            "How much profit the company generates per dollar of total assets. "
            "Higher ROA means the company is productive with what it owns. "
            "Asset-heavy industries naturally have lower ROA than asset-light businesses."
        ),
        "example": "ROA of 10% means every $100 of assets generates $10 of annual profit.",
    },
    {
        "term": "Free Cash Flow",
        "abbr": "FCF",
        "definition": (
            "Cash remaining after operating expenses and capital expenditures. "
            "Strong, consistent FCF is one of the most reliable indicators of financial health — "
            "it is harder to manipulate than reported earnings. "
            "It funds debt repayment, buybacks, dividends, and growth."
        ),
        "example": "$500M operating cash flow minus $200M capex = $300M free cash flow.",
    },
    {
        "term": "Operating Cash Flow",
        "abbr": "OCF",
        "definition": (
            "Cash generated purely from running the business, before investment spending. "
            "Consistently positive OCF suggests the business is self-sustaining. "
            "If OCF is negative while earnings are positive, it can signal aggressive accounting."
        ),
        "example": "Even a profitable company can have negative OCF if it is not collecting cash efficiently.",
    },
    {
        "term": "Total Debt",
        "abbr": "Debt",
        "definition": (
            "All money owed by the company, both short-term and long-term. "
            "Debt isn't inherently bad — companies use it to grow. "
            "The question is whether the load is manageable relative to cash flow and earnings."
        ),
        "example": "$5B debt with $3B annual FCF differs vastly from $5B debt with $200M FCF.",
    },
    {
        "term": "Total Cash & Equivalents",
        "abbr": "Cash",
        "definition": (
            "Liquid assets — cash on hand plus short-term investments easily converted to cash. "
            "A strong cash position gives flexibility to survive downturns, invest in growth, "
            "or return capital to shareholders."
        ),
        "example": "Net cash (cash minus debt) is a useful single figure: positive = financially self-sufficient.",
    },
    {
        "term": "Debt-to-Equity Ratio",
        "abbr": "D/E Ratio",
        "definition": (
            "Total debt expressed as a percentage of shareholder equity. "
            "Higher values mean more financial leverage — which amplifies both gains and losses. "
            "Some industries (banks, real estate) naturally carry higher D/E ratios."
        ),
        "example": "D/E of 150% means the company owes $1.50 in debt for every $1 of equity.",
    },
    {
        "term": "Current Ratio",
        "abbr": "Current Ratio",
        "definition": (
            "Short-term assets divided by short-term liabilities. "
            "Above 1.0 = near-term assets cover near-term obligations. "
            "Below 1.0 can signal stress if cash flow weakens unexpectedly."
        ),
        "example": "Current ratio of 2.0 = $2 in current assets for every $1 of current liabilities.",
    },
    {
        "term": "Analyst Price Target",
        "abbr": "Target Price",
        "definition": (
            "The price financial analysts believe a stock will reach within 12 months. "
            "RastogiRaterAI uses the consensus average to calculate implied upside or downside. "
            "This is third-party data — not an RastogiRaterAI forecast or recommendation."
        ),
        "example": "Stock at $100, consensus target $130 = 30% implied upside.",
    },
    {
        "term": "Analyst Coverage",
        "abbr": "No. of Analysts",
        "definition": (
            "The number of professional analysts actively following and publishing research on a stock. "
            "Higher coverage means the consensus is based on more independent views, "
            "making it more reliable. A single analyst target deserves almost no weight."
        ),
        "example": "2 analyst targets has far lower consensus reliability than 30.",
    },
    {
        "term": "Beta",
        "abbr": "Beta",
        "definition": (
            "A measure of how much a stock tends to move relative to the broader market. "
            "Beta 1.0 = moves with the market. Above 1.0 = more volatile. Below 1.0 = more stable. "
            "High beta amplifies both gains and losses relative to the index."
        ),
        "example": "Beta 1.8: if the market rises 10%, this stock tends to rise 18% — and vice versa.",
    },
    {
        "term": "52-Week High",
        "abbr": "52W High",
        "definition": (
            "The highest price the stock reached over the past year. "
            "The gap between the current price and this high is a key technical signal. "
            "A moderate gap (20–30%) may indicate structured cooling. "
            "A large gap (50%+) can signal deeper problems."
        ),
        "example": "52-week high $200, current price $160 = 25% gap.",
    },
    {
        "term": "52-Week Low",
        "abbr": "52W Low",
        "definition": (
            "The lowest price the stock reached over the past year. "
            "Being close to the 52-week low can signal stress or extreme pessimism. "
            "A large buffer above the low provides more historical support."
        ),
        "example": "52-week low $80, current price $160 = 100% above recent low.",
    },
    {
        "term": "50-Day Moving Average",
        "abbr": "50D MA",
        "definition": (
            "The average closing price over the past 50 trading days. "
            "Smooths daily volatility to reveal the short-term trend direction. "
            "Price above the 50D MA = short-term momentum positive. Below = weakened."
        ),
        "example": "50D MA $280, current price $310 = 10.7% above short-term average.",
    },
    {
        "term": "200-Day Moving Average",
        "abbr": "200D MA",
        "definition": (
            "Average closing price over the past 200 trading days (~10 months). "
            "Shows the long-term trend direction. "
            "Holding above it is widely seen as a sign the broader trend is intact. "
            "Falling below it draws significant attention from market participants."
        ),
        "example": "Many investors treat the 200D MA as a critical line — a cross below it is a notable event.",
    },
    {
        "term": "Valuation Score",
        "abbr": "Valuation",
        "definition": (
            "RastogiRaterAI's composite measure of how expensive the stock is. "
            "Uses P/E, forward P/E, P/B, and P/S ratios. "
            "A great company can still score poorly here if the price leaves no margin for error."
        ),
        "example": "An elite business with a P/E of 80× earns low valuation marks — the price demands perfection.",
    },
    {
        "term": "Profitability Score",
        "abbr": "Profitability",
        "definition": (
            "RastogiRaterAI's measure of how efficiently the business converts revenue into income. "
            "Uses net margin, operating margin, return on equity, and return on assets. "
            "Strong profitability is a sign of pricing power and business resilience."
        ),
        "example": "A company with 25% net margin and 30% ROE scores near the top of this category.",
    },
]
