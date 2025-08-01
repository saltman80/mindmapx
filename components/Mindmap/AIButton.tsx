import { useState } from 'react'
import LoadingSpinner from '../../loadingspinner'
import { callOpenRouterWithRetries } from '../../utils/openrouter'
import { getMonthlyUsage, trackAIUsage } from '../../lib/ai/usage'
import { useUser } from '../../src/lib/UserContext'

export interface MindmapNode {
  title: string
  children?: MindmapNode[]
}

export function buildMindmapFromJSON(data: MindmapNode): MindmapNode {
  return data
}

function buildMindmapPrompt(topic: string): string {
  return `Create a JSON mind map about ${topic} with a central idea and up to 8 top-level nodes. Each node may have children. Return only valid JSON.`
}

interface AIButtonProps {
  topic: string
  onGenerate: (data: MindmapNode) => void
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
      const usage = await getMonthlyUsage(user.id, 'mindmap')
      if (usage >= 25) {
        alert("You've reached your 25 AI mindmap limit this month.")
        return
      }

      const prompt = buildMindmapPrompt(topic)
      const response = await callOpenRouterWithRetries(prompt)
      if (!response) {
        alert('AI failed to generate a mindmap after 3 attempts.')
        return
      }

      let parsed: any
      try {
        parsed = JSON.parse(response)
        if (!parsed || !parsed.children) throw new Error('Invalid JSON')
      } catch {
        alert('AI returned an invalid mindmap format.')
        return
      }

      await trackAIUsage(user.id, 'mindmap')
      const built = buildMindmapFromJSON(parsed)
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
