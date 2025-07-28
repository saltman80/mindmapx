import { useEffect, useState } from 'react'
import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'
import {
  LIMIT_MINDMAPS,
  LIMIT_TODO_LISTS,
  LIMIT_KANBAN_BOARDS,
  TOTAL_AI_LIMIT,
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

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/usage', { credentials: 'include', signal: controller.signal })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) {
          setUsage({
            mindmaps: Number(data.mindmaps) || 0,
            todoLists: Number(data.todoLists) || 0,
            boards: Number(data.boards) || 0,
            aiUsage: Number(data.aiUsage) || 0,
          })
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return (
    <section className="section section--one-col relative overflow-hidden">
      <MindmapArm side="right" />
      <FaintMindmapBackground />
      <div className="form-card text-center space-y-4">
        <h1 className="text-2xl font-semibold mb-4">Account Settings</h1>
        <p>Manage your account preferences here.</p>
        <p>
          Status: <strong>Active</strong>
        </p>
        <button className="bg-red-600 text-white px-4 py-2 rounded">Cancel Account</button>
      </div>
      <div className="form-card limit-tile">
        <h2 className="text-xl font-semibold mb-2 text-center">Usage Limits</h2>
        <table className="sidebar-metrics">
          <tbody>
            <tr>
              <td className="metric-label">Mindmaps</td>
              <td className="metric-value">
                {usage.mindmaps}/{LIMIT_MINDMAPS}
              </td>
            </tr>
            <tr>
              <td className="metric-label">Todo Lists</td>
              <td className="metric-value">
                {usage.todoLists}/{LIMIT_TODO_LISTS}
              </td>
            </tr>
            <tr>
              <td className="metric-label">Kanban Boards</td>
              <td className="metric-value">
                {usage.boards}/{LIMIT_KANBAN_BOARDS}
              </td>
            </tr>
            <tr>
              <td className="metric-label">AI Automations</td>
              <td className="metric-value">
                {usage.aiUsage}/{TOTAL_AI_LIMIT} this month
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
