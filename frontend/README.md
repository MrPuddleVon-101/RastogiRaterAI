# RastogiRaterAI — Frontend

Next.js 14 (App Router) frontend for RastogiRaterAI. Calls the FastAPI backend and renders the full stock scoring dashboard.

## Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + CSS custom properties
- **Charts:** Recharts
- **Animation:** Framer Motion, canvas particle effect, CSS pixel trail
- **Fonts:** Inter (sans), JetBrains Mono (monospace) — loaded via next/font/google

## Setup

```bash
cd /Users/vedantrastogi/RastogiRaterAI/frontend

# Install dependencies
npm install

# Start the backend first (in a separate terminal):
# cd /Users/vedantrastogi/RastogiRaterAI/backend
# uvicorn main:app --reload --port 8000

# Start the frontend dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Environment variables

By default the frontend expects the backend at `http://localhost:8000`. Override via:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Build for production

```bash
npm run build
npm run start
```

## Project structure

```
frontend/
├── app/
│   ├── globals.css        # CSS custom properties + Tailwind directives
│   ├── layout.tsx         # Root layout, font injection
│   └── page.tsx           # Main page: landing, loading, and results dashboard
├── components/
│   ├── ui/
│   │   ├── gooey-filter.tsx        # SVG filter for gooey trail effect
│   │   ├── pixel-trail.tsx         # Mouse-follow pixel trail
│   │   └── particle-text-effect.tsx # Canvas particle animation
│   ├── Disclaimer.tsx      # Footer disclaimer
│   ├── EvidenceTable.tsx   # Filterable metric evidence table
│   ├── GooeyBackground.tsx # Landing page animated background
│   ├── ParticleIntro.tsx   # Hero particle text wrapper
│   ├── PriceChart.tsx      # Recharts 1-year price chart
│   ├── RastogiVerdict.tsx  # Analyst / beginner verdict block
│   ├── ScoreAnatomy.tsx    # Category score breakdown table
│   ├── ScoreHero.tsx       # Top-level score + identity hero
│   ├── TickerInput.tsx     # Search form + quick picks + mode toggle
│   └── TooltipTerm.tsx     # Hover tooltip for metric names
├── hooks/
│   ├── use-debounced-dimensions.ts  # ResizeObserver dimensions hook
│   └── use-screen-size.ts           # Viewport breakpoint hook
├── lib/
│   ├── api.ts             # rateStock() fetch wrapper
│   ├── tooltips.ts        # Plain-English metric definitions
│   ├── types.ts           # TypeScript interfaces for the API response
│   └── utils.ts           # cn(), formatPrice(), formatMarketCap(), signalColor()
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Design system

All colours are CSS custom properties set in `globals.css`. Components reference them as `var(--bg)`, `var(--pos)`, `var(--neg)`, etc. — no hard-coded hex values in component files.

| Variable      | Purpose                    |
|---------------|----------------------------|
| `--bg`        | Page background            |
| `--surface`   | Card / panel background    |
| `--surface-2` | Alternate row / header     |
| `--surface-3` | Tooltip background         |
| `--border`    | Subtle divider             |
| `--border-2`  | Stronger border            |
| `--text`      | Primary text               |
| `--muted`     | Secondary / label text     |
| `--faint`     | Tertiary / placeholder     |
| `--accent`    | Amber / gold accent        |
| `--pos`       | Positive / green signal    |
| `--neg`       | Negative / red signal      |
| `--caut`      | Caution / amber signal     |
