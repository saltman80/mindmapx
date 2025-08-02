import { useState } from 'react'
import LoadingSpinner from '../../loadingspinner'
import { callOpenRouterWithRetries } from '../../utils/openrouter'
import { getMonthlyUsage, trackAIUsage } from '../../lib/ai/usage'
import { useUser } from '../../src/lib/UserContext'

export interface TodoItem {
  title: string
}

function buildTodosPrompt(title: string, description = ''): string {
  const desc = description.trim()
  return `Create a JSON array of up to 20 actionable todo items that form a plan to accomplish "${title}".${desc ? ` Use the description "${desc}" to guide and refine the tasks.` : ''} Each item should include a title. Return only valid JSON without code fences or extra text.`
}

interface AIButtonProps {
  title: string
  description?: string
  onGenerate: (data: TodoItem[]) => void
}

export default function AIButton({ title, description = '', onGenerate }: AIButtonProps): JSX.Element {
  const [loading, setLoading] = useState(false)
  const { user } = useUser()

  const handleClick = async () => {
    if (!user?.id) {
      alert('You must be logged in to use AI features.')
      return
    }

    setLoading(true)
    try {
      const { usage, limit } = await getMonthlyUsage(user.id, 'todo')
      if (usage >= limit) {
        alert(`You’ve reached your ${limit} AI todo list creations this month.`)
        return
      }

      const prompt = buildTodosPrompt(title, description)
      const response = await callOpenRouterWithRetries(prompt)
      if (!response) {
        alert('AI failed to generate a todo list after 3 attempts.')
        return
      }

      let parsedTodos: { title: string }[] = []
      try {
        const parsed = JSON.parse(response)
        if (!Array.isArray(parsed)) throw new Error('Not an array')
        parsedTodos = parsed.filter((item: any) => typeof item.title === 'string')
        if (parsedTodos.length === 0) throw new Error('No valid todos')
      } catch {
        alert('AI returned an invalid todo list.')
        return
      }

      await trackAIUsage(user.id, 'todo')
      onGenerate(parsedTodos)
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

