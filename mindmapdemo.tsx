import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import useScrollReveal from './useScrollReveal'
import FaintMindmapBackground from './FaintMindmapBackground'

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
    <div className="mindmap-demo section reveal relative overflow-hidden">
      <FaintMindmapBackground />
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="marketing-text-large">Visualize Ideas in Seconds</h1>
        <p className="section-subtext">
          Mind maps animate to life so you can focus on brainstorming
        </p>
      </div>
      <div className="mindmap-grid section--two-col">
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
                const visible = step >= itemIndex * mapCount + mapIndex
                return (
                  <g key={item.text}>
                    <motion.line
                      x1="0"
                      y1="0"
                      x2={visible ? x : 0}
                      y2={visible ? y : 0}
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
                    <motion.text
                      x={visible ? x : 0}
                      y={visible ? y : 0}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="node-text"
                      transition={{ duration: 0.6 }}
                    >
                      {item.text}
                    </motion.text>
                  </g>
                )
              })}
            </svg>
          </div>
        ))}
      </div>
      <div className="mindmap-upgrade">
        <Link to="/payment" className="btn">
          Upgrade
        </Link>
      </div>
    </div>
  )
}
