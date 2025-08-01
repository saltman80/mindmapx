import { useState } from 'react'
import { z } from 'zod'
import LoadingSpinner from '../../loadingspinner'
import { callOpenRouterWithRetries } from '../../utils/openrouter'

export interface TodoItem {
  title: string
}

const todosSchema = z.array(z.object({ title: z.string() })).max(20)

export function buildTodosFromJSON(data: TodoItem[]): TodoItem[] {
  return data.map(t => ({ title: t.title }))
}

function buildTodosPrompt(topic: string): string {
  return `Create a JSON list of up to 20 todo items for ${topic}. Each item should have a title. Return only valid JSON.`
}

interface AIButtonProps {
  topic: string
  onGenerate: (data: TodoItem[]) => void
}

export default function AIButton({ topic, onGenerate }: AIButtonProps): JSX.Element {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    const prompt = buildTodosPrompt(topic)
    try {
      const response = await callOpenRouterWithRetries(prompt)
      if (!response) throw new Error('No response')
      const parsed = JSON.parse(response)
      const validated = todosSchema.parse(parsed)
      const built = buildTodosFromJSON(validated)
      onGenerate(built)
    } catch (err) {
      console.warn('Todo generation failed', err)
      setError('Failed to generate todos')
    } finally {
      setLoading(false)
    }
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
