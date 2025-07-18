import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import useScrollReveal from './useScrollReveal'

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
    <div className="mindmap-demo section section--two-col reveal">
      {maps.map((map, mapIndex) => (
        <div className="mindmap-card" key={map.title}>
          <h3>{map.title}</h3>
          <ul className="mindmap-list">
            {map.items.map((item, itemIndex) => {
              const visible = step >= itemIndex * mapCount + mapIndex
              return (
                <motion.li
                  className="mindmap-item"
                  key={item.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 0.5 }}
                >
                  {item.text}
                </motion.li>
              )
            })}
          </ul>
        </div>
      ))}
      <div className="mindmap-upgrade">
        <Link to="/payment" className="btn">
          Upgrade
        </Link>
      </div>
    </div>
  )
}
