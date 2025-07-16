import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from "@netlify/functions"
import OpenAI from 'openai'
import { randomUUID } from 'crypto'
import cors from './corsmiddleware.js'
import type { Todo } from './types.js'

function initTodoService(apiKey: string) {
  const openai = new OpenAI({ apiKey })
  return {
    generateTodos: async (prompt: string): Promise<Todo[]> => {
      const baseMessages = [
        { role: 'system', content: 'You generate todo lists.' },
        {
          role: 'user',
          content: `Generate a JSON array of todos with fields id (uuid), title (string), and completed (boolean) for this request: "${prompt}". Return valid JSON only.`
        }
      ]
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: baseMessages.map(m => ({
          role: m.role as any,
          content: m.content,
          name: (m as any).name ?? undefined
        })),
        temperature: 0.7,
        max_tokens: 200
      })
      const content = completion.choices[0].message?.content
      if (!content) throw new Error('Empty response from AI')
      let todosRaw: unknown
      try {
        todosRaw = JSON.parse(content)
      } catch {
        const match = content.match(/\[.*?\]/s)
        if (!match) throw new Error('Invalid AI response format')
        try {
          todosRaw = JSON.parse(match[0])
        } catch {
          throw new Error('Failed to parse JSON from AI response')
        }
      }
      if (!Array.isArray(todosRaw)) throw new Error('AI response is not an array')
      const rows = todosRaw as any[]
      const todos: Todo[] = rows.map(r => ({
        id: typeof r.id === 'string' ? r.id : randomUUID(),
        title: typeof r.title === 'string' ? r.title : String(r.title),
        completed: typeof r.completed === 'boolean' ? r.completed : Boolean(r.completed),
        user_id: r.user_id,
        description: r.description,
        assignee_id: r.assignee_id,
        created_at: r.created_at instanceof Date ? r.created_at.toISOString() : new Date(r.created_at).toISOString(),
        updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : new Date(r.updated_at).toISOString(),
      }))
      return todos
    }
  }
}

const API_KEY = process.env.AI_TODO_SERVICE_KEY
if (!API_KEY) {
  throw new Error('Missing AI_TODO_SERVICE_KEY environment variable')
}
const todoService = initTodoService(API_KEY)

export const handler: Handler = async (
  event,
  context
): Promise<HandlerResponse> => {
  await cors(event, context)
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing request body' })
    }
  }
  let data: any
  try {
    data = JSON.parse(event.body)
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON' })
    }
  }
  const prompt = data.prompt
  if (!prompt || typeof prompt !== 'string') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid or missing prompt' })
    }
  }
  try {
    const todos = await todoService.generateTodos(prompt)
    return {
      statusCode: 200,
      body: JSON.stringify({ todos })
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  }
}
