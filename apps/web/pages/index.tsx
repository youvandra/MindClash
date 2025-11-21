import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ensureCustodialAccount } from '../lib/api'

export default function Home() {
  const [connected, setConnected] = useState(false)
  const [accountId, setAccountId] = useState('')
  const [status, setStatus] = useState('')
  const [qr, setQr] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [settingUp, setSettingUp] = useState(false)
  const connectingRef = useRef(false)
  useEffect(() => {
    const acc = typeof window !== 'undefined' ? sessionStorage.getItem('accountId') : null
    if (acc) {
      setAccountId(acc)
      setConnected(true)
      setStatus('Connected')
      return
    }
    ;(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const sess = data?.session
        if (sess && !acc) {
          await ensureCustodial()
        }
      } catch {}
    })()
  }, [])

  async function getHashConnect() {
    const w: any = typeof window !== 'undefined' ? window : {}
    if (w.__hashconnect) return w.__hashconnect
    const mod: any = await import('hashconnect')
    const sdk: any = await import('@hashgraph/sdk')
    const HashConnect = mod.HashConnect || mod.default
    const LedgerId = sdk.LedgerId || sdk.default?.LedgerId
    const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID
    const network = process.env.NEXT_PUBLIC_HASHPACK_NETWORK || 'testnet'
    if (!projectId) throw new Error('Missing NEXT_PUBLIC_WC_PROJECT_ID')
    const ledger = network === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET
    const appMetadata = { name: 'Debate Arena AI', description: 'Agent-to-Agent Debate Arena', icons: [], url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000' }
    const hc = new HashConnect(ledger, projectId, appMetadata, false)
    w.__hashconnect = hc
    return hc
  }

  async function ensureCustodial() {
    setSettingUp(true)
    const { data } = await supabase.auth.getSession()
    const sess = data?.session
    const user = sess?.user
    if (!user) return
    const userId = user.id
    const email = (user as any)?.email || (user as any)?.user_metadata?.email || ''
    const out = await ensureCustodialAccount(userId, email, 'google')
    if (out && out.error) throw new Error(out.error)
    const accId = String(out?.accountId || out?.wallet?.account_id || '')
    if (!accId) return
    try {
      const { data: existingUser } = await supabase.from('users').select('*').eq('account_id', accId).maybeSingle()
      if (!existingUser) {
        const displayName = (user as any)?.user_metadata?.full_name || (email ? email.split('@')[0] : `User-${accId}`)
        await supabase.from('users').insert({ account_id: accId, name: displayName })
      }
    } catch {}
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('accountId', accId)
    }
    setAccountId(accId)
    setConnected(true)
    setStatus('Connected')
    setSettingUp(false)
  }

  async function handleGoogle() {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined } })
    } catch (e: any) {
      setStatus(e?.message || 'Google sign-in error')
    }
  }

  async function getFreshHashConnect() {
    const mod: any = await import('hashconnect')
    const sdk: any = await import('@hashgraph/sdk')
    const HashConnect = mod.HashConnect || mod.default
    const LedgerId = sdk.LedgerId || sdk.default?.LedgerId
    const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID
    const network = process.env.NEXT_PUBLIC_HASHPACK_NETWORK || 'testnet'
    if (!projectId) throw new Error('Missing NEXT_PUBLIC_WC_PROJECT_ID')
    const ledger = network === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET
    const appMetadata = { 
      name: 'Debate Arena AI', 
      description: 'Agent-to-Agent Debate Arena', 
      icons: [], 
      url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000' 
    }

    const hc = new HashConnect(ledger, projectId, appMetadata, false)
    await hc.init()
    return hc
  }


  async function handleConnect() {
    if (connectingRef.current) return
    connectingRef.current = true
    setConnecting(true)

    let hc: any
    try {
      hc = await getFreshHashConnect() // fresh instance
    } catch (e: any) {
      setStatus(e?.message || 'HashConnect init error')
      connectingRef.current = false
      setConnecting(false)
      return
    }

    hc.pairingEvent.once(async (data: any) => {
      const ids: string[] = Array.isArray(data?.accountIds) ? data.accountIds.map(String) : []
      const accId = ids[ids.length - 1] || ''
      const topic = data?.topic || ''

      if (!accId) {
        setStatus('Connected but account not found')
        connectingRef.current = false
        return
      }

      sessionStorage.setItem('hcTopic', topic)
      sessionStorage.setItem('accountId', accId)
      setAccountId(accId)
      setConnected(true)
      setStatus('Connected')

      try {
        const { data: sessData } = await supabase.auth.getSession()
        const uid = sessData?.session?.user?.id
        if (uid) {
          const { data: cw } = await supabase.from('custodial_wallets').select('account_id').eq('user_id', uid).maybeSingle()
          if (cw && String(cw.account_id) === accId) {
            const { data: existing } = await supabase.from('users').select('*').eq('account_id', accId).maybeSingle()
            if (!existing) {
              await supabase.from('users').insert({ account_id: accId, name: `User-${accId}` })
            }
          }
        }
      } catch {}

      connectingRef.current = false
      setConnecting(false)
    })

    try {
      hc.openPairingModal()
    } catch (e: any) {
      setStatus(e?.message || 'Connect error')
      connectingRef.current = false
      setConnecting(false)
    }
  }



  async function handleDisconnect() {
    try {
      try { await supabase.auth.signOut() } catch {}
      const topic = typeof window !== 'undefined' ? sessionStorage.getItem('hcTopic') : null
      const hc = await getHashConnect()
      if (topic) {
        try { await hc.disconnect(topic) } catch {}
      }
    } catch {}
    try { sessionStorage.removeItem('hcTopic') } catch {}
    try { sessionStorage.removeItem('accountId') } catch {}
    setConnected(false)
    setAccountId('')
    setStatus('')
    setQr('')
  }
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="page">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">The Vault of Human Intelligence</h1>
            <p className="text-brand-brown">Unlock expert-powered knowledge modules, rent real human insights, and get AI responses shaped by verified specialists, not generic models. Every question is paid instantly on-chain, every insight is protected, and every expert earns from their intelligence. This is where knowledge is proven, rated, and transformed into a marketplace you can chat with.</p>
            <div className="flex gap-3">
              {connected ? (
                <>
                  <Link href="/arena" className="btn-primary">Enter Arena</Link>
                  <Link href="/packs" className="btn-outline">Manage Packs</Link>
                </>
              ) : (
                <>
                  <button className={`btn-primary ${connecting ? 'bg-gray-200 text-gray-500 hover:bg-gray-200 cursor-not-allowed' : ''}`} onClick={handleConnect} disabled={connecting}>
                    {connecting ? (
                      <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 animate-spin">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" />
                        </svg>
                        <span>Connecting...</span>
                      </span>
                    ) : 'Connect Wallet'}
                  </button>
                  <button className="btn-outline" onClick={handleGoogle}>Sign in with Google</button>
                </>
              )}
            </div>
            {settingUp && !connected && (
              <div className="text-sm">
                <span className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 animate-spin">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <span>Setting up custodial wallet...</span>
                </span>
              </div>
            )}
            {status && !connected && <div className="text-sm">{status}</div>}
            {connected && <div className="text-sm">Wallet: <span className="font-mono">{accountId}</span></div>}
            {connected && <button className="btn-outline text-sm" onClick={handleDisconnect}>Disconnect</button>}
          </div>
          <div className="hidden md:block">
            <div className="card-lg">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-24 rounded-xl bg-brand-yellow"></div>
                <div className="h-24 rounded-xl bg-brand-blue"></div>
                <div className="h-24 rounded-xl bg-brand-peach"></div>
                <div className="h-24 rounded-xl bg-brand-coral"></div>
                <div className="h-24 rounded-xl bg-brand-green"></div>
                <div className="h-24 rounded-xl bg-brand-brown"></div>
              </div>
            </div>
          </div>
        </div>
        {connected ? (
          <>
              
          </>
        ) : (
          <>
              
          </>
        )}
      </div>
    </div>
  )
}
