import { authFetch } from '../../authFetch'
import { LIMIT_AI_MONTHLY } from '../../src/constants'

export async function trackAIUsage(userId: string, type: 'mindmap' | 'todo' | 'kanban') {
  await authFetch('/.netlify/functions/ai-usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
    credentials: 'include',
  })
}

export async function getMonthlyUsage(userId: string, type: 'mindmap' | 'todo' | 'kanban') {
  const res = await authFetch(`/.netlify/functions/ai-usage?type=${type}`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok)
    return { usage: 0, limit: LIMIT_AI_MONTHLY }
  const data = await res.json()
  return {
    usage: Number(data.usage) || 0,
    limit: Number(data.aiLimit) || LIMIT_AI_MONTHLY,
  }
}
