import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import useScrollReveal from './useScrollReveal'

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
    <div className="todo-demo section section--two-col reveal">
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
                  {item.text}{' '}
                  <span className="assignee">- {item.assignee}</span>
                </motion.li>
              )
            })}
          </ul>
        </div>
      ))}
      <div className="todo-upgrade">
        <Link to="/payment" className="btn">
          Upgrade
        </Link>
      </div>
    </div>
  )
}
