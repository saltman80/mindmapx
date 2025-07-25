import InteractiveKanbanBoard from './InteractiveKanbanBoard'

interface Props {
  boardData?: { title?: string; description?: string }
}

export default function KanbanCanvas({ boardData }: Props) {
  const { title, description } =
    boardData || { title: 'Kanban Board', description: '' }
  return <InteractiveKanbanBoard title={title} description={description} />
}
