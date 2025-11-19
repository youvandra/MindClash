import { useEffect, useRef, useState } from 'react'
import { chatMarketplace } from '../../lib/api'

export default function MarketplaceChat() {
  const [listingId, setListingId] = useState<string>('')
  const [messages, setMessages] = useState<{ role: 'user'|'assistant', content: string }[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    const parts = typeof window !== 'undefined' ? window.location.pathname.split('/') : []
    const id = parts[parts.length - 1]
    setListingId(id)
  }, [])

  async function send() {
    if (!input || !listingId) return
    setSending(true)
    const msgs: { role: 'user'|'assistant', content: string }[] = [...messages, { role: 'user', content: input }]
    setMessages(msgs)
    setInput('')
    try {
      const out = await chatMarketplace(listingId, msgs)
      const reply = String(out?.reply || '')
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch {}
    setSending(false)
  }

  return (
    <div className="page py-8 space-y-6">
      <h2 className="text-2xl font-bold">Chat</h2>
      <div className="card p-4 space-y-3">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role==='user' ? 'text-right' : ''}>
              <div className={`inline-block px-3 py-2 rounded-xl ${m.role==='user'?'bg-brand-yellow':'bg-brand-cream'}`}>{m.content}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-sm text-brand-brown/60">Ask anything. The assistant will answer using the knowledge pack.</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input className="input" placeholder="Type your message" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if (e.key==='Enter') send() }} />
          <button className={`btn-primary ${sending?'bg-gray-200 text-gray-500 cursor-not-allowed':''}`} onClick={send} disabled={sending}>Send</button>
        </div>
      </div>
    </div>
  )
}
