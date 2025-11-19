import { useEffect, useMemo, useRef, useState } from 'react'
import { listKnowledgePacks, listMarketplaceListings, getMarketplaceRentalStatus, chatKnowledgePack, chatMarketplace } from '../lib/api'

export default function Playground() {
  const [accountId, setAccountId] = useState('')
  const [owned, setOwned] = useState<any[]>([])
  const [rented, setRented] = useState<any[]>([])
  const [loadingOwned, setLoadingOwned] = useState(true)
  const [loadingRented, setLoadingRented] = useState(true)
  const [sel, setSel] = useState<{ kind: 'owned'|'rented', id: string, title: string } | null>(null)
  const [messages, setMessages] = useState<{ role: 'user'|'assistant', content: string }[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const feedRef = useRef<HTMLDivElement|null>(null)

  useEffect(() => {
    const acc = typeof window !== 'undefined' ? (sessionStorage.getItem('accountId') || '') : ''
    setAccountId(acc)
  }, [])

  useEffect(() => {
    if (!accountId) return
    setLoadingOwned(true)
    listKnowledgePacks(accountId).then(setOwned).catch(()=>{}).finally(()=> setLoadingOwned(false))
  }, [accountId])

  useEffect(() => {
    if (!accountId) return
    setLoadingRented(true)
    listMarketplaceListings().then(async (list) => {
      const checks = await Promise.all(list.map((l: any) => {
        if (String(l.owner_account_id) === accountId) return Promise.resolve(null)
        return getMarketplaceRentalStatus(l.id, accountId).catch(()=> null)
      }))
      const active: any[] = []
      list.forEach((l: any, idx: number) => {
        const c = checks[idx]
        if (c && c.active) active.push(l)
      })
      setRented(active)
    }).catch(()=>{}).finally(()=> setLoadingRented(false))
  }, [accountId])

  useEffect(() => {
    const el = feedRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const header = useMemo(() => {
    if (!sel) return 'Playground'
    return sel.kind === 'owned' ? `Chat with ${sel.title}` : `Chat with ${sel.title} (rented)`
  }, [sel])

  async function send() {
    if (!sel || !input) return
    setSending(true)
    const msgs: { role: 'user'|'assistant', content: string }[] = [...messages, { role: 'user', content: input }]
    setMessages(msgs)
    setInput('')
    try {
      let out: any
      if (sel.kind === 'owned') {
        out = await chatKnowledgePack(sel.id, accountId, msgs)
      } else {
        out = await chatMarketplace(sel.id, accountId, msgs)
      }
      const reply = String(out?.reply || '')
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch {}
    setSending(false)
  }

  return (
    <div className="page py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{header}</h2>
        {!sel && <div className="text-sm text-brand-brown/60">Select a knowledge pack to start chatting</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-3 flex flex-col gap-2">
          <div className="text-base font-semibold">My Knowledge</div>
          {loadingOwned ? (
            <div className="text-sm text-brand-brown/60">Loading…</div>
          ) : owned.length === 0 ? (
            <div className="text-sm text-brand-brown/60">No knowledge packs yet</div>
          ) : (
            <div className="space-y-1 max-h-[14rem] overflow-y-auto">
              {owned.map((k: any) => (
                <div key={k.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="truncate" title={k.title}>{k.title || 'Untitled Knowledge'}</div>
                  <button className="btn-primary btn-compact" onClick={()=>{ setSel({ kind: 'owned', id: k.id, title: k.title || 'Untitled Knowledge' }); setMessages([]) }}>Chat</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card p-3 flex flex-col gap-2">
          <div className="text-base font-semibold">Rented Knowledge</div>
          {loadingRented ? (
            <div className="text-sm text-brand-brown/60">Loading…</div>
          ) : rented.length === 0 ? (
            <div className="text-sm text-brand-brown/60">No active rentals</div>
          ) : (
            <div className="space-y-1 max-h-[14rem] overflow-y-auto">
              {rented.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="truncate" title={l.title || l.knowledge_pack_id}>{l.title || 'Untitled Knowledge'}</div>
                  <button className="btn-primary btn-compact" onClick={()=>{ setSel({ kind: 'rented', id: l.id, title: l.title || 'Untitled Knowledge' }); setMessages([]) }}>Chat</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-4 flex flex-col gap-3 h-[60vh]">
        <div className="text-sm text-brand-brown/60">Answers are restricted to the selected knowledge.</div>
        <div ref={feedRef} className="space-y-3 flex-1 overflow-y-auto">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role==='user' ? 'text-right' : ''}>
              <div className={`inline-block px-3 py-2 rounded-xl ${m.role==='user'?'bg-brand-yellow':'bg-brand-cream'}`}>{m.content}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-sm text-brand-brown/60">{sel ? 'Type a message to begin' : 'Pick a knowledge on the left to begin'}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <textarea
            className="textarea"
            placeholder={sel ? 'Type your message' : 'Select a knowledge first'}
            rows={2}
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={!sel}
          />
          <button className={`btn-primary ${sending || !sel ? 'bg-gray-200 text-gray-500 cursor-not-allowed':''}`} onClick={send} disabled={sending || !sel}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
