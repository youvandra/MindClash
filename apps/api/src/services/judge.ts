import { JudgeScore } from '../types'
import { generateText } from './openai'

export async function judgeDebate(topic: string, aText: string, bText: string) {
  const system = 'You are a strict debate judge. Score A and B from 0 to 1.'
  const prompt = `Topic: ${topic}\nA: ${aText}\nB: ${bText}\nReturn JSON {"a": number, "b": number}`
  const out = await generateText(system, prompt)
  try {
    const parsed = JSON.parse(out)
    const as = typeof parsed.a === 'number' ? parsed.a : 0.5
    const bs = typeof parsed.b === 'number' ? parsed.b : 0.5
    return { agentAScore: as, agentBScore: bs }
  } catch {
    const lenA = aText.length
    const lenB = bText.length
    const total = lenA + lenB || 1
    return { agentAScore: lenA / total, agentBScore: lenB / total }
  }
}

export async function aggregateJudgeScores(scores: JudgeScore[]) {
  const a = scores.reduce((s, v) => s + v.agentAScore, 0) / scores.length
  const b = scores.reduce((s, v) => s + v.agentBScore, 0) / scores.length
  return { a, b }
}
