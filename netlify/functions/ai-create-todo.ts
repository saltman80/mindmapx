import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import OpenAI from 'openai'

const openaiKey = process.env.OPENAI_API_KEY
if (!openaiKey) throw new Error('Missing OPENAI_API_KEY')
const openai = new OpenAI({ apiKey: openaiKey })
const MODEL = process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o-mini'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  if (!event.body) return { statusCode: 400, body: 'Missing body' }
  let data: any
  try { data = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  const { prompt } = data
  if (!prompt || typeof prompt !== 'string') return { statusCode: 400, body: 'Invalid prompt' }
  try {
    const baseMessages = [
      { role: 'system', content: 'Generate a JSON array of todo items with title and optional description.' },
      { role: 'user', content: prompt }
    ]
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: baseMessages.map(m => ({
        role: m.role as any,
        content: m.content,
        name: (m as any).name ?? undefined
      })),
      max_tokens: 200
    })
    const text = completion.choices?.[0]?.message?.content
    if (!text) return { statusCode: 500, body: 'No AI content' }
    let todos
    try { todos = JSON.parse(text) } catch { todos = [] }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todos })
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
}
