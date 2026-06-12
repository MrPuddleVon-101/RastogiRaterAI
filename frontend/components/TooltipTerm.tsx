'use client'
import { TOOLTIPS } from '@/lib/tooltips'
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card'

interface TooltipTermProps {
  term: string
  children: React.ReactNode
}

export function TooltipTerm({ term, children }: TooltipTermProps) {
  const def = TOOLTIPS[term]
  if (!def) return <>{children}</>

  return (
    <HoverCard openDelay={160} closeDelay={120}>
      <HoverCardTrigger asChild>
        <span
          className="cursor-help"
          style={{ borderBottom: '1px dotted var(--border-3)' }}
        >
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="p-0 border-0 shadow-none bg-transparent ring-0"
        style={{ zIndex: 9999 }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, #1E222B 0%, #14161B 100%)',
            border: '1px solid var(--border-3)',
            borderRadius: '10px',
            padding: '13px 16px',
            width: 'min(360px, 80vw)',
            color: 'var(--text)',
            fontSize: '0.8rem',
            lineHeight: 1.65,
            boxShadow: '0 18px 44px rgba(0,0,0,0.65), inset 0 1px 0 rgba(236,231,223,0.05)',
          }}
        >
          {def}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
