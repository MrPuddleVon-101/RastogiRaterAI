import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | null | undefined, currency = 'USD'): string {
  if (price == null) return 'N/A'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    return `${price.toFixed(2)} ${currency || ''}`.trim()
  }
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', INR: '₹', EUR: '€', GBP: '£', JPY: '¥',
  KRW: '₩', HKD: 'HK$', TWD: 'NT$', CHF: 'CHF ', CNY: '¥',
}

export function currencySymbol(code = 'USD'): string {
  return CURRENCY_SYMBOLS[code] || `${code} `
}

export function formatMarketCap(cap: number | null | undefined, currency = 'USD'): string {
  if (cap == null) return 'N/A'
  const s = currencySymbol(currency)
  if (cap >= 1e12) return `${s}${(cap / 1e12).toFixed(2)}T`
  if (cap >= 1e9)  return `${s}${(cap / 1e9).toFixed(2)}B`
  if (cap >= 1e6)  return `${s}${(cap / 1e6).toFixed(2)}M`
  return `${s}${cap.toLocaleString()}`
}

export function cleanText(text: string): string {
  if (!text) return ''
  return text
    .replace(/ \u2014 /g, '. ')
    .replace(/\u2014/g, ', ')
    .replace(/\. \./g, '.')
    .replace(/\. ,/g, '.')
    .replace(/ +/g, ' ')
    .trim()
}
