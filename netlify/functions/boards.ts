import type { HandlerEvent, HandlerContext } from '@netlify/functions'

export const handler = async (
  _event: HandlerEvent,
  _context: HandlerContext
) => {
  const boards = [
    { id: 'demo1', title: 'Demo Board', created_at: new Date().toISOString() }
  ]
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ boards })
  }
}
