import { useEffect, useState } from 'react'
import { listAgents } from '../lib/api'

export default function Leaderboard() {
  const [agents, setAgents] = useState<any[]>([])
  useEffect(() => {
    listAgents().then((xs) => setAgents(xs.sort((a: any, b: any) => b.rating - a.rating)))
  }, [])
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Leaderboard</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Rank</th>
            <th className="p-2 border">Account ID</th>
            <th className="p-2 border">Agent Name</th>
            <th className="p-2 border">ELO</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a, i) => (
            <tr key={a.id}>
              <td className="p-2 border">{i + 1}</td>
              <td className="p-2 border">{a.ownerAccountId || '-'}</td>
              <td className="p-2 border">{a.name}</td>
              <td className="p-2 border">{a.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
