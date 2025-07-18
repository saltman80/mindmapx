import { motion } from 'framer-motion'

export default function MindmapArm({ side = 'left' }: { side?: 'left' | 'right' }): JSX.Element {
  const startX = side === 'left' ? -50 : 350
  const endX = 200
  return (
    <svg className={`mindmap-arm ${side}`} viewBox="0 0 400 100" aria-hidden="true">
      <motion.line
        x1={startX}
        y1="50"
        x2={endX}
        y2="50"
        stroke="var(--mindmap-color)"
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 4, delay: 2 }}
      />
      <motion.circle
        cx={startX}
        cy="50"
        r="20"
        fill="none"
        stroke="var(--mindmap-color)"
        initial={{ scale: 0, cx: startX }}
        animate={{ scale: 1, cx: endX }}
        transition={{ duration: 4, delay: 2 }}
      />
    </svg>
  )
}
