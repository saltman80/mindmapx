import { useState } from 'react'
import LoadingSpinner from '../../loadingspinner'
import { callOpenRouterWithRetries } from '../../utils/openrouter'
import { getMonthlyUsage, trackAIUsage } from '../../lib/ai/usage'
import { useUser } from '../../src/lib/UserContext'

export interface KanbanCard {
  title: string
  description: string
}

export interface KanbanColumns {
  New: KanbanCard[]
  'In Progress': KanbanCard[]
  Done: KanbanCard[]
}

function buildKanbanPrompt(topic: string): string {
  return `Generate a JSON array of up to 20 kanban cards about "${topic}". Each card should have a title and description. Return only valid JSON.`
}

function buildKanbanFromCards(cards: KanbanCard[]): KanbanColumns {
  return { New: cards, 'In Progress': [], Done: [] }
}

interface AIButtonProps {
  topic: string
  onGenerate: (data: KanbanColumns) => void
}

export default function AIButton({ topic, onGenerate }: AIButtonProps): JSX.Element {
  const [loading, setLoading] = useState(false)
  const { user } = useUser()

  const handleClick = async () => {
    if (!user?.id) {
      alert('You must be logged in to use AI features.')
      return
    }

    setLoading(true)
    try {
      const usage = await getMonthlyUsage(user.id, 'kanban')
      if (usage >= 25) {
        alert("You’ve reached your 25 AI kanban creations this month.")
        return
      }

      const prompt = buildKanbanPrompt(topic)
      let cards: KanbanCard[] | null = null
      for (let i = 0; i < 3 && !cards; i++) {
        const response = await callOpenRouterWithRetries(prompt)
        if (!response) break
        try {
          const parsed = JSON.parse(response)
          if (!Array.isArray(parsed)) throw new Error('Invalid JSON array')
          const valid = parsed.filter(
            (c: any) => typeof c.title === 'string' && typeof c.description === 'string'
          )
          if (valid.length === 0) throw new Error('No valid cards found')
          cards = valid
        } catch (err) {
          if (i === 2) alert('AI returned an invalid Kanban card format.')
        }
      }

      if (!cards) {
        alert('AI failed to generate kanban cards after 3 attempts.')
        return
      }

      await trackAIUsage(user.id, 'kanban')
      const built = buildKanbanFromCards(cards)
      onGenerate(built)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button className="btn-primary" onClick={handleClick} disabled={loading}>
        {loading ? <LoadingSpinner size={16} /> : 'Create with AI'}
      </button>
    </div>
  )
}
