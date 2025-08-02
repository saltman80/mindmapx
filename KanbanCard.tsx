export default function KanbanCard({ title }: { title?: string }) {
  return (
    <div className="kanban-card">
      <div className="kanban-title">{title || 'New Card'}</div>
    </div>
  )
}
