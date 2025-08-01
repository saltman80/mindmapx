import { useState } from 'react'
import { z } from 'zod'
import LoadingSpinner from '../../loadingspinner'
import { callOpenRouterWithRetries } from '../../utils/openrouter'

export interface MindmapNode {
  title: string
  children?: MindmapNode[]
}

const mindmapNodeSchema: z.ZodType<MindmapNode> = z.lazy(() =>
  z.object({
    title: z.string(),
    children: z.array(mindmapNodeSchema).max(3).optional(),
  }),
)

const mindmapSchema = z.object({
  title: z.string(),
  children: z.array(mindmapNodeSchema).max(8).optional(),
})

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
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    const prompt = buildMindmapPrompt(topic)
    for (let i = 0; i < 3; i++) {
      try {
        const response = await callOpenRouterWithRetries(prompt)
        const parsed = JSON.parse(response)
        const validated = mindmapSchema.parse(parsed)
        const built = buildMindmapFromJSON(validated)
        onGenerate(built)
        setLoading(false)
        return
      } catch (err) {
        console.warn('Mindmap generation failed', err)
        if (i === 2) setError('Failed to generate mind map')
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
