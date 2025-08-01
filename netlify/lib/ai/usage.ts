import { getClient } from '../../functions/db-client.js'

export async function trackAIUsage(userId: string, type: 'mindmap' | 'todo' | 'kanban') {
  const client = await getClient()
  try {
    await client.query(
      'INSERT INTO ai_usage (user_id, type) VALUES ($1, $2)',
      [userId, type]
    )
  } finally {
    client.release()
  }
}

export async function getMonthlyUsage(userId: string, type: 'mindmap' | 'todo' | 'kanban') {
  const client = await getClient()
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  try {
    const { rows } = await client.query(
      'SELECT COUNT(*) FROM ai_usage WHERE user_id = $1 AND type = $2 AND created_at >= $3',
      [userId, type, startOfMonth]
    )
    return Number(rows[0].count)
  } finally {
    client.release()
  }
}
