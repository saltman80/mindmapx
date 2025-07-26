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
        {ch === ' ' ? '\u00A0' : ch}
      </motion.span>
    ))}
  </span>
)

interface Card {
  title: string
  assignee: string
}

interface Lane {
  title: string
  cards: Card[]
}

const lanes: Lane[] = [
  {
    title: 'Planning',
    cards: [
      { title: 'Research audience', assignee: 'Alice' },
      { title: 'Define goals', assignee: 'Bob' },
      { title: 'Outline strategy', assignee: 'Carol' }
    ]
  },
  {
    title: 'Creation',
    cards: [
      { title: 'Design assets', assignee: 'Dave' },
      { title: 'Write copy', assignee: 'Eve' },
      { title: 'Build pages', assignee: 'Frank' }
    ]
  },
  {
    title: 'Review',
    cards: [
      { title: 'Collect feedback', assignee: 'Grace' },
      { title: 'Refine materials', assignee: 'Heidi' }
    ]
  },
  {
    title: 'Done',
    cards: [
      { title: 'Launch campaign', assignee: 'Ivan' },
      { title: 'Report metrics', assignee: 'Judy' }
    ]
  }
]

export default function Kanban(): JSX.Element {
  useScrollReveal()
  const laneCount = lanes.length
  const maxCards = Math.max(...lanes.map(l => l.cards.length))
  const totalSteps = laneCount + laneCount * maxCards
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= totalSteps) return
    const t = setTimeout(() => setStep(prev => prev + 1), 600)
    return () => clearTimeout(t)
  }, [step, totalSteps])

  return (
    <div id="top" tabIndex={-1} style={{ scrollMarginTop: '114px' }}>
    <div className="kanban-demo-page">
      <section className="kanban-demo section reveal relative overflow-x-visible">
        <FaintMindmapBackground className="mindmap-bg-small" />
        <div className="container">
          <div className="max-w-2xl mx-auto mb-8 text-center">
            <h1 className="marketing-text-large">Smooth Kanban Flow</h1>
            <p className="section-subtext">Kanban boards are perfect for executing your vision across a team, showing how mind map tasks move from to-do to done.</p>
          </div>
          <div className="scroll-container">
            <div className="kanban-board">
              {lanes.map((lane, laneIndex) => {
              const laneVisible = step >= laneIndex
              return (
                <motion.div
                  className="kanban-lane"
                  key={lane.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={laneVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="lane-title">{lane.title}</h3>
                  {lane.cards.map((card, cardIndex) => {
                    const cardStepStart = laneCount + laneIndex * maxCards + cardIndex
                    const cardVisible = step >= cardStepStart
                    return (
                      <motion.div
                        className="kanban-card"
                        key={card.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={cardVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                        transition={{ duration: 0.5 }}
                      >
                        <span className="sparkle" aria-hidden="true">✨</span>
                        <strong>{card.title}</strong>
                        <div className="assignee">- {card.assignee}</div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )
            })}
            </div>
          </div>
          <div className="kanban-upgrade text-center">
            <Link to="/purchase" className="btn">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="about-section reveal">
        <MindmapArm side="left" />
        <img
          src="./assets/marketing_square_treasuremap.png"
          alt="AI Workflows"
        />
        <div>
          <h2 className="marketing-text-large">
            <StackingText text="AI Workflows" />
          </h2>
          <p className="section-subtext">
            New cards from your mind map appear instantly so your board stays in sync.
          </p>
        </div>
      </section>

      <section className="about-section reveal reverse">
        <MindmapArm side="right" />
        <img
          src="./assets/marketing_square_mindmap_people.png"
          alt="Stay Organized"
        />
        <div>
          <motion.h2
            className="marketing-text-large"
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Stay Organized Every Step
          </motion.h2>
          <p className="section-subtext">
            Track progress from planning to completion as todos move across your board.
          </p>
        </div>
      </section>

      <section className="about-section reveal">
        <MindmapArm side="left" />
        <img
          src="./assets/marketing_square_ai_connecting.png"
          alt="Coordinate With Clarity"
        />
        <div>
          <motion.h2
            className="marketing-text-large"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Coordinate With Clarity
          </motion.h2>
          <p className="section-subtext">
            Everyone knows what to do as cards sync with their matching todos.
          </p>
        </div>
      </section>
      </div>
    </div>
  )
}
