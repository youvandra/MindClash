import OpenAI from 'openai'

const key = process.env.OPENAI_API_KEY
const client = key ? new OpenAI({ apiKey: key }) : null

export async function generateText(system: string, prompt: string) {
  if (!client) {
    return `${prompt.slice(0, 100)}...`
  }
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt }
    ]
  })
  const c = completion.choices[0]?.message?.content || ''
  return c
}
