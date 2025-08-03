import { LIMIT_MINDMAPS, LIMIT_TODO_LISTS, LIMIT_KANBAN_BOARDS, LIMIT_MINDMAPS_TRIAL, LIMIT_TODO_LISTS_TRIAL, LIMIT_KANBAN_BOARDS_TRIAL } from '../constants'

export type ResourceType = 'mindmap' | 'todo' | 'board'

export async function checkLimit(resource: ResourceType): Promise<boolean> {
  try {
    const [usageRes, statusRes] = await Promise.all([
      fetch('/.netlify/functions/usage', { credentials: 'include' }),
      fetch('/.netlify/functions/user-status', { credentials: 'include' })
    ])
    if (!usageRes.ok || !statusRes.ok) return true

    const usage = await usageRes.json()
    const statusJson = await statusRes.json()
    const isTrial = statusJson?.data?.subscription_status === 'trialing'

    let count = 0
    let limit = 0
    let label = ''

    switch (resource) {
      case 'mindmap':
        count = usage.mindmaps ?? 0
        limit = isTrial ? LIMIT_MINDMAPS_TRIAL : LIMIT_MINDMAPS
        label = 'Mindmap'
        break
      case 'todo':
        count = usage.todoLists ?? 0
        limit = isTrial ? LIMIT_TODO_LISTS_TRIAL : LIMIT_TODO_LISTS
        label = 'Todo list'
        break
      case 'board':
        count = usage.boards ?? 0
        limit = isTrial ? LIMIT_KANBAN_BOARDS_TRIAL : LIMIT_KANBAN_BOARDS
        label = 'Kanban board'
        break
    }

    if (count >= limit) {
      alert(`${label} limit reached`)
      return false
    }

    return true
  } catch {
    return true
  }
}

