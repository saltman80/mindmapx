import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import useScrollReveal from './useScrollReveal'
import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'

const StackingText: React.FC<{ text: string }> = ({ text }) => (
  <span className="stacking-text">
    {text.split('').map((ch, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.05 }}
      >
        {ch === ' ' ? '\u00A0' : ch}
      </motion.span>
    ))}
  </span>
)

interface MapItem {
  text: string
}

interface SimpleMap {
  title: string
  items: MapItem[]
}

const maps: SimpleMap[] = [
  {
    title: 'Product Launch',
    items: [
      { text: 'Research market' },
      { text: 'Design prototype' },
      { text: 'Gather feedback' },
      { text: 'Finalize features' },
      { text: 'Release to users' },
    ],
  },
  {
    title: 'Brainstorm Session',
    items: [
      { text: 'Collect ideas' },
      { text: 'Group topics' },
      { text: 'Vote priorities' },
      { text: 'Assign owners' },
      { text: 'Plan next steps' },
    ],
  },
  {
    title: 'Learning Plan',
    items: [
      { text: 'Choose resources' },
      { text: 'Schedule study time' },
      { text: 'Practice exercises' },
      { text: 'Review progress' },
      { text: 'Share knowledge' },
    ],
  },
]

interface MindmapDemoProps {
  compact?: boolean
}

export default function MindmapDemo({ compact = false }: MindmapDemoProps): JSX.Element {
  useScrollReveal()
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { margin: '-20% 0px -20% 0px', once: true })
  const mapCount = maps.length
  const maxItems = Math.max(...maps.map(m => m.items.length))
  const totalSteps = mapCount * maxItems
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (step >= totalSteps) return
    const t = setTimeout(() => setStep(prev => prev + 1), 600)
    return () => clearTimeout(t)
  }, [inView, step, totalSteps])

  return (
    <div className="mindmap-demo-page">
      <section ref={sectionRef} className="mindmap-demo section reveal relative overflow-x-visible">
        <FaintMindmapBackground />
        <div className="container section--one-col text-center">
          <h1 className="marketing-text-large">Visualize Ideas in Seconds</h1>
          <p className="section-subtext">
            Mind maps animate to life and AI can auto-create them so you focus purely on brainstorming
          </p>
          <div className="mindmap-grid">
            {maps.map((map, mapIndex) => (
              <div className="mindmap-container" key={map.title}>
              <svg viewBox="-160 -160 320 320" className="mindmap-svg">
              {map.items.map((item, itemIndex) => {
                const angle = (itemIndex / map.items.length) * Math.PI * 2 - Math.PI / 2
                const x = 110 * Math.cos(angle)
                const y = 110 * Math.sin(angle)
                const startX = 35 * Math.cos(angle)
                const startY = 35 * Math.sin(angle)
                const lineX = x - 25 * Math.cos(angle)
                const lineY = y - 25 * Math.sin(angle)
                const visible = step >= itemIndex * mapCount + mapIndex
                return (
                  <g key={item.text}>
                    <motion.line
                      x1={startX}
                      y1={startY}
                      x2={visible ? lineX : startX}
                      y2={visible ? lineY : startY}
                      stroke="var(--color-border)"
                      strokeWidth="2"
                      transition={{ duration: 0.6 }}
                    />
                    <motion.circle
                      cx={visible ? x : 0}
                      cy={visible ? y : 0}
                      r="25"
                      fill="orange"
                      stroke="var(--color-border)"
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                    {visible && (
                      <motion.text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="node-text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.6, ease: 'easeOut' }}
                      >
                        {item.text}
                      </motion.text>
                    )}
                  </g>
                )
              })}
              <circle
                cx="0"
                cy="0"
                r="35"
                fill="orange"
                stroke="var(--color-border)"
              />
              <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" className="root-text">
                {map.title}
              </text>
              </svg>
            </div>
          ))}
          </div>
          <div className="mindmap-info">
            <div className="mindmap-text-block">
              Harness AI to expand every idea into todos and Kanban cards so your
              team can start executing right away.
            </div>
            <div className="mindmap-upgrade text-center">
              <Link to="/purchase" className="btn">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {compact ? null : (
        <>
          <section className="about-section reveal">
            <MindmapArm side="left" />
            <img
              src="./assets/marketing_square_mindmap_people.png"
              alt="Simple and Powerful"
            />
            <div>
              <h2 className="marketing-text-large">
                <StackingText text="Simple and Powerful" />
              </h2>
              <p className="section-subtext">
                Draft your vision in a map and push items into todos whenever you're ready, keeping your Kanban board in sync.
              </p>
            </div>
          </section>

          <section className="about-section reveal reverse">
            <MindmapArm side="right" />
            <img
              src="./assets/marketing_square_todolist_with_brain.png"
              alt="AI Todo Lists"
            />
            <div>
              <motion.h2
                className="marketing-text-large"
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                AI Todo Lists Keep Teams Aligned
              </motion.h2>
              <p className="section-subtext">
                AI turns map nodes into todos and Kanban cards so everyone knows what's next.
              </p>
            </div>
          </section>

          <section className="about-section reveal">
            <MindmapArm side="left" />
            <img
              src="./assets/marketing_square_ai_connecting.png"
              alt="AI Turns Vision Into Action"
            />
            <div>
              <motion.h2
                className="marketing-text-large"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                AI Turns Vision Into Action
              </motion.h2>
              <p className="section-subtext">
                Use AI or manual tools to expand ideas into tasks and track them on your planning board.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export function CompactMindmapDemo(): JSX.Element {
  return <MindmapDemo compact />
}
