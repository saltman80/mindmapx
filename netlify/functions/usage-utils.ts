import { getClient } from './db-client.js'
import {
  LIMIT_AI_MONTHLY,
  LIMIT_AI_TRIAL,
  TOTAL_AI_LIMIT,
  TOTAL_AI_TRIAL_LIMIT,
} from './limits.js'

export async function logAiUsage(userId: string): Promise<void> {
  const client = await getClient()
  try {
    await client.query(
      'INSERT INTO usage_events (user_id, event_type) VALUES ($1, $2)',
      [userId, 'ai_create']
    )
  } finally {
    client.release()
  }
}

export async function aiUsageThisMonth(userId: string): Promise<number> {
  const client = await getClient()
  try {
    const { rows } = await client.query(
      `SELECT COUNT(*) FROM usage_events
       WHERE user_id = $1
         AND event_type = 'ai_create'
         AND created_at >= date_trunc('month', CURRENT_DATE)`,
      [userId]
    )
    return Number(rows[0].count)
  } finally {
    client.release()
  }
}

export async function getAiLimit(userId: string): Promise<{ limit: number; total: number }> {
  const client = await getClient()
  try {
    const { rows } = await client.query(
      'SELECT subscription_status FROM users WHERE id = $1',
      [userId]
    )
    const status = rows[0]?.subscription_status
    const limit = status === 'trialing' ? LIMIT_AI_TRIAL : LIMIT_AI_MONTHLY
    const total = status === 'trialing' ? TOTAL_AI_TRIAL_LIMIT : TOTAL_AI_LIMIT
    return { limit, total }
  } finally {
    client.release()
  }
}

export async function checkAiLimit(userId: string): Promise<boolean> {
  const { total } = await getAiLimit(userId)
  const count = await aiUsageThisMonth(userId)
  return count < total
}
