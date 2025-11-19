import { useEffect, useState } from 'react'
import { listMarketplaceListings } from '../lib/api'

export default function Marketplace() {
  const [listings, setListings] = useState<any[]>([])
  const [query, setQuery] = useState('')
  useEffect(() => {
    listMarketplaceListings().then(setListings).catch(()=>{})
  }, [])
  return (
    <div className="page py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Marketplace</h2>
        <input className="input max-w-sm" placeholder="Search title" value={query} onChange={e=>setQuery(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {listings.filter(l => !query || String(l.title||l.knowledge_pack_id||'').toLowerCase().includes(query.toLowerCase())).map(l => (
          <div key={l.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-brand-brown/60">Owner <span className="font-mono">{l.owner_account_id}</span></div>
                <div className="font-semibold">Knowledge Pack <span className="font-mono">{l.knowledge_pack_id}</span></div>
                <div className="text-xs text-brand-brown/60">{new Date(l.created_at).toLocaleString()}</div>
              </div>
              <a className="btn-primary" href={`/marketplace/${l.id}`}>Chat</a>
            </div>
          </div>
        ))}
        {listings.length === 0 && (
          <div className="card p-4"><div className="text-center text-sm text-brand-brown/60">No listings yet</div></div>
        )}
      </div>
    </div>
  )
}

