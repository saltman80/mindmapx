import OpenAI from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://mindx.do",
    "X-Title": "MindXdo"
  }
})

const MODEL = process.env.OPENROUTER_DEFAULT_MODEL ?? "openai/gpt-4o-mini"

export async function generateAIResponse(prompt: string, systemPrompt?: string) {
  const messages: ChatCompletionMessageParam[] = []

  const baseSystem =
    "Return JSON without markdown code fences or surrounding quotes."
  if (systemPrompt) {
    messages.push({
      role: "system",
      content: `${baseSystem}\n${systemPrompt}`
    } as ChatCompletionMessageParam)
  } else {
    messages.push({ role: "system", content: baseSystem } as ChatCompletionMessageParam)
  }

  messages.push({ role: "user", content: prompt } as ChatCompletionMessageParam)

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages,
    max_tokens: 1000
  })

  let content = (completion.choices[0].message.content || "").trim()

  if (content.startsWith("```")) {
    content = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
  }

  content = content.replace(/^['"]|['"]$/g, "").trim()

  const braceStart = content.indexOf("{")
  const bracketStart = content.indexOf("[")
  let start = -1
  let end = -1

  if (braceStart !== -1 && (braceStart < bracketStart || bracketStart === -1)) {
    start = braceStart
    end = content.lastIndexOf("}")
  } else if (bracketStart !== -1) {
    start = bracketStart
    end = content.lastIndexOf("]")
  }

  if (start !== -1 && end !== -1) {
    content = content.slice(start, end + 1)
  }

  return content
}
