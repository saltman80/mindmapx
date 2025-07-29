import type { PoolClient } from 'pg'

export async function ensureNewColumn(
  client: PoolClient,
  boardId: string
): Promise<string> {
  const { rows } = await client.query(
    "SELECT id FROM kanban_columns WHERE board_id=$1 AND lower(title)='new'",
    [boardId]
  )

  let newColId: string
  if (rows[0]?.id) {
    newColId = rows[0].id as string
  } else {
    const res = await client.query(
      "INSERT INTO kanban_columns (board_id, title, position) VALUES ($1,'New',0) RETURNING id",
      [boardId]
    )
    newColId = res.rows[0].id as string
  }

  return newColId
}
