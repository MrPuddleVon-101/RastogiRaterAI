import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        rr: {
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          'surface-2': 'var(--surface-2)',
          'surface-3': 'var(--surface-3)',
          border: 'var(--border)',
          'border-2': 'var(--border-2)',
          text: 'var(--text)',
          muted: 'var(--muted)',
          faint: 'var(--faint)',
          accent: 'var(--accent)',
          pos: 'var(--pos)',
          neg: 'var(--neg)',
          caut: 'var(--caut)',
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease forwards',
        slideUp: 'slideUp 0.5s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config
