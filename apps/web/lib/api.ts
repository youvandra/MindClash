const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function listKnowledgePacks(accountId?: string) {
  const url = accountId ? `${API_URL}/knowledge-packs?accountId=${encodeURIComponent(accountId)}` : `${API_URL}/knowledge-packs`
  const r = await fetch(url)
  return r.json()
}

export async function listMarketplaceListings() {
  const r = await fetch(`${API_URL}/marketplace/listings`)
  return r.json()
}

export async function createMarketplaceListing(knowledgePackId: string, ownerAccountId: string, price: number, pricePerUse: number) {
  const r = await fetch(`${API_URL}/marketplace/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ knowledgePackId, ownerAccountId, price, pricePerUse })
  })
  const data = await r.json()
  if (!r.ok || data.error) throw new Error(data.error || 'Create listing failed')
  return data
}

export async function unlistMarketplaceListing(knowledgePackId: string, ownerAccountId: string) {
  const r = await fetch(`${API_URL}/marketplace/unlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ knowledgePackId, ownerAccountId })
  })
  return r.json()
}

export async function chatMarketplace(listingId: string, accountId: string, messages: { role: 'user'|'assistant', content: string }[]) {
  const r = await fetch(`${API_URL}/marketplace/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId, accountId, messages })
  })
  return r.json()
}

export async function getMarketplaceListing(id: string) {
  const r = await fetch(`${API_URL}/marketplace/listings/${encodeURIComponent(id)}`)
  return r.json()
}

export async function getMarketplaceListingByPackId(packId: string) {
  const r = await fetch(`${API_URL}/marketplace/listings/by-pack/${encodeURIComponent(packId)}`)
  return r.json()
}

export async function getMarketplaceRentalStatus(listingId: string, accountId: string) {
  const url = `${API_URL}/marketplace/rental-status?listingId=${encodeURIComponent(listingId)}&accountId=${encodeURIComponent(accountId)}`
  const r = await fetch(url)
  return r.json()
}

export async function rentMarketplace(listingId: string, renterAccountId: string, minutes: number) {
  const r = await fetch(`${API_URL}/marketplace/rent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId, renterAccountId, minutes })
  })
  return r.json()
}

export async function updateMarketplaceListing(knowledgePackId: string, ownerAccountId: string, price: number, pricePerUse: number) {
  const r = await fetch(`${API_URL}/marketplace/listings/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ knowledgePackId, ownerAccountId, price, pricePerUse })
  })
  return r.json()
}

export async function chatKnowledgePack(knowledgePackId: string, accountId: string, messages: { role: 'user'|'assistant', content: string }[]) {
  const r = await fetch(`${API_URL}/knowledge-packs/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ knowledgePackId, accountId, messages })
  })
  return r.json()
}

export async function chatPlayground(accountId: string, ownedIds: string[], listingIds: string[], messages: { role: 'user'|'assistant', content: string }[], xPaymentHeaderBase64?: string) {
  console.log('chatPlayground request', { accountId, ownedIds, listingIds, messagesCount: messages.length })
  const r = await fetch(`${API_URL}/playground/chat`, {
    method: 'POST',
    headers: xPaymentHeaderBase64 ? { 'Content-Type': 'application/json', 'X-PAYMENT': xPaymentHeaderBase64 } : { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, knowledgePackIds: ownedIds, listingIds, messages })
  })
  const text = await r.text()
  if (!r.ok) {
    console.warn('chatPlayground non-ok', { status: r.status, body: text })
    try {
      const data = JSON.parse(text || '{}')
      throw new Error(JSON.stringify(data))
    } catch {
      if (r.status === 402) {
        console.warn('chatPlayground 402', { status: 402, body: text })
        try { throw new Error(text) } catch { throw new Error(JSON.stringify({ code: 'X402', error: 'Payment required', status: 402 })) }
      }
      throw new Error(`HTTP ${r.status}`)
    }
  }
  console.log('chatPlayground ok', { status: r.status })
  try { return JSON.parse(text || '{}') } catch { return {} }
}

export async function prepareX402Transfer(accountId: string, listingIds: string[]) {
  const r = await fetch(`${API_URL}/x402/prepare-transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, listingIds })
  })
  return r.json()
}

export async function checkX402Allowance(accountId: string, listingIds: string[]) {
  const r = await fetch(`${API_URL}/x402/check-allowance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, listingIds })
  })
  return r.json()
}

export async function submitX402Transfer(signedBytesBase64: string, accountId: string, listingIds: string[]) {
  const r = await fetch(`${API_URL}/x402/submit-transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedBytes: signedBytesBase64, accountId, listingIds })
  })
  return r.json()
}

export async function createKnowledgePack(title: string, content: string, ownerAccountId?: string) {
  const r = await fetch(`${API_URL}/knowledge-packs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, ownerAccountId })
  })
  return r.json()
}

export async function updateKnowledgePack(id: string, values: { title?: string; content?: string }) {
  const r = await fetch(`${API_URL}/knowledge-packs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values)
  })
  return r.json()
}

export async function deleteKnowledgePack(id: string) {
  const r = await fetch(`${API_URL}/knowledge-packs/${id}`, { method: 'DELETE' })
  const data = await r.json().catch(() => ({}))
  if (!r.ok || (data && (data.error || data.ok === false))) {
    throw new Error((data && data.error) || 'Delete failed')
  }
  return data
}

export async function listAgents(ownerAccountId?: string) {
  const url = ownerAccountId ? `${API_URL}/agents?ownerAccountId=${encodeURIComponent(ownerAccountId)}` : `${API_URL}/agents`
  const r = await fetch(url)
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

export async function updateAgent(id: string, values: { name?: string; specialization?: string }) {
  const r = await fetch(`${API_URL}/agents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values)
  })
  return r.json()
}

export async function deleteAgent(id: string) {
  const r = await fetch(`${API_URL}/agents/${id}`, { method: 'DELETE' })
  const data = await r.json().catch(() => ({}))
  if (!r.ok || (data && (data.error || data.ok === false))) {
    throw new Error((data && data.error) || 'Delete failed')
  }
  return data
}

export async function listAgentKnowledgePacks(agentId: string) {
  const r = await fetch(`${API_URL}/agents/${agentId}/knowledge-packs`)
  return r.json()
}

export async function addAgentKnowledge(agentId: string, knowledgePackId: string) {
  const r = await fetch(`${API_URL}/agents/${agentId}/knowledge-packs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ knowledgePackId })
  })
  return r.json()
}

export async function removeAgentKnowledge(agentId: string, knowledgePackId: string) {
  const r = await fetch(`${API_URL}/agents/${agentId}/knowledge-packs/${knowledgePackId}`, { method: 'DELETE' })
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

export async function getMatch(id: string) {
  const r = await fetch(`${API_URL}/matches/${id}`)
  return r.json()
}

export async function createArena(topic: string, creatorAccountId: string, gameType?: 'import'|'challenge', challengeMinutes?: number) {
  const r = await fetch(`${API_URL}/arenas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, creatorAccountId, gameType, challengeMinutes })
  })
  return r.json()
}

export async function getArenaById(id: string) {
  const r = await fetch(`${API_URL}/arenas/${id}`)
  return r.json()
}

export async function getArenaByCode(code: string) {
  const r = await fetch(`${API_URL}/arenas/code/${encodeURIComponent(code.toUpperCase())}`)
  return r.json()
}

export async function joinArena(id: string, joinerAccountId: string) {
  const r = await fetch(`${API_URL}/arenas/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, joinerAccountId })
  })
  return r.json()
}

export async function joinArenaByCode(code: string, joinerAccountId: string) {
  const r = await fetch(`${API_URL}/arenas/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, joinerAccountId })
  })
  return r.json()
}

export async function selectArenaAgent(id: string, side: 'pros' | 'cons', agentId: string) {
  const r = await fetch(`${API_URL}/arenas/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, side, agentId })
  })
  return r.json()
}

export async function setArenaReady(id: string, side: 'creator' | 'joiner', ready: boolean) {
  const r = await fetch(`${API_URL}/arenas/ready`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, side, ready })
  })
  return r.json()
}

export async function startArena(id: string) {
  const r = await fetch(`${API_URL}/arenas/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
  return r.json()
}

export async function listArenas(accountId?: string) {
  const url = accountId ? `${API_URL}/arenas?accountId=${encodeURIComponent(accountId)}` : `${API_URL}/arenas`
  const r = await fetch(url)
  return r.json()
}

export async function listWatchArenas(accountId: string) {
  const url = `${API_URL}/arenas/watchers?accountId=${encodeURIComponent(accountId)}`
  const r = await fetch(url)
  return r.json()
}

export async function submitArenaKnowledge(id: string, side: 'pros'|'cons', accountId: string, agentName: string, content: string) {
  const r = await fetch(`${API_URL}/arenas/submit-knowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, side, accountId, agentName, content })
  })
  return r.json()
}

export async function challengeControl(id: string, accountId: string, action: 'start'|'pause'|'resume'|'finish') {
  const r = await fetch(`${API_URL}/arenas/challenge-control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, accountId, action })
  })
  return r.json()
}

export async function watchArena(id: string, accountId: string) {
  const r = await fetch(`${API_URL}/arenas/watch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, accountId })
  })
  return r.json()
}

export async function saveArenaDraft(id: string, accountId: string, agentName?: string, content?: string) {
  const r = await fetch(`${API_URL}/arenas/save-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, accountId, agentName, content })
  })
  const text = await r.text()
  try {
    return JSON.parse(text || '{}')
  } catch {
    return { ok: r.ok, status: r.status }
  }
}

export async function mintCokToken(accountId: string, tinyAmount?: number) {
  const r = await fetch(`${API_URL}/tokens/mint-cok`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, tinyAmount })
  })
  const text = await r.text()
  try {
    return JSON.parse(text || '{}')
  } catch {
    return { ok: r.ok, status: r.status }
  }
}

export async function createCustodialAccount(userId: string, email?: string, provider?: string) {
  const r = await fetch(`${API_URL}/custodial/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email, provider })
  })
  const text = await r.text()
  try {
    return JSON.parse(text || '{}')
  } catch {
    return { ok: r.ok, status: r.status }
  }
}

export async function associateCustodialAccount(userId: string) {
  const r = await fetch(`${API_URL}/custodial/associate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
  const text = await r.text()
  try {
    return JSON.parse(text || '{}')
  } catch {
    return { ok: r.ok, status: r.status }
  }
}

export async function ensureCustodialAccount(userId: string, email?: string, provider?: string) {
  const r = await fetch(`${API_URL}/custodial/ensure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, email, provider })
  })
  const text = await r.text()
  try {
    return JSON.parse(text || '{}')
  } catch {
    return { ok: r.ok, status: r.status }
  }
}

export async function cancelArena(id: string, reason?: string) {
  const r = await fetch(`${API_URL}/arenas/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, reason })
  })
  return r.json()
}

export async function deleteArena(id: string, accountId: string) {
  const r = await fetch(`${API_URL}/arenas/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId })
  })
  return r.json()
}

export async function listLeaderboardAccounts() {
  const r = await fetch(`${API_URL}/leaderboard`)
  return r.json()
}

export async function updateUserName(accountId: string, name: string) {
  const r = await fetch(`${API_URL}/users/name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, name })
  })
  return r.json()
}

export async function listActivities(accountId: string) {
  const url = `${API_URL}/activities?accountId=${encodeURIComponent(accountId)}`
  const r = await fetch(url)
  return r.json()
}
