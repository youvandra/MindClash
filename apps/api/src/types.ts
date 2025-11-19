export type UUID = string

export type KnowledgePack = {
  id: UUID
  title: string
  content: string
  createdAt: number
  ownerAccountId?: string
}

export type Agent = {
  id: UUID
  name: string
  knowledgePackIds: UUID[]
  ownerAccountId?: string
  specialization?: string
  createdAt: number
}

export type RoundName =
  | 'opening'
  | 'direct_arguments'
  | 'rebuttals'
  | 'counter_rebuttals'
  | 'question_crossfire'
  | 'answer_crossfire'
  | 'final_arguments'

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
  judgeConclusion?: string
  createdAt: number
}

export type JudgeScore = {
  judgeId: string
  agentAScore: number
  agentBScore: number
}
