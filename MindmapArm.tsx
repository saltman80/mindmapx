import { motion } from 'framer-motion'
import { useRef } from 'react'

export default function MindmapArm({ side = 'left' }: { side?: 'left' | 'right' }): JSX.Element {
  const width = 3200
  const startX = side === 'left' ? -50 : width - 50
  const endX = width / 2
  const ref = useRef<SVGSVGElement>(null)

  return (
    <motion.svg
      ref={ref}
      className={`mindmap-arm ${side}`}
      viewBox={`0 0 ${width} 100`}
      aria-hidden="true"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50% 0px -50% 0px' }}
    >
      <motion.line
        x1={startX}
        y1="50"
        x2={endX}
        y2="50"
        stroke="var(--mindmap-color)"
        strokeWidth="6"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: { duration: 4, delay: 0.5 } },
        }}
      />
      <motion.circle
        cx={startX}
        cy="50"
        r="30"
        fill="none"
        stroke="var(--mindmap-color)"
        strokeWidth="6"
        variants={{
          hidden: { scale: 0, cx: startX },
          visible: {
            scale: 1,
            cx: endX,
            transition: { duration: 4, delay: 0.5 },
          },
        }}
      />
    </motion.svg>
  )
}
