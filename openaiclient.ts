const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-3.5-turbo'
const DEFAULT_TEMPERATURE = parseFloat(process.env.OPENAI_DEFAULT_TEMPERATURE ?? '0.7')
const DEFAULT_MAX_TOKENS = parseInt(process.env.OPENAI_DEFAULT_MAX_TOKENS ?? '256', 10)

let openaiInstance: OpenAIApi | null = null
function getOpenAI(): OpenAIApi {
  if (openaiInstance) return openaiInstance
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY environment variable')
  const config = new Configuration({ apiKey })
  openaiInstance = new OpenAIApi(config)
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
  options: Omit<CreateChatCompletionRequest, 'messages'> = {}
): Promise<string> {
  const client = getOpenAI()
  const payload: CreateChatCompletionRequest = {
    model: DEFAULT_MODEL,
    temperature: DEFAULT_TEMPERATURE,
    max_tokens: DEFAULT_MAX_TOKENS,
    ...options,
    messages: [{ role: 'user', content: prompt }],
  }
  try {
    const res = await client.createChatCompletion(payload)
    const content = res.data.choices?.[0]?.message?.content
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