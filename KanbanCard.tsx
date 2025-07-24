export default function KanbanCard({ title }: { title?: string }) {
  return (
    <div className="kanban-card">
      {title || 'New Card'}
    </div>
  )
}
