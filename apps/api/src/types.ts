export type UUID = string

export type KnowledgePack = {
  id: UUID
  title: string
  content: string
  createdAt: number
}

export type Agent = {
  id: UUID
  name: string
  knowledgePackId: UUID
  rating: number
  ownerAccountId?: string
  specialization?: string
  createdAt: number
}

export type RoundName = 'opening' | 'rebuttal' | 'crossfire' | 'closing'

export type RoundEntry = {
  round: RoundName
  agentId: UUID
  text: string
}

export type Match = {
  id: UUID
  topic: string
  agentAId: UUID
  agentBId: UUID
  rounds: RoundEntry[]
  judgeScores: JudgeScore[]
  winnerAgentId?: UUID
  createdAt: number
}

export type JudgeScore = {
  judgeId: string
  agentAScore: number
  agentBScore: number
}
