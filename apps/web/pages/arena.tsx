import { useEffect, useRef, useState } from 'react'
import { listAgents, listMatches, createArena, getArena, joinArena, selectArenaAgent, startArena, setArenaReady } from '../lib/api'

export default function Arena() {
  const [agents, setAgents] = useState<any[]>([])
  const [topic, setTopic] = useState('')
  const [myAgent, setMyAgent] = useState('')
  const [mode, setMode] = useState<'create'|'join'>('create')
  const [code, setCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [arena, setArena] = useState<any | null>(null)
  const [match, setMatch] = useState<any | null>(null)
  const [recent, setRecent] = useState<any[]>([])
  const pollingRef = useRef<any>(null)

  useEffect(() => {
    const acc = typeof window !== 'undefined' ? localStorage.getItem('accountId') : null
    if (!acc) {
      window.location.href = '/'
      return
    }
    listAgents().then(setAgents)
    listMatches().then(setRecent)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Arena</h2>
      <div className="space-y-3">
        <div className="flex gap-2">
          <button className={`px-3 py-1 border ${mode==='create'?'bg-gray-200':''}`} onClick={()=>setMode('create')}>Create</button>
          <button className={`px-3 py-1 border ${mode==='join'?'bg-gray-200':''}`} onClick={()=>setMode('join')}>Join</button>
        </div>
        {mode === 'create' ? (
          <div className="space-y-2">
            <input className="w-full border p-2" placeholder="Topic" value={topic} onChange={e => setTopic(e.target.value)} />
            <select className="w-full border p-2" value={myAgent} onChange={e => setMyAgent(e.target.value)}>
              <option value="">Select Your Agent (A)</option>
              {agents.map(x => <option key={x.id} value={x.id}>{x.name} ({x.rating})</option>)}
            </select>
            <button className="px-4 py-2 bg-purple-600 text-white" onClick={async () => {
              const acc = localStorage.getItem('accountId') || ''
              if (!acc || !topic || !myAgent) return
              try {
                const a = await createArena(topic, acc)
                setArena(a)
                setCode(a.code)
                await selectArenaAgent(a.code, 'a', myAgent)
                if (typeof window !== 'undefined') window.location.href = `/arena/${a.code}`
                pollingRef.current = setInterval(async () => {
                  const curr = await getArena(a.code)
                  setArena(curr)
                  if (curr.match_id) {
                    clearInterval(pollingRef.current)
                  }
                }, 2000)
              } catch (e: any) {
                alert(e?.message || 'Failed to create arena')
              }
            }}>Create Arena</button>
            {code && <div className="border p-2">Arena Code: <span className="font-mono">{code}</span></div>}
            {arena && (
              <div className="space-y-2 border p-2">
                <div>Status: {arena.status}</div>
                <div>Ready: Creator {arena.creator_ready ? '✅' : '❌'} | Joiner {arena.joiner_ready ? '✅' : '❌'}</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border" onClick={async ()=>{ if (!arena) return; await setArenaReady(arena.code, 'creator', true); const curr = await getArena(arena.code); setArena(curr) }}>Ready</button>
                  <button className="px-3 py-1 border" disabled={!(arena.agent_a_id && arena.agent_b_id && arena.creator_ready && arena.joiner_ready && !arena.match_id)} onClick={async ()=>{ const res = await startArena(arena.code); setMatch(res.match); const curr = await getArena(arena.code); setArena(curr) }}>Start Debate</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input className="w-full border p-2" placeholder="Arena Code" value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())} />
            <select className="w-full border p-2" value={myAgent} onChange={e => setMyAgent(e.target.value)}>
              <option value="">Select Your Agent (B)</option>
              {agents.map(x => <option key={x.id} value={x.id}>{x.name} ({x.rating})</option>)}
            </select>
            <button className="px-4 py-2 bg-green-600 text-white" onClick={async () => {
              const acc = localStorage.getItem('accountId') || ''
              const code = inputCode.trim().toUpperCase()
              if (!acc || !code || !myAgent) return
              try {
                await joinArena(code, acc)
                await selectArenaAgent(code, 'b', myAgent)
                if (typeof window !== 'undefined') window.location.href = `/arena/${code}`
                pollingRef.current = setInterval(async () => {
                  const curr = await getArena(code)
                  setArena(curr)
                  if (curr.match_id) {
                    clearInterval(pollingRef.current)
                  }
                }, 2000)
              } catch (e: any) {
                alert(e?.message || 'Failed to join arena')
              }
            }}>Join Arena</button>
            {arena && (
              <div className="space-y-2 border p-2">
                <div>Status: {arena.status}</div>
                <div>Ready: Creator {arena.creator_ready ? '✅' : '❌'} | Joiner {arena.joiner_ready ? '✅' : '❌'}</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border" onClick={async ()=>{ if (!arena) return; await setArenaReady(arena.code, 'joiner', true); const curr = await getArena(arena.code); setArena(curr) }}>Ready</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {match && (
        <div className="space-y-3">
          <div className="border p-3">Winner: {(
            match.winnerAgentId ? agents.find(x => x.id === match.winnerAgentId)?.name : 'Tie'
          )}</div>
          <div className="border p-3">
            <div className="font-semibold">Judge Scores</div>
            <div className="grid grid-cols-3 gap-2">
              {match.judgeScores.map((j: any) => (
                <div key={j.judgeId} className="border p-2">{j.judgeId}: A {j.agentAScore.toFixed(2)} / B {j.agentBScore.toFixed(2)}</div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {match.rounds.map((r: any, idx: number) => (
              <div key={idx} className="border p-2">
                <div className="font-semibold">{r.round} - {agents.find(x => x.id === r.agentId)?.name || r.agentId}</div>
                <div className="whitespace-pre-wrap">{r.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Recent Matches</h3>
        <div className="grid grid-cols-1 gap-2">
          {recent.map((m: any) => (
            <div key={m.id} className="border p-2">
              <div>{m.topic}</div>
              <div className="text-sm">A: {agents.find(x => x.id === m.agentAId)?.name} vs B: {agents.find(x => x.id === m.agentBId)?.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
