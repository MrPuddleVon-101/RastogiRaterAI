// Curated stock universe for the Discover deck. The live score, thesis bias,
// main risk, and cold take come from the backend report; the identity copy
// below is curated so cards read like sharp memo lines, not API dumps.

export interface DeckEntry {
  symbol: string
  name: string
  whatItDoes: string
  bestThing: string
  uniqueEdge: string
}

export const DECK_UNIVERSE: DeckEntry[] = [
  {
    symbol: 'NVDA', name: 'NVIDIA',
    whatItDoes: 'Builds GPUs and accelerated computing systems used in AI infrastructure.',
    bestThing: 'Dominant AI hardware ecosystem with pricing power.',
    uniqueEdge: 'CUDA software lock-in plus a full-stack data center platform.',
  },
  {
    symbol: 'MSFT', name: 'Microsoft',
    whatItDoes: 'Sells productivity software, the Azure cloud, and enterprise infrastructure.',
    bestThing: 'Recurring enterprise revenue across cloud, Office, and security.',
    uniqueEdge: 'Deep enterprise switching costs across the whole IT stack.',
  },
  {
    symbol: 'AAPL', name: 'Apple',
    whatItDoes: 'Designs iPhones, Macs, and the services layer that runs on them.',
    bestThing: 'A loyal installed base of over two billion active devices.',
    uniqueEdge: 'Hardware, software, and services integration nobody has matched.',
  },
  {
    symbol: 'AVGO', name: 'Broadcom',
    whatItDoes: 'Designs networking and custom AI chips and owns key infrastructure software.',
    bestThing: 'Margins and cash flow that few semiconductor firms can match.',
    uniqueEdge: 'Custom silicon relationships with the largest AI buyers.',
  },
  {
    symbol: 'COST', name: 'Costco',
    whatItDoes: 'Runs membership warehouses selling bulk goods at thin markups.',
    bestThing: 'Membership renewal rates around ninety percent.',
    uniqueEdge: 'A cost structure rivals cannot copy without losing money for years.',
  },
  {
    symbol: 'JPM', name: 'JPMorgan Chase',
    whatItDoes: 'The largest US bank across consumer, investment banking, and markets.',
    bestThing: 'Scale and a fortress balance sheet through credit cycles.',
    uniqueEdge: 'Breadth: it wins in deposits, trading, and payments at once.',
  },
  {
    symbol: 'V', name: 'Visa',
    whatItDoes: 'Operates the payment network that routes card transactions worldwide.',
    bestThing: 'Tollbooth economics on global consumer spending.',
    uniqueEdge: 'A two-sided network effect built over half a century.',
  },
  {
    symbol: 'MA', name: 'Mastercard',
    whatItDoes: 'Runs the second great global card network and payment rails.',
    bestThing: 'High-margin fees on every swipe in over 200 countries.',
    uniqueEdge: 'Network acceptance that a new entrant cannot replicate.',
  },
  {
    symbol: 'GOOGL', name: 'Alphabet',
    whatItDoes: 'Owns Google search, YouTube, Android, and a major cloud business.',
    bestThing: 'Search remains one of the best business models ever built.',
    uniqueEdge: 'Distribution and data advantages across billions of users.',
  },
  {
    symbol: 'AMZN', name: 'Amazon',
    whatItDoes: 'Runs the everything store, plus AWS, the largest cloud provider.',
    bestThing: 'AWS profits fund relentless retail and logistics expansion.',
    uniqueEdge: 'Fulfilment infrastructure measured in decades, not quarters.',
  },
  {
    symbol: 'ASML', name: 'ASML',
    whatItDoes: 'Builds the lithography machines that make advanced chips possible.',
    bestThing: 'A literal monopoly on EUV lithography.',
    uniqueEdge: 'No competitor can ship an alternative this decade.',
  },
  {
    symbol: 'TSM', name: 'TSMC',
    whatItDoes: 'Manufactures the most advanced chips for Apple, NVIDIA, and others.',
    bestThing: 'The indispensable foundry at the leading edge.',
    uniqueEdge: 'Process leadership and yields rivals have chased for years.',
  },
  {
    symbol: 'LLY', name: 'Eli Lilly',
    whatItDoes: 'Develops drugs, led by diabetes and obesity treatments.',
    bestThing: 'The obesity franchise is one of the largest drug markets ever.',
    uniqueEdge: 'Manufacturing scale and trial data in incretin medicines.',
  },
  {
    symbol: 'BRK-B', name: 'Berkshire Hathaway',
    whatItDoes: 'A conglomerate of insurance, railroads, energy, and large equity stakes.',
    bestThing: 'A balance sheet built to act when others cannot.',
    uniqueEdge: 'Permanent capital and insurance float at unmatched scale.',
  },
  {
    symbol: 'META', name: 'Meta Platforms',
    whatItDoes: 'Runs Facebook, Instagram, and WhatsApp, funded by targeted ads.',
    bestThing: 'Billions of daily users and improving ad efficiency.',
    uniqueEdge: 'Social graph network effects across three massive apps.',
  },
  {
    symbol: 'NFLX', name: 'Netflix',
    whatItDoes: 'The largest paid streaming service, now with an ads tier.',
    bestThing: 'Global subscriber scale with real pricing power.',
    uniqueEdge: 'A content and recommendation flywheel rivals burn cash to chase.',
  },
  {
    symbol: 'AMD', name: 'AMD',
    whatItDoes: 'Designs CPUs and GPUs competing in PCs, servers, and AI.',
    bestThing: 'Consistent server share gains against a weakened rival.',
    uniqueEdge: 'Chiplet design expertise and the credible second AI source.',
  },
  {
    symbol: 'ORCL', name: 'Oracle',
    whatItDoes: 'Sells databases and enterprise software, now growing a cloud arm.',
    bestThing: 'Mission-critical databases that customers rarely leave.',
    uniqueEdge: 'Decades of enterprise data gravity and switching costs.',
  },
  {
    symbol: 'CRM', name: 'Salesforce',
    whatItDoes: 'The dominant cloud platform for sales and customer relationships.',
    bestThing: 'The system of record for millions of sales teams.',
    uniqueEdge: 'An ecosystem of apps and integrations built on its platform.',
  },
  {
    symbol: 'UNH', name: 'UnitedHealth Group',
    whatItDoes: 'The largest US health insurer plus the Optum care and data arm.',
    bestThing: 'Scale across insurance, pharmacy, and care delivery.',
    uniqueEdge: 'Optum gives it data and margin levers pure insurers lack.',
  },
  // International (skipped gracefully if data is unavailable)
  {
    symbol: 'TCS.NS', name: 'Tata Consultancy Services',
    whatItDoes: 'India’s largest IT services and consulting exporter.',
    bestThing: 'Long-duration enterprise contracts with high renewal rates.',
    uniqueEdge: 'Scale and delivery reputation built over five decades.',
  },
  {
    symbol: 'RELIANCE.NS', name: 'Reliance Industries',
    whatItDoes: 'An Indian conglomerate across energy, retail, and telecom (Jio).',
    bestThing: 'Jio turned telecom scale into a consumer platform.',
    uniqueEdge: 'Infrastructure and regulatory position rivals cannot rebuild.',
  },
  {
    symbol: 'INFY.NS', name: 'Infosys',
    whatItDoes: 'A global IT services firm for digital transformation projects.',
    bestThing: 'Strong margins for a services business at global scale.',
    uniqueEdge: 'A trusted delivery brand in enterprise modernisation.',
  },
  {
    symbol: 'HDFCBANK.NS', name: 'HDFC Bank',
    whatItDoes: 'India’s largest private sector bank by assets.',
    bestThing: 'A long record of disciplined lending and deposit growth.',
    uniqueEdge: 'Branch and brand reach in a fast-formalising economy.',
  },
  {
    symbol: 'TATAMOTORS.NS', name: 'Tata Motors',
    whatItDoes: 'Builds cars and trucks in India and owns Jaguar Land Rover.',
    bestThing: 'A turnaround story across JLR margins and Indian EVs.',
    uniqueEdge: 'Early EV leadership in the Indian passenger market.',
  },
  {
    symbol: '7203.T', name: 'Toyota Motor',
    whatItDoes: 'The world’s largest automaker by volume.',
    bestThing: 'Manufacturing discipline that funds every powertrain bet.',
    uniqueEdge: 'Hybrid leadership while the EV transition stays uncertain.',
  },
  {
    symbol: '005930.KS', name: 'Samsung Electronics',
    whatItDoes: 'Makes memory chips, smartphones, and displays.',
    bestThing: 'Memory cycle leverage with a fortress cash position.',
    uniqueEdge: 'Vertical integration from silicon to finished devices.',
  },
  {
    symbol: '0700.HK', name: 'Tencent Holdings',
    whatItDoes: 'Runs WeChat, the largest games business, and a vast investment book.',
    bestThing: 'WeChat is the operating system of Chinese daily life.',
    uniqueEdge: 'Distribution through a super-app rivals cannot dislodge.',
  },
  {
    symbol: 'MC.PA', name: 'LVMH',
    whatItDoes: 'The largest luxury group: Louis Vuitton, Dior, and seventy plus houses.',
    bestThing: 'Pricing power rooted in brands measured in centuries.',
    uniqueEdge: 'A portfolio of scarce brands that cannot be recreated.',
  },
]

export function deckEntryFor(symbol: string): DeckEntry | undefined {
  return DECK_UNIVERSE.find(d => d.symbol === symbol.toUpperCase())
}
