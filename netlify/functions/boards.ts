import type { HandlerEvent, HandlerContext } from '@netlify/functions'

let boards = [
  { id: 'demo1', title: 'Board 1', created_at: new Date().toISOString() }
]

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (event.httpMethod === 'POST') {
    try {
      const data = JSON.parse(event.body || '{}') as { title?: string }
      const newBoard = {
        id: Date.now().toString(),
        title: data.title || 'Untitled Board',
        created_at: new Date().toISOString()
      }
      boards.push(newBoard)
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(newBoard)
      }
    } catch {
      return { statusCode: 400, body: 'Invalid body' }
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ boards })
  }
}
