import InteractiveKanbanBoard from './InteractiveKanbanBoard'

interface Column {
  id: string
  title: string
  position: number
}

interface CardItem {
  id: string
  column_id: string
  title: string
  description?: string
  status?: string
  priority?: string
  due_date?: string
  assignee_id?: string
  position: number
}

interface Props {
  boardData?: { id?: string; title?: string; description?: string }
  boardId?: string
  columns?: Column[]
  cards?: CardItem[]
}

export default function KanbanCanvas({ boardData, boardId, columns, cards }: Props) {
  const { title, description } =
    boardData || { title: 'Kanban Board', description: '' }
  return (
    <InteractiveKanbanBoard
      boardId={boardId}
      title={title}
      description={description}
      columns={columns}
      cards={cards}
    />
  )
}
