import { authFetch } from '../../authFetch'

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
  if (!res.ok) return 0
  const data = await res.json()
  return Number(data.usage) || 0
}
