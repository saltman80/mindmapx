import { useState } from 'react'
import { z } from 'zod'
import LoadingSpinner from '../../loadingspinner'
import { callOpenRouterWithRetries } from '../../utils/openrouter'

export interface KanbanCard {
  title: string
  description: string
}

export interface KanbanColumns {
  New: KanbanCard[]
  'In Progress': KanbanCard[]
  Done: KanbanCard[]
}

const cardSchema = z.object({
  title: z.string(),
  description: z.string(),
})

const kanbanSchema = z.object({
  New: z.array(cardSchema).max(20),
  'In Progress': z.array(cardSchema).length(0),
  Done: z.array(cardSchema).length(0),
})

export function buildKanbanFromJSON(data: KanbanColumns): KanbanColumns {
  return data
}

function buildKanbanPrompt(topic: string): string {
  return `Generate a JSON array of up to 20 kanban cards for ${topic}. Each should include a title and description. Group them into 1 column: New. Cards should only go into New column. Return only valid JSON.`
}

interface AIButtonProps {
  topic: string
  onGenerate: (data: KanbanColumns) => void
}

export default function AIButton({ topic, onGenerate }: AIButtonProps): JSX.Element {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    const prompt = buildKanbanPrompt(topic)
    for (let i = 0; i < 3; i++) {
      try {
        const response = await callOpenRouterWithRetries(prompt)
        const parsed = JSON.parse(response)
        const validated = kanbanSchema.parse(parsed)
        const built = buildKanbanFromJSON(validated)
        onGenerate(built)
        setLoading(false)
        return
      } catch (err) {
        console.warn('Kanban generation failed', err)
        if (i === 2) setError('Failed to generate kanban data')
      }
    }
    setLoading(false)
  }

  return (
    <div>
      <button className="btn-primary" onClick={handleClick} disabled={loading}>
        {loading ? <LoadingSpinner size={16} /> : 'Create with AI'}
      </button>
      {error && <div className="error-text">{error}</div>}
    </div>
  )
}
