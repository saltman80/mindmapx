export async function callOpenRouterWithRetries(
  prompt: string,
  maxRetries = 3
): Promise<string | null> {
  const url = 'https://openrouter.ai/api/v1/chat/completions'
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://mindx.do',
    'X-Title': 'MindXdo',
  }

  const body = {
    model: process.env.OPENROUTER_DEFAULT_MODEL ?? 'openai/gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Return JSON without markdown code fences or surrounding quotes.'
      },
      { role: 'user', content: prompt }
    ],
  }

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      const data = await response.json()
      let content = data?.choices?.[0]?.message?.content
      if (typeof content === 'string') {
        content = content.trim()
        if (content.startsWith('```')) {
          content = content
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/, '')
        }
        content = content.replace(/^['"]|['"]$/g, '').trim()
        const braceStart = content.indexOf('{')
        const bracketStart = content.indexOf('[')
        let start = -1
        let end = -1
        if (braceStart !== -1 && (braceStart < bracketStart || bracketStart === -1)) {
          start = braceStart
          end = content.lastIndexOf('}')
        } else if (bracketStart !== -1) {
          start = bracketStart
          end = content.lastIndexOf(']')
        }
        if (start !== -1 && end !== -1) {
          content = content.slice(start, end + 1)
        }
        return content
      }
    } catch (error) {
      console.warn(`OpenRouter retry ${i + 1} failed`, error)
    }
  }

  return null
}
