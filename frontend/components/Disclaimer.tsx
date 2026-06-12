export function Disclaimer() {
  return (
    <footer
      className="mt-12 mb-8 pt-6"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <p className="text-xs leading-relaxed max-w-3xl" style={{ color: 'var(--faint)' }}>
        Stonky is for educational purposes only and does not constitute financial advice.
        Scores are analytical outputs based on publicly available data and do not represent a
        recommendation to buy, sell, or hold any security. Analyst consensus labels shown are
        third-party data from financial data providers, not Stonky recommendations.
        Past data does not guarantee future performance. Conduct independent research and consult
        a qualified adviser before making investment decisions.
      </p>
    </footer>
  )
}
