import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { listAgents, getArena, joinArena, selectArenaAgent, setArenaReady, startArena } from '../../lib/api'

export default function ArenaRoom() {
  const router = useRouter()
  const { code } = router.query as { code?: string }
  const [agents, setAgents] = useState<any[]>([])
  const [arena, setArena] = useState<any | null>(null)
  const [myAgent, setMyAgent] = useState('')
  const [status, setStatus] = useState('')
  const pollingRef = useRef<any>(null)

  useEffect(() => {
    const acc = typeof window !== 'undefined' ? localStorage.getItem('accountId') : null
    if (!acc) { window.location.href = '/'; return }
  }, [])

  useEffect(() => {
    if (!code) return
    listAgents().then(setAgents)
    ;(async () => {
      try {
        const a = await getArena(code)
        setArena(a)
      } catch {}
    })()
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      try { const a = await getArena(code); setArena(a) } catch {}
    }, 2000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [code])

  const accId = typeof window !== 'undefined' ? (localStorage.getItem('accountId') || '') : ''
  const isCreator = arena?.creator_account_id === accId
  const isJoiner = arena?.joiner_account_id === accId

  async function handleJoin() {
    if (!code || !accId) return
    try {
      await joinArena(code, accId)
      const a = await getArena(code)
      setArena(a)
    } catch (e: any) {
      setStatus(e?.message || 'Join failed')
    }
  }

  async function handleSelectAgent(side: 'a' | 'b') {
    if (!code || !myAgent) return
    await selectArenaAgent(code, side, myAgent)
    const a = await getArena(code)
    setArena(a)
  }

  async function handleReady(side: 'creator' | 'joiner') {
    if (!code) return
    await setArenaReady(code, side, true)
    const a = await getArena(code)
    setArena(a)
  }

  async function handleStart() {
    if (!code) return
    const res = await startArena(code)
    setArena(res.arena)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Arena Room</h2>
      {status && <div className="text-sm text-red-600">{status}</div>}
      {!arena ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-3">
          <div className="border p-2">Code: <span className="font-mono">{code}</span></div>
          <div className="border p-2">Topic: {arena.topic}</div>
          <div className="border p-2">Participants: Creator {arena.creator_account_id || '-'} | Joiner {arena.joiner_account_id || '-'}</div>
          {!arena.joiner_account_id && !isCreator && (
            <button className="px-3 py-1 border" onClick={handleJoin}>Join Room</button>
          )}
          <div className="space-y-2 border p-2">
            <div>Agents: A {arena.agent_a_id ? agents.find(x => x.id === arena.agent_a_id)?.name : '-'} | B {arena.agent_b_id ? agents.find(x => x.id === arena.agent_b_id)?.name : '-'}</div>
            {(isCreator || isJoiner) && (
              <div className="flex gap-2 items-center">
                <select className="border p-2" value={myAgent} onChange={e => setMyAgent(e.target.value)}>
                  <option value="">Select Your Agent</option>
                  {agents.filter(x => x.ownerAccountId === accId).map(x => <option key={x.id} value={x.id}>{x.name} ({x.rating})</option>)}
                </select>
                {isCreator && <button className="px-3 py-1 border" onClick={()=>handleSelectAgent('a')}>Set as A</button>}
                {isJoiner && <button className="px-3 py-1 border" onClick={()=>handleSelectAgent('b')}>Set as B</button>}
              </div>
            )}
          </div>
          <div className="space-y-2 border p-2">
            <div>Ready: Creator {arena.creator_ready ? '✅' : '❌'} | Joiner {arena.joiner_ready ? '✅' : '❌'}</div>
            <div className="flex gap-2">
              {isCreator && <button className="px-3 py-1 border" onClick={()=>handleReady('creator')}>Ready</button>}
              {isJoiner && <button className="px-3 py-1 border" onClick={()=>handleReady('joiner')}>Ready</button>}
              <button className="px-3 py-1 border" disabled={!(arena.agent_a_id && arena.agent_b_id && arena.creator_ready && arena.joiner_ready && !arena.match_id && isCreator)} onClick={handleStart}>Start Debate</button>
            </div>
          </div>
          {arena.match_id && (
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Result</h3>
              <div className="border p-2">
                <div>Winner: {arena.match?.winnerAgentId || 'Draw'}</div>
                <div className="text-sm">Scores: {arena.match?.judgeScores?.map((j:any)=>`${j.judgeId}: ${j.agentAScore}-${j.agentBScore}`).join(', ')}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
