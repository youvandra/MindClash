const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function listKnowledgePacks() {
  const r = await fetch(`${API_URL}/knowledge-packs`)
  return r.json()
}

export async function createKnowledgePack(title: string, content: string) {
  const r = await fetch(`${API_URL}/knowledge-packs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  })
  return r.json()
}

export async function listAgents() {
  const r = await fetch(`${API_URL}/agents`)
  return r.json()
}

export async function createAgent(name: string, knowledgePackId: string, ownerAccountId?: string, specialization?: string) {
  const r = await fetch(`${API_URL}/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, knowledgePackId, ownerAccountId, specialization })
  })
  return r.json()
}

export async function createMatch(topic: string, agentAId: string, agentBId: string) {
  const r = await fetch(`${API_URL}/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, agentAId, agentBId })
  })
  return r.json()
}

export async function listMatches() {
  const r = await fetch(`${API_URL}/matches`)
  return r.json()
}

export async function createArena(topic: string, creatorAccountId: string) {
  const r = await fetch(`${API_URL}/arenas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, creatorAccountId })
  })
  return r.json()
}

export async function getArena(code: string) {
  const r = await fetch(`${API_URL}/arenas/${code}`)
  return r.json()
}

export async function joinArena(code: string, joinerAccountId: string) {
  const r = await fetch(`${API_URL}/arenas/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, joinerAccountId })
  })
  return r.json()
}

export async function selectArenaAgent(code: string, side: 'a' | 'b', agentId: string) {
  const r = await fetch(`${API_URL}/arenas/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, side, agentId })
  })
  return r.json()
}

export async function setArenaReady(code: string, side: 'creator' | 'joiner', ready: boolean) {
  const r = await fetch(`${API_URL}/arenas/ready`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, side, ready })
  })
  return r.json()
}

export async function startArena(code: string) {
  const r = await fetch(`${API_URL}/arenas/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  })
  return r.json()
}
