import { useEffect, useState } from 'react'
import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'
import {
  LIMIT_MINDMAPS,
  LIMIT_TODO_LISTS,
  LIMIT_KANBAN_BOARDS,
  LIMIT_AI_MONTHLY,
  LIMIT_MINDMAPS_TRIAL,
  LIMIT_TODO_LISTS_TRIAL,
  LIMIT_KANBAN_BOARDS_TRIAL,
} from './src/constants'

interface Usage {
  mindmaps: number
  todoLists: number
  boards: number
  aiUsage: number
}

export default function AccountPage(): JSX.Element {
  const [usage, setUsage] = useState<Usage>({
    mindmaps: 0,
    todoLists: 0,
    boards: 0,
    aiUsage: 0,
  })
  const [aiLimit, setAiLimit] = useState(LIMIT_AI_MONTHLY)
  const [isTrial, setIsTrial] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mindmapLimit = isTrial ? LIMIT_MINDMAPS_TRIAL : LIMIT_MINDMAPS
  const todoLimit = isTrial ? LIMIT_TODO_LISTS_TRIAL : LIMIT_TODO_LISTS
  const boardLimit = isTrial ? LIMIT_KANBAN_BOARDS_TRIAL : LIMIT_KANBAN_BOARDS

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        const [usageRes, statusRes] = await Promise.all([
          fetch('/api/usage', { credentials: 'include', signal: controller.signal }),
          fetch('/api/user-status', { credentials: 'include', signal: controller.signal })
        ])
        if (usageRes.ok) {
          const data = await usageRes.json()
          setUsage({
            mindmaps: Number(data.mindmaps) || 0,
            todoLists: Number(data.todoLists) || 0,
            boards: Number(data.boards) || 0,
            aiUsage: Number(data.aiUsage) || 0,
          })
          setAiLimit(Number(data.aiLimit) || LIMIT_AI_MONTHLY)
        }
        if (statusRes.ok) {
          const status = await statusRes.json()
          if (status?.data?.subscription_status === 'trialing') {
            setIsTrial(true)
          }
        }
      } catch {}
    })()
    return () => controller.abort()
  }, [])

  const handleCancel = async () => {
    setLoading(true)
    setError(null)
    setMsg(null)
    try {
      const res = await fetch('/.netlify/functions/cancelSubscription', {
        method: 'POST',
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Failed to cancel subscription')
      setMsg('Subscription canceled')
    } catch (err: any) {
      setError(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section section--one-col relative overflow-hidden">
      <MindmapArm side="right" />
      <FaintMindmapBackground />
      <div className="form-card text-center space-y-4">
        <h1 className="text-2xl font-semibold mb-4">Account Settings</h1>
        <p>Manage your account preferences here.</p>
        {msg && <div className="text-green-600">{msg}</div>}
        {error && <div className="text-red-600">{error}</div>}
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Cancel Subscription
        </button>
      </div>
      <div className="form-card limit-tile">
        <h2 className="text-xl font-semibold mb-2 text-center">Usage Limits</h2>
        <table className="sidebar-metrics">
          <tbody>
            <tr>
              <td className="metric-label">Mindmaps</td>
              <td className="metric-value">
                {usage.mindmaps}/{mindmapLimit}
              </td>
            </tr>
            <tr>
              <td className="metric-label">Todo Lists</td>
              <td className="metric-value">
                {usage.todoLists}/{todoLimit}
              </td>
            </tr>
            <tr>
              <td className="metric-label">Kanban Boards</td>
              <td className="metric-value">
                {usage.boards}/{boardLimit}
              </td>
            </tr>
            <tr>
              <td className="metric-label">AI Automations</td>
              <td className="metric-value">
                {usage.aiUsage}/{aiLimit} this month
              </td>
            </tr>
          </tbody>
        </table>
        <div className="text-center text-red-600 space-y-1 mt-4">
          {usage.mindmaps >= mindmapLimit && <p>Mindmap limit reached</p>}
          {usage.todoLists >= todoLimit && <p>Todo list limit reached</p>}
          {usage.boards >= boardLimit && <p>Kanban board limit reached</p>}
        </div>
      </div>
    </section>
  )
}
