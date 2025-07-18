import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
        {ch}
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

export default function MindmapDemo(): JSX.Element {
  useScrollReveal()
  const mapCount = maps.length
  const maxItems = Math.max(...maps.map(m => m.items.length))
  const totalSteps = mapCount * maxItems
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= totalSteps) return
    const t = setTimeout(() => setStep(prev => prev + 1), 600)
    return () => clearTimeout(t)
  }, [step, totalSteps])

  return (
    <div className="mindmap-demo-page">
      <section className="mindmap-demo section reveal relative overflow-hidden">
        <FaintMindmapBackground />
        <div className="container section--one-col text-center">
          <img src="./assets/placeholder.svg" alt="" className="section-icon" />
          <h1 className="marketing-text-large">Visualize Ideas in Seconds</h1>
          <p className="section-subtext">
            Mind maps animate to life so you can focus on brainstorming
          </p>
          <div className="mindmap-grid">
            {maps.map((map, mapIndex) => (
              <div className="mindmap-container" key={map.title}>
              <svg viewBox="-160 -160 320 320" className="mindmap-svg">
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
                      transition={{ duration: 0.6 }}
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
                        transition={{ duration: 0.3, delay: 0.6 }}
                      >
                        {item.text}
                      </motion.text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>
          ))}
          <div className="mindmap-text-block">
            Harness the power of AI-driven mind mapping to quickly expand and
            organize your best ideas into actionable plans.
          </div>
        </div>
        <div className="mindmap-upgrade text-center">
          <Link to="/purchase" className="btn">
            Upgrade
          </Link>
        </div>
      </section>

      <section className="section section-bg-alt reveal relative overflow-hidden">
        <MindmapArm side="left" />
        <div className="container section--one-col text-center">
          <img src="./assets/placeholder.svg" alt="" className="section-icon" />
          <h2 className="marketing-text-large">
            <StackingText text="Simple and Powerful" />
          </h2>
          <p className="section-subtext">
            Plan projects effortlessly with intuitive maps that grow alongside your ideas.
          </p>
        </div>
      </section>

      <section className="section reveal">
        <div className="container section--one-col text-center">
          <img src="./assets/placeholder.svg" alt="" className="section-icon" />
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
            Assign tasks from your maps and watch progress unfold automatically.
          </p>
        </div>
      </section>

      <section className="section section-bg-primary-light reveal relative overflow-hidden">
        <MindmapArm side="right" />
        <div className="container section--one-col text-center">
          <img src="./assets/placeholder.svg" alt="" className="section-icon" />
          <motion.h2
            className="marketing-text-large"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            See Beyond a Task Board
          </motion.h2>
          <p className="section-subtext">
            Mind map connections provide a bird's-eye view of every project step.
          </p>
        </div>
      </section>
    </div>
  )
}
