import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '../../.env')
]
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p })
    break
  }
}
import { KnowledgePack, Agent, Match, UUID } from './types'
import { createClient } from '@supabase/supabase-js'

const useSupabase = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = useSupabase
  ? createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string)
  : null

const memory = {
  knowledge: new Map<UUID, KnowledgePack>(),
  agents: new Map<UUID, Agent>(),
  matches: new Map<UUID, Match>(),
  arenas: new Map<string, any>()
}

function id() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const db = {
  createKnowledgePack: async (title: string, content: string): Promise<KnowledgePack> => {
    if (supabase) {
      const { data, error } = await supabase.from('knowledge_packs').insert({ title, content }).select().single()
      if (error) throw error
      return { id: data.id, title: data.title, content: data.content, createdAt: new Date(data.created_at).getTime() }
    }
    const kp: KnowledgePack = { id: id(), title, content, createdAt: Date.now() }
    memory.knowledge.set(kp.id, kp)
    return kp
  },
  getKnowledgePack: async (kpId: UUID): Promise<KnowledgePack | undefined> => {
    if (supabase) {
      const { data, error } = await supabase.from('knowledge_packs').select('*').eq('id', kpId).single()
      if (error) return undefined
      return { id: data.id, title: data.title, content: data.content, createdAt: new Date(data.created_at).getTime() }
    }
    return memory.knowledge.get(kpId)
  },
  listKnowledgePacks: async (): Promise<KnowledgePack[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('knowledge_packs').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data.map((d: any) => ({ id: d.id, title: d.title, content: d.content, createdAt: new Date(d.created_at).getTime() }))
    }
    return [...memory.knowledge.values()]
  },
  createAgent: async (name: string, knowledgePackId: UUID, ownerAccountId?: string, specialization?: string): Promise<Agent> => {
    if (supabase) {
      const { data, error } = await supabase.from('agents').insert({ name, knowledge_pack_id: knowledgePackId, rating: 1000, owner_account_id: ownerAccountId || null, specialization: specialization || null }).select().single()
      if (!error) return { id: data.id, name: data.name, knowledgePackId: data.knowledge_pack_id, rating: data.rating, ownerAccountId: data.owner_account_id || undefined, specialization: data.specialization || undefined, createdAt: new Date(data.created_at).getTime() }
      const msg = (error as any)?.message || ''
      if (msg.includes('column') && (msg.includes('owner_account_id') || msg.includes('specialization')) && msg.includes('does not exist')) {
        const r = await supabase.from('agents').insert({ name, knowledge_pack_id: knowledgePackId, rating: 1000 }).select().single()
        if (r.error) throw r.error
        const d = r.data
        return { id: d.id, name: d.name, knowledgePackId: d.knowledge_pack_id, rating: d.rating, ownerAccountId: undefined, specialization: undefined, createdAt: new Date(d.created_at).getTime() }
      }
      throw error
    }
    const ag: Agent = { id: id(), name, knowledgePackId, rating: 1000, ownerAccountId, specialization, createdAt: Date.now() }
    memory.agents.set(ag.id, ag)
    return ag
  },
  getAgent: async (agentId: UUID): Promise<Agent | undefined> => {
    if (supabase) {
      const { data, error } = await supabase.from('agents').select('*').eq('id', agentId).single()
      if (error) return undefined
      return { id: data.id, name: data.name, knowledgePackId: data.knowledge_pack_id, rating: data.rating, ownerAccountId: data.owner_account_id || undefined, specialization: data.specialization || undefined, createdAt: new Date(data.created_at).getTime() }
    }
    return memory.agents.get(agentId)
  },
  listAgents: async (): Promise<Agent[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('agents').select('*').order('rating', { ascending: false })
      if (error) throw error
      return data.map((d: any) => ({ id: d.id, name: d.name, knowledgePackId: d.knowledge_pack_id, rating: d.rating, ownerAccountId: d.owner_account_id || undefined, specialization: d.specialization || undefined, createdAt: new Date(d.created_at).getTime() }))
    }
    return [...memory.agents.values()]
  },
  updateAgentRating: async (agentId: UUID, rating: number): Promise<void> => {
    if (supabase) {
      await supabase.from('agents').update({ rating }).eq('id', agentId)
      return
    }
    const ag = memory.agents.get(agentId)
    if (ag) {
      ag.rating = rating
      memory.agents.set(agentId, ag)
    }
  },
  createMatch: async (m: Omit<Match, 'id' | 'createdAt'>): Promise<Match> => {
    if (supabase) {
      const payload = {
        topic: m.topic,
        agent_a_id: m.agentAId,
        agent_b_id: m.agentBId,
        rounds: m.rounds,
        judge_scores: m.judgeScores,
        winner_agent_id: m.winnerAgentId || null
      }
      const { data, error } = await supabase.from('matches').insert(payload).select().single()
      if (error) throw error
      return {
        id: data.id,
        topic: data.topic,
        agentAId: data.agent_a_id,
        agentBId: data.agent_b_id,
        rounds: data.rounds,
        judgeScores: data.judge_scores,
        winnerAgentId: data.winner_agent_id || undefined,
        createdAt: new Date(data.created_at).getTime()
      }
    }
    const match: Match = { id: id(), createdAt: Date.now(), ...m }
    memory.matches.set(match.id, match)
    return match
  },
  getMatch: async (matchId: UUID): Promise<Match | undefined> => {
    if (supabase) {
      const { data, error } = await supabase.from('matches').select('*').eq('id', matchId).single()
      if (error) return undefined
      return {
        id: data.id,
        topic: data.topic,
        agentAId: data.agent_a_id,
        agentBId: data.agent_b_id,
        rounds: data.rounds,
        judgeScores: data.judge_scores,
        winnerAgentId: data.winner_agent_id || undefined,
        createdAt: new Date(data.created_at).getTime()
      }
    }
    return memory.matches.get(matchId)
  },
  listMatches: async (): Promise<Match[]> => {
    if (supabase) {
      const { data, error } = await supabase.from('matches').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data.map((d: any) => ({
        id: d.id,
        topic: d.topic,
        agentAId: d.agent_a_id,
        agentBId: d.agent_b_id,
        rounds: d.rounds,
        judgeScores: d.judge_scores,
        winnerAgentId: d.winner_agent_id || undefined,
        createdAt: new Date(d.created_at).getTime()
      }))
    }
    return [...memory.matches.values()].sort((a, b) => b.createdAt - a.createdAt)
  },
  updateMatch: async (matchId: UUID, updater: (m: Match) => Match): Promise<Match | undefined> => {
    if (supabase) {
      const existing = await db.getMatch(matchId)
      if (!existing) return undefined
      const updated = updater(existing)
      const payload = {
        topic: updated.topic,
        agent_a_id: updated.agentAId,
        agent_b_id: updated.agentBId,
        rounds: updated.rounds,
        judge_scores: updated.judgeScores,
        winner_agent_id: updated.winnerAgentId || null
      }
      await supabase.from('matches').update(payload).eq('id', matchId)
      return updated
    }
    const m = memory.matches.get(matchId)
    if (!m) return undefined
    const u = updater(m)
    memory.matches.set(matchId, u)
    return u
  }
  , createArena: async (arena: { code: string; topic: string; creatorAccountId: string }): Promise<any> => {
    if (supabase) {
      let attempts = 0
      while (attempts < 5) {
        const code = attempts === 0 ? arena.code : Math.random().toString(36).slice(2, 8).toUpperCase()
        const { data, error } = await supabase.from('arenas').insert({ code, topic: arena.topic, creator_account_id: arena.creatorAccountId }).select().single()
        if (!error) return data
        const msg = (error as any)?.message || ''
        if (msg.includes('relation') && msg.includes('does not exist')) {
          const a = { id: id(), code, topic: arena.topic, status: 'waiting', creator_account_id: arena.creatorAccountId, created_at: new Date().toISOString() }
          memory.arenas.set(a.code, a)
          return a
        }
        if (msg.includes('duplicate key') || msg.includes('unique')) {
          attempts++
          continue
        }
        throw error
      }
      throw new Error('Failed to generate unique arena code after retries')
    }
    const a = { id: id(), code: arena.code, topic: arena.topic, status: 'waiting', creator_account_id: arena.creatorAccountId, created_at: new Date().toISOString() }
    ;(memory as any).arenas = (memory as any).arenas || new Map<string, any>()
    ;(memory as any).arenas.set(a.code, a)
    return a
  }
  , getArenaByCode: async (code: string): Promise<any | undefined> => {
    if (supabase) {
      const { data, error } = await supabase.from('arenas').select('*').eq('code', code).single()
      if (!error) return data
      const msg = (error as any)?.message || ''
      if (msg.includes('relation') && msg.includes('does not exist')) {
        return memory.arenas.get(code)
      }
      return undefined
    }
    return memory.arenas.get(code)
  }
  , updateArena: async (code: string, values: any): Promise<any | undefined> => {
    if (supabase) {
      const { data, error } = await supabase.from('arenas').update(values).eq('code', code).select().single()
      if (!error) return data
      const msg = (error as any)?.message || ''
      if (msg.includes('relation') && msg.includes('does not exist')) {
        const a = memory.arenas.get(code)
        if (!a) return undefined
        const u = { ...a, ...values }
        memory.arenas.set(code, u)
        return u
      }
      return undefined
    }
    const a = memory.arenas.get(code)
    if (!a) return undefined
    const u = { ...a, ...values }
    memory.arenas.set(code, u)
    return u
  }
}

export const persistenceInfo = { useSupabase }
