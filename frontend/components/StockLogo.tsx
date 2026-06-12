'use client'
import { useState } from 'react'

// Company logo with a guaranteed premium fallback. Logos load from Google's
// favicon service by domain (verified reachable; Clearbit's free logo API was
// discontinued); any failure swaps to an ivory ticker badge. A broken image
// icon can never appear because the img is removed from the tree on error.

const LOGO_DOMAINS: Record<string, string> = {
  AAPL: 'apple.com',
  MSFT: 'microsoft.com',
  NVDA: 'nvidia.com',
  AVGO: 'broadcom.com',
  JPM: 'jpmorganchase.com',
  COST: 'costco.com',
  TSLA: 'tesla.com',
  GOOGL: 'abc.xyz',
  GOOG: 'abc.xyz',
  AMZN: 'amazon.com',
  META: 'meta.com',
  AMD: 'amd.com',
  NFLX: 'netflix.com',
  V: 'visa.com',
  MA: 'mastercard.com',
  ASML: 'asml.com',
  'ASML.AS': 'asml.com',
  TSM: 'tsmc.com',
  LLY: 'lilly.com',
  'BRK-B': 'berkshirehathaway.com',
  ORCL: 'oracle.com',
  CRM: 'salesforce.com',
  UNH: 'unitedhealthgroup.com',
  'TCS.NS': 'tcs.com',
  'RELIANCE.NS': 'ril.com',
  'INFY.NS': 'infosys.com',
  'HDFCBANK.NS': 'hdfcbank.com',
  'TATAMOTORS.NS': 'tatamotors.com',
  '7203.T': 'toyota.com',
  '005930.KS': 'samsung.com',
  '0700.HK': 'tencent.com',
  'MC.PA': 'lvmh.com',
}

interface StockLogoProps {
  symbol: string
  /** Box size in px. The logo sits on an ivory plate so dark marks stay visible. */
  size?: number
  radius?: number
  /** Soft glow behind the plate, for the Discover reveal moment. */
  glow?: boolean
}

export function StockLogo({ symbol, size = 32, radius = 9, glow = false }: StockLogoProps) {
  const [failed, setFailed] = useState(false)
  const domain = LOGO_DOMAINS[symbol.toUpperCase()]
  const showImage = domain && !failed

  return (
    <span
      className="relative flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'linear-gradient(180deg, #F0EBE0 0%, #E2DACA 100%)',
        boxShadow: glow
          ? '0 0 24px rgba(236,231,223,0.18), 0 8px 24px rgba(0,0,0,0.4)'
          : '0 1px 2px rgba(0,0,0,0.35)',
      }}
      aria-hidden
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: '72%', height: '72%', objectFit: 'contain' }}
        />
      ) : (
        <span
          className="font-semibold select-none"
          style={{
            color: '#16160F',
            fontSize: Math.max(9, size * 0.24),
            letterSpacing: '0.02em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {symbol.replace(/\..*$/, '').slice(0, 4)}
        </span>
      )}
    </span>
  )
}
