import type { Metadata } from 'next'
import { Bodoni_Moda, Schibsted_Grotesk, Spline_Sans_Mono } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";
import { CursorRing } from "@/components/CursorRing";

// Display. A Didone: the engraving tradition banknotes and share certificates
// are actually set in, which is why it sits right next to the Franklin and
// Buffett portraits in the hero. High stroke contrast reads as expensive at
// large sizes, and it is emphatically not another neutral grotesque.
const display = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

// UI, body and controls. Deliberately quiet: all the typographic character
// lives in the display face above, so this just has to be legible and get out
// of the way.
const ui = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// Data, tickers, and every number on the page. Wider and more mechanical than
// JetBrains Mono, so figures read as instrument output rather than code.
const mono = Spline_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  // Variable axis 300-700, one file.
})

export const metadata: Metadata = {
  title: 'Stonky',
  description: 'Search a ticker. Leave with a thesis.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(display.variable, ui.variable, mono.variable, "font-sans")}>
      <body>
        {/* Luxury outline ring around the real cursor, global across all pages.
            Self-disables on touch / reduced motion and never blocks clicks. */}
        <CursorRing />
        {children}
      </body>
    </html>
  )
}
