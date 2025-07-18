import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

export default function MindmapArm({ side = 'left' }: { side?: 'left' | 'right' }): JSX.Element {
  const width = 3200
  const startX = side === 'left' ? -50 : width - 50
  const endX = width / 2
  const ref = useRef<SVGSVGElement>(null)
  const isInView = useInView(ref, { margin: '-40% 0px -40% 0px', once: true })
  const [start, setStart] = useState(false)

  useEffect(() => {
    if (!isInView) return
    const t = setTimeout(() => setStart(true), 500)
    return () => clearTimeout(t)
  }, [isInView])

  return (
    <svg ref={ref} className={`mindmap-arm ${side}`} viewBox={`0 0 ${width} 100`} aria-hidden="true">
      <motion.line
        x1={startX}
        y1="50"
        x2={endX}
        y2="50"
        stroke="var(--mindmap-color)"
        strokeWidth="6"
        initial={{ pathLength: 0 }}
        animate={start ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 4 }}
      />
      <motion.circle
        cx={startX}
        cy="50"
        r="30"
        fill="none"
        stroke="var(--mindmap-color)"
        strokeWidth="6"
        initial={{ scale: 0, cx: startX }}
        animate={start ? { scale: 1, cx: endX } : { scale: 0, cx: startX }}
        transition={{ duration: 4 }}
      />
    </svg>
  )
}
