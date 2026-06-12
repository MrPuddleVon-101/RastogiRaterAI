export const TOOLTIPS: Record<string, string> = {

  'Trailing P/E':
    'P/E compares the stock price to annual earnings per share. It shows how much investors pay for each dollar of profit the company already earned. Stonky lowers the valuation score when P/E is extreme, because expensive stocks leave less room for operational disappointment.',

  'Forward P/E':
    'Forward P/E uses analyst estimates of future earnings instead of past figures. A forward P/E meaningfully below trailing P/E suggests analysts expect earnings growth. Stonky treats a significant improvement as a mild positive, without over-weighting analyst projections.',

  'Price/Book':
    'Stock price divided by net assets per share. A P/B below 1 means the stock trades below its accounting value. Very high P/B is common in asset-light businesses. Stonky penalises extreme values while accounting for whether the business model justifies them.',

  'Price/Sales':
    'Market cap divided by annual revenue. A P/S of 10 means investors pay $10 for every $1 of sales. High P/S is only justified by strong margins or fast growth. Stonky penalises elevated P/S unless underlying profitability supports it.',

  'Net Profit Margin':
    'The percentage of revenue that becomes net profit after all costs, taxes, and interest. A 20% margin means $0.20 of profit from every $1 of sales. Above 20% signals pricing power. Stonky rewards high margins heavily in the profitability score.',

  'Operating Margin':
    'Profit from core business operations as a percentage of revenue, before interest and taxes. It shows how efficient the underlying business model is, separate from financing decisions. Stonky uses this alongside net margin to verify that profitability is structural.',

  'Return on Equity':
    'Annual profit divided by shareholder equity. It measures how efficiently management uses the capital shareholders contributed. Above 15% is solid. Stonky reads ROE alongside debt levels, since high leverage can inflate the figure artificially.',

  'Return on Assets':
    'Annual profit divided by total assets. It measures how productively the company uses everything it owns to generate earnings. High ROA is harder to manufacture than high ROE. Stonky uses both metrics together to assess genuine capital efficiency.',

  'Free Cash Flow':
    'Cash remaining after operating costs and capital investments. What is left over for debt repayment, reinvestment, or returning capital to shareholders. Positive free cash flow means the business funds itself. Stonky treats this as one of the clearest quality signals.',

  'Operating Cash Flow':
    'Cash generated purely from running the business, before capital spending. Harder to manipulate than reported earnings. A company reporting profits but negative operating cash flow warrants scrutiny. Stonky uses this as a sanity check on reported profitability.',

  'Total Debt':
    'All money owed by the company, including bonds, bank loans, and leases. The absolute number means little on its own. Stonky compares total debt against cash and free cash flow to assess whether the load is manageable.',

  'Total Cash':
    'Liquid assets on hand, including short-term investments. High cash gives the business options: repay debt, survive downturns, or invest in growth. Stonky compares cash against total debt to assess the net financial position.',

  'Debt/Equity':
    'Total debt expressed as a percentage of shareholder equity. It shows how much of the business is funded by borrowed money versus owner capital. Under 50% is conservative. Stonky penalises very high leverage, especially without strong cash generation to support it.',

  'Current Ratio':
    'Short-term assets divided by short-term liabilities. It measures the ability to cover obligations due within 12 months. Above 1.5 is comfortable. Below 1.0 means current obligations exceed liquid assets, which can indicate near-term liquidity risk.',

  'Consensus Target':
    'The average 12-month price target from analysts covering the stock. This is third-party data, not a Stonky forecast or recommendation. Coverage depth matters significantly: 20 analysts is meaningful; 2 is not.',

  'Analyst Coverage':
    'The number of professional analysts actively providing price targets for the stock. More analysts means more diverse views and a more reliable consensus. Stonky reduces the analyst score when coverage is thin.',

  'Recommendation':
    'The aggregate analyst recommendation: Strong Buy, Buy, Hold, Underperform, or Sell. This is third-party consensus data. Stonky does not make buy, sell, or hold recommendations. This label is used as a supporting signal only.',

  'Beta':
    'Measures how much the stock tends to move relative to the broader market. Beta 1.0 means it moves in line with the index. Beta 1.5 means it tends to move 50% more in both directions. Stonky notes beta as context, not a primary scoring factor.',

  '52-Week High Gap':
    'The percentage distance between the current price and the highest price of the past year. Twenty to thirty percent below the high is a structured pullback that Stonky treats as potentially constructive. Fifty percent or more below may reflect real deterioration rather than a discount.',

  '52-Week Low Buffer':
    'How far the current price sits above the lowest price of the past year. A small buffer means the stock is near its recent worst level. Stonky notes this as a risk context signal, not a buy or sell trigger.',

  'vs 50-Day MA':
    'The average closing price over the past 50 trading days. A widely used short-term trend indicator. Price above the 50-day MA suggests short-term momentum is intact. Stonky looks for price above both moving averages as a constructive technical setup.',

  'vs 200-Day MA':
    'The average closing price over the past 200 trading days. The most closely watched long-term trend indicator. Falling below it is a widely noted signal that draws significant market attention. Stonky uses it as part of the technical position score.',

  '1-Month Return':
    'Percentage price change over the past 21 trading days. Captures recent short-term momentum. A strongly positive return suggests recent buying interest. Stonky uses this as a minor directional signal, not a primary driver.',

  'Valuation':
    'Valuation checks how much investors are paying for the company\'s earnings, sales, and assets. A great business can still score poorly here if the stock price already assumes too much future success. Scores up to 20 points.',

  'Analyst':
    'Analyst checks the consensus view from professional analysts: 12-month price targets, coverage depth, and the aggregate recommendation label. Coverage depth matters. Scored as a supporting input, not a primary driver. Scores up to 15 points.',

  'Analyst Expectations':
    'Analyst Expectations checks the consensus view from professional analysts: price targets, coverage depth, and the aggregate recommendation. Coverage depth matters. Scored as a supporting input, not a primary driver. Scores up to 15 points.',

  'Profitability':
    'Profitability checks whether the company turns revenue into real profit. High margins signal pricing power and resilience. Stonky measures net margin, operating margin, return on equity, and return on assets. Scores up to 20 points.',

  'Cash Flow & Debt':
    'Cash Flow and Debt checks the financial structure: free cash flow, operating cash flow, debt levels, and the current ratio. A business that generates its own cash is fundamentally different from one that depends on external financing. Scores up to 20 points.',

  'Technical':
    'Technical Position checks where the stock sits relative to its recent price history: 52-week high gap, moving averages, and short-term momentum. This describes the current setup, not where the stock is heading. Scores up to 15 points.',

  'Technical Position':
    'Technical Position checks where the stock sits relative to its recent price history: 52-week high gap, moving averages, and short-term momentum. This describes the current setup, not where the stock is heading. Scores up to 15 points.',

  'Data Confidence':
    'Data Confidence reflects the completeness of available data for this analysis. A score of 10/10 means full coverage across all major fields. Points are deducted for each major metric that was unavailable. A low confidence score means the other categories are working with incomplete information. Scores up to 10 points.',

  'Market Cap':
    'Market capitalisation is the total market value of all the company\'s outstanding shares. It is calculated as share price multiplied by the number of shares. Stonky shows it as context for scale, not as a scoring factor.',

  'Momentum':
    'Momentum describes the direction and strength of recent price movement. Positive momentum means the stock has been rising. Negative momentum means it has been falling. Stonky uses short-term momentum as a minor directional signal in the technical score.',

  'Investment Thesis':
    'An investment thesis is the short story of why a stock might be mispriced and what would make that view work. It is not advice. Stonky builds an educational thesis from the company\'s valuation, quality, growth, and technical signals.',

  'Bullish case':
    'The bullish case lists what supports a positive view of the stock. It matters because a fair read weighs both sides. Stonky draws the bullish case from the strongest parts of the data, like margins, cash flow, or growth.',

  'Bearish case':
    'The bearish case lists what works against the stock. It matters because risks are as important as strengths. Stonky draws the bearish case from the weaker parts of the data, like a high price or heavy debt.',

  'Market may be missing':
    'This is the possible mispricing: something the market may be over or under appreciating. It matters because edge comes from seeing what others miss. Stonky infers this from the gap between business quality and price.',

  'Catalyst':
    'A catalyst is an event that could cause investors to revalue a stock. Examples include earnings surprises, product launches, approvals, cost cuts, or major contracts. Stonky uses catalysts to explain what might change the market\'s view.',

  'Economic moat':
    'An economic moat is what protects a company from competitors. It can come from brand power, switching costs, scale, patents, or network effects. Stonky uses moat to judge whether strong profits may last or whether competitors could erode them.',

  'Brand strength':
    'Brand strength is the pricing power and loyalty a trusted name creates. It matters because customers will pay more and stay longer. Stonky treats it as one possible source of a durable moat.',

  'Network effects':
    'Network effects mean a product gets more valuable as more people use it. It matters because it makes a leader very hard to displace. Stonky treats strong network effects as a wide moat source.',

  'Switching costs':
    'Switching costs are the time, money, or risk of moving to a competitor. They matter because they lock in customers and protect revenue. Stonky counts high switching costs as a moat source.',

  'Cost advantage':
    'A cost advantage means a company can produce at a lower cost than rivals. It matters because it supports higher margins or lower prices. Stonky reads strong margins as a possible cost advantage.',

  'Scale advantage':
    'A scale advantage is the edge a very large company gets from size, like bargaining power and spread-out fixed costs. Stonky treats large, profitable scale as a moat source.',

  'Intellectual property':
    'Intellectual property includes patents, trade secrets, and proprietary technology. It matters because it can legally block competitors for years. Stonky treats strong IP as a durable moat source.',

  'Mispricing':
    'Mispricing is the gap between a stock\'s price and what the business may be worth. It matters because that gap is where opportunity or risk lives. Stonky describes possible mispricing, but never claims certainty.',

  'DCF':
    'A discounted cash flow model estimates what a business could be worth based on its future cash flows. Those future cash flows are discounted back to today because money later is worth less than money now. Stonky treats DCF as a rough educational range, not a precise price target.',

  'Discount rate':
    'The discount rate converts future cash into today\'s value, reflecting risk and the cost of waiting. A higher rate lowers the estimated value. Stonky uses a conservative range of discount rates in its simplified DCF.',

  'Terminal growth':
    'Terminal growth is the slow, steady growth a business is assumed to settle into far in the future. It matters because most of a DCF value can sit in that tail. Stonky keeps terminal growth low and conservative.',

  'Fair value':
    'Fair value is a rough estimate of what a share could be worth based on fundamentals. It matters as a sanity check against the market price. Stonky shows it as an educational range, not a price target.',

  'Trading comps':
    'Trading comps compare a company\'s valuation multiples with similar companies. This helps show whether the market values the stock at a premium or discount to peers. Stonky uses comps as context, not proof, and marks them unavailable when live peer data cannot be fetched.',

  'EV/EBITDA':
    'EV/EBITDA compares enterprise value to earnings before interest, tax, depreciation, and amortisation. It matters because it values the whole business regardless of debt structure. Stonky uses it as one valuation lens when available.',

  'Bullish bias':
    'A bullish bias means the most recent candles lean positive in the short term. It is a read of momentum, not a forecast. Stonky frames it as an educational technical signal only.',

  'Bearish bias':
    'A bearish bias means the most recent candles lean negative in the short term. It is a read of momentum, not a forecast. Stonky frames it as an educational technical signal only.',

  'Candlestick':
    'A candlestick shows the open, high, low, and close for a period in one shape. Patterns of candles hint at the short-term balance between buyers and sellers. Stonky reads them as educational signals, not predictions.',

  'P/E':
    'P/E compares the stock price to annual earnings per share. It shows how much investors pay for each dollar of profit. Stonky lowers the valuation score when P/E is extreme, because expensive stocks have less room for disappointment.',

  'Long-term thesis bias':
    'The long-term thesis bias is the directional lean of the multi-year case: bullish or bearish, with caution flags. It matters because it answers the main question before the details. Stonky derives it from the score, valuation, profitability, cash flow, and data confidence. It is an analytical read, not a recommendation.',

  'Short-term technical bias':
    'The short-term technical bias is the directional lean of the recent chart: bullish or bearish. It comes from candlestick structure and position versus moving averages. Stonky treats it as an educational pattern reading that requires confirmation, never a prediction.',

  'Score DNA':
    'Score DNA shows where the overall score came from: how many points each of the six categories actually earned. It matters because two stocks with the same score can earn it very differently. Stonky uses it to make the score auditable instead of a black box.',

  '50-day moving average':
    'The average closing price over the past 50 trading days. A widely used short-term trend indicator. Price above the 50-day average suggests short-term momentum is intact. Stonky uses it in the technical position score.',

  '200-day moving average':
    'The average closing price over the past 200 trading days. The most closely watched long-term trend line. Falling below it draws significant market attention. Stonky uses it as part of the technical position score.',

  '52-week high':
    'The highest price of the past year. The gap between the current price and this level shows how far the stock has cooled. A structured pullback of twenty to thirty percent reads differently from a fifty percent collapse. Stonky scores that distinction.',

  'Analyst target':
    'The average 12-month price target from analysts covering the stock. Third-party data, not a Stonky forecast. Coverage depth matters: a consensus of twenty analysts means more than a consensus of two.',

  'Analyst consensus':
    'The aggregate analyst view across targets and recommendation labels. Stonky reads it as a supporting signal of professional expectations, never as proof and never as its own recommendation.',

  'Profit margin':
    'The percentage of revenue that becomes net profit after all costs. A 20% margin means $0.20 kept from every $1 of sales. Higher margins signal pricing power. Stonky rewards strong margins in the profitability score.',

  'ROE':
    'Return on equity: annual profit divided by shareholder equity. It measures how efficiently management uses shareholder capital. Above 15% is solid. Stonky reads it alongside debt, since leverage can inflate it.',

  'ROA':
    'Return on assets: annual profit divided by total assets. It shows how productively the company uses everything it owns. High ROA is harder to manufacture than high ROE. Stonky uses both together.',

  'Free cash flow':
    'Cash remaining after operating costs and capital investment. Positive free cash flow means the business funds itself. Stonky treats it as one of the clearest quality signals in the score.',

  'Operating cash flow':
    'Cash generated purely from running the business, before capital spending. Harder to manipulate than reported earnings. Stonky uses it as a sanity check on reported profitability.',

  'Debt/equity':
    'Total debt as a percentage of shareholder equity. It shows how much of the business runs on borrowed money. Under 50% is conservative. Stonky penalises heavy leverage without strong cash generation behind it.',

  'EPS':
    'Earnings per share: company profit divided by the number of shares. It is the per-share slice of the bottom line. Analysts publish EPS estimates each quarter, and the gap between estimate and actual moves stocks. Stonky shows that gap in the earnings history card.',

  'Revenue':
    'Total sales before any costs. Revenue growth shows whether the business is expanding, while margins show how much of it is kept. Stonky uses revenue growth as a growth signal alongside profitability.',

  'Earnings beat':
    'An earnings beat means actual results came in above analyst estimates. Beats often lift the stock because expectations were too low. A long streak of beats can also mean estimates are managed conservatively. Stonky shows beats as green dots in the earnings history.',

  'Earnings miss':
    'An earnings miss means actual results came in below analyst estimates. Misses often hit the price hard because investors reset their assumptions. One miss is noise; repeated misses are a pattern. Stonky shows misses as red dots in the earnings history.',

  'Debt':
    'Money the company owes, from bonds to bank loans. Debt is not automatically bad: cheap debt can fund growth. It becomes a risk when cash flow weakens. Stonky reads debt against cash and free cash flow in the Cash Flow & Debt score.',

  'Score':
    'The Stonky score is a 0 to 100 pressure test across six categories: valuation, analyst expectations, profitability, cash flow and debt, technical position, and data confidence. It is an analytical output from public data, never a recommendation to buy, sell, or hold.',
}
