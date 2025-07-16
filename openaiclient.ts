import OpenAI from 'openai'
import type { ChatCompletionCreateParams } from 'openai/resources/chat/completions'

const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o-mini'
const DEFAULT_TEMPERATURE = parseFloat(process.env.OPENAI_DEFAULT_TEMPERATURE ?? '0.7')
const DEFAULT_MAX_TOKENS = parseInt(process.env.OPENAI_DEFAULT_MAX_TOKENS ?? '256', 10)

let openaiInstance: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (openaiInstance) return openaiInstance
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY environment variable')
  openaiInstance = new OpenAI({ apiKey })
  return openaiInstance
}

interface OpenAIErrorResponse {
  response?: { status: number; data?: any }
}
function isOpenAIError(err: unknown): err is OpenAIErrorResponse {
  return typeof err === 'object' && err !== null && 'response' in err
}

export async function generateCompletion(
  prompt: string,
  options: Omit<ChatCompletionCreateParams, 'messages'> = {}
): Promise<string> {
  const client = getOpenAI()
  const payload: ChatCompletionCreateParams = {
    model: DEFAULT_MODEL,
    temperature: DEFAULT_TEMPERATURE,
    max_tokens: DEFAULT_MAX_TOKENS,
    ...options,
    messages: [{ role: 'user', content: prompt }],
  }
  try {
    const res = await client.chat.completions.create(payload)
    const content = res.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenAI API returned no content')
    return content.trim()
  } catch (error: unknown) {
    if (isOpenAIError(error) && error.response) {
      const { status, data } = error.response
      const sanitized = data?.error
        ? { message: data.error.message, type: data.error.type }
        : {}
      console.error('OpenAI API Error Details:', data)
      throw new Error(`OpenAI API Error ${status}: ${sanitized.message ?? 'An error occurred'}`)
    }
    console.error('OpenAI API Unexpected Error:', error)
    if (error instanceof Error) {
      throw new Error(`OpenAI API request failed: ${error.message}`)
    }
    throw new Error('OpenAI API request failed: Unknown error')
  }
}