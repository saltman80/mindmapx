import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface NodePos {
  angle: number
}

const nodes: NodePos[] = [
  { angle: 0 },
  { angle: 72 },
  { angle: 144 },
  { angle: 216 },
  { angle: 288 },
]

interface BgProps {
  className?: string
}

export default function FaintMindmapBackground({ className = '' }: BgProps): JSX.Element {
  const [visible, setVisible] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { margin: '-50% 0px -50% 0px', once: true })

  useEffect(() => {
    if (!isInView) return
    let interval: number | undefined
    const start = setTimeout(() => {
      interval = window.setInterval(() => {
        setVisible(v => (v < nodes.length ? v + 1 : v))
      }, 800)
    }, 1000)
    return () => {
      clearTimeout(start)
      if (interval !== undefined) clearInterval(interval)
    }
  }, [isInView])

  return (
    <div ref={ref} className={`mindmap-bg-container ${className}`} aria-hidden="true">
      <svg viewBox="-150 -150 300 300" className="mindmap-bg">
        <circle
          cx="0"
          cy="0"
          r="30"
          fill="none"
          stroke="var(--mindmap-color)"
          strokeWidth="2"
        />
        {nodes.slice(0, visible).map((n, i) => {
          const rad = (n.angle * Math.PI) / 180
          const x = 110 * Math.cos(rad)
          const y = 110 * Math.sin(rad)
          return (
            <g key={i}>
              <motion.line
                x1="0"
                y1="0"
                x2={x}
                y2={y}
                stroke="var(--mindmap-color)"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8 }}
              />
              <motion.circle
                cx={x}
                cy={y}
                r="20"
                fill="none"
                stroke="var(--mindmap-color)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8 }}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
