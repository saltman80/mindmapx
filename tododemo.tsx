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

interface TodoItem {
  text: string
  assignee?: string
}

interface TodoList {
  title: string
  items: TodoItem[]
}

const lists: TodoList[] = [
  {
    title: 'Marketing Plan',
    items: [
      { text: 'Research target audience', assignee: 'Alice' },
      { text: 'Set campaign goals', assignee: 'Bob' },
      { text: 'Outline content strategy', assignee: 'Carol' },
      { text: 'Prepare landing pages', assignee: 'Dave' },
      { text: 'Launch and monitor', assignee: 'Eve' },
    ],
  },
  {
    title: 'Facebook Ads',
    items: [
      { text: 'Define audience segments', assignee: 'Mallory' },
      { text: 'Design creative assets', assignee: 'Trent' },
      { text: 'Write ad copy', assignee: 'Peggy' },
      { text: 'Set budget', assignee: 'Victor' },
      { text: 'Analyze results', assignee: 'Walter' },
    ],
  },
  {
    title: 'Email Outreach',
    items: [
      { text: 'Compile contact list', assignee: 'Alice' },
      { text: 'Draft email templates', assignee: 'Bob' },
      { text: 'Schedule sends', assignee: 'Carol' },
      { text: 'Track opens', assignee: 'Dave' },
      { text: 'Follow up', assignee: 'Eve' },
    ],
  },
  {
    title: 'SEO Checklist',
    items: [
      { text: 'Keyword research', assignee: 'Mallory' },
      { text: 'Optimize metadata', assignee: 'Trent' },
      { text: 'Improve page speed', assignee: 'Peggy' },
      { text: 'Build backlinks', assignee: 'Victor' },
      { text: 'Review analytics', assignee: 'Walter' },
    ],
  },
]

export default function TodoDemo(): JSX.Element {
  useScrollReveal()
  const listCount = lists.length
  const maxItems = Math.max(...lists.map(l => l.items.length))
  const totalSteps = listCount * maxItems
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= totalSteps) return
    const t = setTimeout(() => setStep(prev => prev + 1), 600)
    return () => clearTimeout(t)
  }, [step, totalSteps])

  return (
    <div className="todo-demo-page">
      <section className="todo-demo section reveal relative overflow-x-visible">
        <FaintMindmapBackground />
        <div className="container">
          <div className="max-w-2xl mx-auto mb-8 text-center">
            <h1 className="marketing-text-large">Tackle Tasks Effortlessly</h1>
            <p className="section-subtext">Watch todos appear with smooth animations</p>
          </div>
          <div className="todo-grid section--two-col">
            {lists.map((list, listIndex) => (
              <div className="todo-card" key={list.title}>
            <h3>{list.title}</h3>
            <ul className="todo-list">
              {list.items.map((item, itemIndex) => {
                const visible = step >= itemIndex * listCount + listIndex
                return (
                  <motion.li
                    className="todo-item"
                    key={item.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="sparkle" aria-hidden="true">✨</span>
                    {item.text}{' '}
                    <span className="assignee">- {item.assignee}</span>
                  </motion.li>
                )
              })}
            </ul>
          </div>
        ))}
        </div>
        <div className="todo-upgrade text-center">
          <Link to="/purchase" className="btn">
            Get Started
          </Link>
        </div>
      </div>
      </section>

      <section className="about-section reveal">
        <MindmapArm side="left" />
        <img
          src="./assets/marketing_square_todolist_in_cloud.png"
          alt="AI Simplicity"
        />
        <div>
          <h2 className="marketing-text-large">
            <StackingText text="AI Simplicity" />
          </h2>
          <p className="section-subtext">
            Generate prioritized todos straight from your mind maps in moments.
          </p>
        </div>
      </section>

      <section className="about-section reveal reverse">
        <MindmapArm side="right" />
        <img
          src="./assets/marketing_square_lightbulb_team.png"
          alt="Team Management"
        />
        <div>
          <motion.h2
            className="marketing-text-large"
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Team Management Made Powerful
          </motion.h2>
          <p className="section-subtext">
            Everyone sees their tasks and how they connect to the bigger picture.
          </p>
        </div>
      </section>

      <section className="about-section reveal">
        <MindmapArm side="left" />
        <img
          src="./assets/marketing_square_ai_connecting.png"
          alt="Vision Meets Action"
        />
        <div>
          <motion.h2
            className="marketing-text-large"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Vision Meets Action
          </motion.h2>
          <p className="section-subtext">
            Use AI to find opportunities and aid you in executing your team's vision.
          </p>
        </div>
      </section>
    </div>
  )
}
