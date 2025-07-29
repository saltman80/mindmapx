import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function MindmapArm({ side = 'left' }: { side?: 'left' | 'right' }): JSX.Element {
  const width = 1200
  const startX = side === 'left' ? 0 : width
  const endX = width / 2
  const ref = useRef<SVGSVGElement>(null)
  // Trigger the animation even if only a small portion of the arm is visible.
  // A large width combined with `overflow-hidden` containers means the
  // intersection ratio is often below 0.2 on mobile screens. Reducing the
  // threshold ensures the animation runs as soon as any part is on screen.
  const inView = useInView(ref, { amount: 0.05, once: true })

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
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      <motion.circle
        cx={endX}
        cy="50"
        r="30"
        fill="none"
        stroke="var(--mindmap-color)"
        strokeWidth="6"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </motion.svg>
  )
}
