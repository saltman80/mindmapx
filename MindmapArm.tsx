import { motion } from 'framer-motion'

export default function MindmapArm({ side = 'left' }: { side?: 'left' | 'right' }): JSX.Element {
  const startX = side === 'left' ? 0 : 300
  const endX = 150
  return (
    <svg className={`mindmap-arm ${side}`} viewBox="0 0 300 100" aria-hidden="true">
      <motion.line
        x1={startX}
        y1="50"
        x2={endX}
        y2="50"
        stroke="var(--mindmap-color)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.circle
        cx={endX}
        cy="50"
        r="12"
        fill="none"
        stroke="var(--mindmap-color)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1, delay: 1 }}
      />
    </svg>
  )
}
