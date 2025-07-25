import { useState } from 'react'
import MindmapCanvas from './mindmapcanvas'
import TodoCanvas from './TodoCanvas'
import KanbanCanvas from './KanbanCanvas'

const initialNodes = [
  { id: '1', x: 100, y: 100, label: 'Idea' },
  { id: '2', x: 300, y: 200, label: 'Task' }
]
const initialEdges = [{ id: 'e1', from: '1', to: '2' }]

export default function ProjectWorkspace() {
  const [tab, setTab] = useState<'mindmap' | 'todo' | 'kanban'>('mindmap')

  return (
    <div className="workspace-page">
      <div className="tabs">
        <button onClick={() => setTab('mindmap')}>Mind Map</button>
        <button onClick={() => setTab('todo')}>Todos</button>
        <button onClick={() => setTab('kanban')}>Kanban</button>
      </div>
      {tab === 'mindmap' && (
        <MindmapCanvas
          nodes={initialNodes}
          edges={initialEdges}
          width={600}
          height={400}
          mindmapId="demo"
        />
      )}
      {tab === 'todo' && <TodoCanvas />}
      {tab === 'kanban' && <KanbanCanvas />}
    </div>
  )
}
