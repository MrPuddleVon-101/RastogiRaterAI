'use client'
import React, { useRef } from 'react'
import { useScroll, useTransform, motion, useReducedMotion, MotionValue } from 'motion/react'

// 3D scroll entrance, adapted from the 21st.dev ContainerScroll for the
// RastogiRaterAI system: dark hybrid frame instead of the gray demo card,
// tighter runway so desktop is not absurdly tall, auto height content, and
// a plain render under prefers-reduced-motion.

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode
  children: React.ReactNode
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  })
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const rotate = useTransform(scrollYProgress, [0, 1], [16, 0])
  const scale = useTransform(scrollYProgress, [0, 1], isMobile ? [0.92, 1] : [1.04, 1])
  const translate = useTransform(scrollYProgress, [0, 1], [-10, -50])

  if (reduced) {
    return (
      <div className="relative w-full px-2 md:px-6 py-10">
        <div className="max-w-2xl mx-auto text-center mb-10">{titleComponent}</div>
        <div className="max-w-2xl mx-auto">{children}</div>
      </div>
    )
  }

  return (
    <div className="relative flex items-start justify-center px-2 md:px-6" ref={containerRef}>
      <div className="w-full relative" style={{ perspective: '1100px' }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  )
}

const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>
  titleComponent: string | React.ReactNode
}) => {
  return (
    <motion.div style={{ translateY: translate }} className="max-w-2xl mx-auto text-center pt-14 pb-12">
      {titleComponent}
    </motion.div>
  )
}

const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>
  scale: MotionValue<number>
  children: React.ReactNode
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        transformStyle: 'preserve-3d',
        boxShadow:
          '0 9px 20px rgba(0,0,0,0.29), 0 37px 37px rgba(0,0,0,0.26), 0 84px 50px rgba(0,0,0,0.15), 0 149px 60px rgba(0,0,0,0.04)',
      }}
      className="max-w-2xl mx-auto w-full rounded-[26px] p-2 md:p-3"
    >
      <div
        className="w-full rounded-[20px] p-2 md:p-4"
        style={{
          background: 'linear-gradient(180deg, rgba(30,34,43,0.92) 0%, rgba(16,18,22,0.96) 100%)',
          border: '1px solid var(--border-3)',
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}
