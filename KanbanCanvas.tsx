import InteractiveKanbanBoard from './InteractiveKanbanBoard'

interface Props {
  boardData?: { title?: string; description?: string }
}

export default function KanbanCanvas({ boardData }: Props) {
  const title = boardData?.title
  const description = boardData?.description
  return <InteractiveKanbanBoard title={title} description={description} />
}
