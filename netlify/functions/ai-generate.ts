import OpenAI from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
})

const MODEL = "openai/gpt-4o-mini"

export async function generateAIResponse(prompt: string, systemPrompt?: string) {
  const messages: ChatCompletionMessageParam[] = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    { role: "user", content: prompt }
  ]

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages,
    max_tokens: 1000
  })

  return completion.choices[0].message.content as string
}
