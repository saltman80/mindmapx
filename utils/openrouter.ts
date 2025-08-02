export async function callOpenRouterWithRetries(prompt: string, maxRetries = 3): Promise<string | null> {
  const url = 'https://openrouter.ai/api/v1/chat/completions'
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://mindx.do',
    'X-Title': 'MindXdo',
  }

  const body = {
    model: process.env.OPENROUTER_DEFAULT_MODEL ?? 'openai/gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  }

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      const data = await response.json()
      const content = data?.choices?.[0]?.message?.content
      if (content) return content
    } catch (error) {
      console.warn(`OpenRouter retry ${i + 1} failed`, error)
    }
  }

  return null
}
