import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function MindmapArm({ side = 'left' }: { side?: 'left' | 'right' }): JSX.Element {
  const width = 3200
  const startX = side === 'left' ? -50 : width - 50
  const endX = width / 2
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { amount: 0.2, once: true })

  return (
    <motion.svg
      ref={ref}
      className={`mindmap-arm ${side}`}
      viewBox={`0 0 ${width} 100`}
      aria-hidden="true"
    >
      <motion.line
        x1={startX}
        y1="50"
        x2={endX}
        y2="50"
        stroke="var(--mindmap-color)"
        strokeWidth="6"
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 4, delay: 0.5 }}
      />
      <motion.circle
        cx={startX}
        cy="50"
        r="30"
        fill="none"
        stroke="var(--mindmap-color)"
        strokeWidth="6"
        animate={inView ? { scale: 1, cx: endX } : { scale: 0, cx: startX }}
        transition={{ duration: 4, delay: 0.5 }}
      />
    </motion.svg>
  )
}
