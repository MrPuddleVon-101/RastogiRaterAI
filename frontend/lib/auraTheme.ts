// Per-company aura theming for the Discover chamber. Each stock reveal tints
// the whole 3D scene (central glow, rim light, fog, floating-object glow, card
// edge) with a color derived from the company's brand. The goal is cinematic
// and finance-appropriate, never neon or oversaturated, so every brand color
// is pre-toned into a muted "family" rather than used raw. When a brand color
// is not known and the sector cannot place it, the fallback is premium Stonky
// gold, never a random hue.

export interface AuraTheme {
  /** Stable key for change detection between reveals. */
  key: string
  /** Central glow + halo behind the card. Also used as the card edge accent. */
  glow: string
  /** Colored point light washing the card and rocks. Slightly brighter. */
  light: string
  /** Fog / ground-haze tint. Very dark; a near-black hint of the brand. */
  fog: string
  /** Floating object + particle glow. */
  particle: string
  /** Card rim / highlight. The lightest member of the family. */
  rim: string
}

// Pre-toned families. Each is muted, dark, premium and reads as finance-tech,
// not gamer RGB. Brands and sectors both resolve into one of these.
type FamilyKey = 'emerald' | 'blue' | 'cyan' | 'ember' | 'amber' | 'violet' | 'gold'

const FAMILY: Record<FamilyKey, AuraTheme> = {
  emerald: { key: 'emerald', glow: '#3E9466', light: '#52B07F', fog: '#091310', particle: '#5FB88A', rim: '#7FCBA2' },
  blue:    { key: 'blue',    glow: '#3F76B2', light: '#5C97CC', fog: '#070E18', particle: '#73A6D2', rim: '#95BEE2' },
  cyan:    { key: 'cyan',    glow: '#3C9AA8', light: '#54B7C5', fog: '#061215', particle: '#6FC4D0', rim: '#90D6DE' },
  ember:   { key: 'ember',   glow: '#C25E3A', light: '#DA7A4C', fog: '#150A07', particle: '#E08F5E', rim: '#EFAC7E' },
  amber:   { key: 'amber',   glow: '#CB8A3C', light: '#E0A557', fog: '#150F07', particle: '#E0AB66', rim: '#EFC488' },
  violet:  { key: 'violet',  glow: '#8C6BC6', light: '#A485D8', fog: '#0F0A18', particle: '#B49BE2', rim: '#CBB2EC' },
  gold:    { key: 'gold',    glow: '#C9A24C', light: '#DCBE6E', fog: '#140F08', particle: '#D8B566', rim: '#ECD08C' },
}

// Curated brand -> family for the whole Discover deck. Monochrome / silver /
// luxury marks (Apple, Berkshire, LVMH) intentionally resolve to gold so the
// reveal still feels premium instead of washing out to grey.
const BRAND: Record<string, FamilyKey> = {
  NVDA: 'emerald',          // NVIDIA green
  MSFT: 'blue',
  AAPL: 'gold',             // monochrome mark -> premium default
  AVGO: 'ember',            // Broadcom red
  COST: 'ember',            // Costco red
  JPM: 'blue',
  V: 'blue',                // Visa navy
  MA: 'ember',              // Mastercard red/orange
  GOOGL: 'blue',
  GOOG: 'blue',
  AMZN: 'amber',            // Amazon orange
  ASML: 'blue',
  TSM: 'ember',             // TSMC red
  LLY: 'ember',             // Eli Lilly red
  'BRK-B': 'gold',          // monochrome -> premium default
  META: 'blue',
  NFLX: 'ember',            // Netflix red
  AMD: 'ember',             // AMD red
  ORCL: 'ember',            // Oracle red
  CRM: 'cyan',              // Salesforce blue/cyan
  UNH: 'blue',
  'TCS.NS': 'blue',
  'RELIANCE.NS': 'blue',
  'INFY.NS': 'cyan',        // Infosys teal-blue
  'HDFCBANK.NS': 'blue',
  'TATAMOTORS.NS': 'blue',
  '7203.T': 'ember',        // Toyota red
  '005930.KS': 'blue',      // Samsung blue
  '0700.HK': 'cyan',        // Tencent blue
  'MC.PA': 'gold',          // LVMH luxury -> gold
}

// Secondary fallback: place an unknown ticker by its reported sector so the
// helper still works broadly beyond the curated deck. Keys are normalized
// (lowercased) sector strings as returned by the backend.
const SECTOR: Record<string, FamilyKey> = {
  technology: 'blue',
  'communication services': 'violet',
  'financial services': 'cyan',
  financial: 'cyan',
  healthcare: 'emerald',
  'consumer cyclical': 'amber',
  'consumer defensive': 'emerald',
  energy: 'ember',
  industrials: 'blue',
  'basic materials': 'amber',
  utilities: 'cyan',
  'real estate': 'amber',
}

/**
 * Resolve a stock to its cinematic aura theme.
 * 1. Known brand color (covers the whole Discover deck).
 * 2. Else the reported sector's muted family.
 * 3. Else premium Stonky gold.
 */
export function getCompanyAuraTheme(
  symbol: string | null | undefined,
  report?: { sector?: string | null } | null,
): AuraTheme {
  if (symbol) {
    const fam = BRAND[symbol.toUpperCase()] ?? BRAND[symbol]
    if (fam) return FAMILY[fam]
  }
  const sector = report?.sector?.toLowerCase().trim()
  if (sector && SECTOR[sector]) return FAMILY[SECTOR[sector]]
  return FAMILY.gold
}

/** Premium default exposed for first paint before any stock is resolved. */
export const DEFAULT_AURA = FAMILY.gold
