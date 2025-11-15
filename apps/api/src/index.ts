import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { z } from 'zod'
import { db, persistenceInfo } from './db'
import { RoundEntry, RoundName } from './types'
import { generateText } from './services/openai'
import { judgeDebate, aggregateJudgeScores } from './services/judge'
import { calculateElo } from './services/elo'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/health', (req: Request, res: Response) => {
  res.json({ ok: true, supabase: persistenceInfo.useSupabase })
})

app.post('/knowledge-packs', async (req: Request, res: Response) => {
  const schema = z.object({ title: z.string(), content: z.string() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const kp = await db.createKnowledgePack(parsed.data.title, parsed.data.content)
  res.json(kp)
})

app.get('/knowledge-packs', async (req: Request, res: Response) => {
  const list = await db.listKnowledgePacks()
  res.json(list)
})

app.post('/agents', async (req: Request, res: Response) => {
  try {
    const schema = z.object({ name: z.string(), knowledgePackId: z.string(), ownerAccountId: z.string().optional(), specialization: z.string().optional() })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const ag = await db.createAgent(parsed.data.name, parsed.data.knowledgePackId, parsed.data.ownerAccountId, parsed.data.specialization)
    res.json(ag)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Server error' })
  }
})

app.get('/agents', async (req: Request, res: Response) => {
  const list = await db.listAgents()
  res.json(list)
})

app.post('/matches', async (req: Request, res: Response) => {
  const schema = z.object({ topic: z.string(), agentAId: z.string(), agentBId: z.string() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { topic, agentAId, agentBId } = parsed.data
  const agentA = await db.getAgent(agentAId)
  const agentB = await db.getAgent(agentBId)
  if (!agentA || !agentB) return res.status(404).json({ error: 'Agent not found' })
  const kpA = await db.getKnowledgePack(agentA.knowledgePackId)
  const kpB = await db.getKnowledgePack(agentB.knowledgePackId)
  if (!kpA || !kpB) return res.status(404).json({ error: 'Knowledge pack not found' })

  const rounds: RoundName[] = ['opening', 'rebuttal', 'crossfire', 'closing']
  const entries: RoundEntry[] = []

  for (const r of rounds) {
    const sysA = `You are ${agentA.name} debating on ${topic}`
    const sysB = `You are ${agentB.name} debating on ${topic}`
    const prevA = entries.filter(e => e.agentId === agentA.id).map(e => `${e.round}: ${e.text}`).join('\n')
    const prevB = entries.filter(e => e.agentId === agentB.id).map(e => `${e.round}: ${e.text}`).join('\n')
    const promptA = `${r} based on knowledge: ${kpA.content}\nOpponent said: ${prevB}`
    const promptB = `${r} based on knowledge: ${kpB.content}\nOpponent said: ${prevA}`
    const aText = await generateText(sysA, promptA)
    const bText = await generateText(sysB, promptB)
    entries.push({ round: r, agentId: agentA.id, text: aText })
    entries.push({ round: r, agentId: agentB.id, text: bText })
  }

  const j1 = await judgeDebate(topic, entries.filter(e => e.agentId === agentA.id).map(e => e.text).join('\n'), entries.filter(e => e.agentId === agentB.id).map(e => e.text).join('\n'))
  const j2 = await judgeDebate(topic, entries.filter(e => e.agentId === agentA.id).map(e => e.text).join('\n'), entries.filter(e => e.agentId === agentB.id).map(e => e.text).join('\n'))
  const j3 = await judgeDebate(topic, entries.filter(e => e.agentId === agentA.id).map(e => e.text).join('\n'), entries.filter(e => e.agentId === agentB.id).map(e => e.text).join('\n'))

  const judgeScores = [
    { judgeId: 'judge-1', agentAScore: j1.agentAScore, agentBScore: j1.agentBScore },
    { judgeId: 'judge-2', agentAScore: j2.agentAScore, agentBScore: j2.agentBScore },
    { judgeId: 'judge-3', agentAScore: j3.agentAScore, agentBScore: j3.agentBScore }
  ]

  const agg = await aggregateJudgeScores(judgeScores)
  const winnerAgentId = agg.a === agg.b ? undefined : agg.a > agg.b ? agentA.id : agentB.id

  const match = await db.createMatch({ topic, agentAId, agentBId, rounds: entries, judgeScores, winnerAgentId })

  const elo = calculateElo(agentA.rating, agentB.rating, agg.a, agg.b)
  await db.updateAgentRating(agentA.id, elo.ra)
  await db.updateAgentRating(agentB.id, elo.rb)

  res.json(match)
})

app.get('/matches/:id', async (req: Request, res: Response) => {
  const m = await db.getMatch(req.params.id)
  if (!m) return res.status(404).json({ error: 'Not found' })
  res.json(m)
})

app.get('/matches', async (req: Request, res: Response) => {
  const list = await db.listMatches()
  res.json(list)
})

const port = Number(process.env.PORT || 4000)
app.listen(port, () => {})
app.post('/arenas', async (req: Request, res: Response) => {
  try {
    const schema = z.object({ topic: z.string(), creatorAccountId: z.string() })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const arena = await db.createArena({ code, topic: parsed.data.topic, creatorAccountId: parsed.data.creatorAccountId })
    res.json(arena)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Server error' })
  }
})

app.get('/arenas/:code', async (req: Request, res: Response) => {
  try {
    const a = await db.getArenaByCode(req.params.code)
    if (!a) return res.status(404).json({ error: 'Not found' })
    res.json(a)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Server error' })
  }
})

app.post('/arenas/join', async (req: Request, res: Response) => {
  try {
    const schema = z.object({ code: z.string(), joinerAccountId: z.string() })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const a = await db.getArenaByCode(parsed.data.code)
    if (!a) return res.status(404).json({ error: 'Not found' })
    if (a.joiner_account_id) return res.status(400).json({ error: 'Already joined' })
    const u = await db.updateArena(parsed.data.code, { joiner_account_id: parsed.data.joinerAccountId, status: 'ready' })
    res.json(u)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Server error' })
  }
})

app.post('/arenas/select', async (req: Request, res: Response) => {
  try {
    const schema = z.object({ code: z.string(), side: z.enum(['a','b']), agentId: z.string() })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const field = parsed.data.side === 'a' ? 'agent_a_id' : 'agent_b_id'
    const u = await db.updateArena(parsed.data.code, { [field]: parsed.data.agentId })
    res.json(u)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Server error' })
  }
})

app.post('/arenas/ready', async (req: Request, res: Response) => {
  try {
    const schema = z.object({ code: z.string(), side: z.enum(['creator','joiner']), ready: z.boolean() })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const field = parsed.data.side === 'creator' ? 'creator_ready' : 'joiner_ready'
    const u = await db.updateArena(parsed.data.code, { [field]: parsed.data.ready })
    res.json(u)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Server error' })
  }
})

app.post('/arenas/start', async (req: Request, res: Response) => {
  try {
    const schema = z.object({ code: z.string() })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
    const a = await db.getArenaByCode(parsed.data.code)
    if (!a) return res.status(404).json({ error: 'Not found' })
    if (!a.agent_a_id || !a.agent_b_id) return res.status(400).json({ error: 'Agents not selected' })
    if (!a.creator_ready || !a.joiner_ready) return res.status(400).json({ error: 'Both players must be ready' })
    const kpA = await db.getAgent(a.agent_a_id)
    const kpB = await db.getAgent(a.agent_b_id)
    if (!kpA || !kpB) return res.status(404).json({ error: 'Agent not found' })
    const rounds: RoundName[] = ['opening', 'rebuttal', 'crossfire', 'closing']
    const entries: RoundEntry[] = []
    for (const r of rounds) {
      const sysA = `You are ${kpA.name} debating on ${a.topic}`
      const sysB = `You are ${kpB.name} debating on ${a.topic}`
      const prevA = entries.filter(e => e.agentId === kpA.id).map(e => `${e.round}: ${e.text}`).join('\n')
      const prevB = entries.filter(e => e.agentId === kpB.id).map(e => `${e.round}: ${e.text}`).join('\n')
      const promptA = `${r} based on knowledge: ${(await db.getKnowledgePack(kpA.knowledgePackId))?.content}\nOpponent said: ${prevB}`
      const promptB = `${r} based on knowledge: ${(await db.getKnowledgePack(kpB.knowledgePackId))?.content}\nOpponent said: ${prevA}`
      const aText = await generateText(sysA, promptA)
      const bText = await generateText(sysB, promptB)
      entries.push({ round: r, agentId: kpA.id, text: aText })
      entries.push({ round: r, agentId: kpB.id, text: bText })
    }
    const aAll = entries.filter(e => e.agentId === kpA.id).map(e => e.text).join('\n')
    const bAll = entries.filter(e => e.agentId === kpB.id).map(e => e.text).join('\n')
    const j1 = await judgeDebate(a.topic, aAll, bAll)
    const j2 = await judgeDebate(a.topic, aAll, bAll)
    const j3 = await judgeDebate(a.topic, aAll, bAll)
    const judgeScores = [
      { judgeId: 'judge-1', agentAScore: j1.agentAScore, agentBScore: j1.agentBScore },
      { judgeId: 'judge-2', agentAScore: j2.agentAScore, agentBScore: j2.agentBScore },
      { judgeId: 'judge-3', agentAScore: j3.agentAScore, agentBScore: j3.agentBScore }
    ]
    const agg = await aggregateJudgeScores(judgeScores)
    const winnerAgentId = agg.a === agg.b ? undefined : (agg.a > agg.b ? kpA.id : kpB.id)
    const match = await db.createMatch({ topic: a.topic, agentAId: kpA.id, agentBId: kpB.id, rounds: entries, judgeScores, winnerAgentId })
    await db.updateArena(parsed.data.code, { match_id: match.id, status: 'completed' })
    const elo = calculateElo(kpA.rating, kpB.rating, agg.a, agg.b)
    await db.updateAgentRating(kpA.id, elo.ra)
    await db.updateAgentRating(kpB.id, elo.rb)
    res.json({ arena: await db.getArenaByCode(parsed.data.code), match })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Server error' })
  }
})
