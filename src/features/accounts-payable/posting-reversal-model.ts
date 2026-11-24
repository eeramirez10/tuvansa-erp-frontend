type PostingReconciliation = { id: number; date: string }

export type PostingReversal = {
  id: number
  policyNumber: string
  date: string
  reason: string
  originalReconciliation?: PostingReconciliation | null
}

export type PostingReversalPreview = {
  canWrite: boolean
  reason: string | null
  number: string
  policyNumber: string
  date: string
  originalDate: string
  minimumDate?: string | null
  originalReconciliation?: PostingReconciliation | null
  notice?: string | null
  fiscalStart: string | null
  fiscalEnd: string | null
  amount: number
  documents: Array<{ id: number; number: string; total: number }>
  alreadyRecorded: PostingReversal | null
}

export type PostingReversalInput = {
  requestKey: string
  date: string
  reason: string
  confirmed: true
  expectedReconciliationId?: number | null
}

export function parsePostingReversal(raw: unknown): PostingReversal | null {
  if (!raw || typeof raw !== "object") return null
  const reversal = raw as Partial<PostingReversal>
  if (typeof reversal.id !== "number" || !Number.isSafeInteger(reversal.id) || reversal.id <= 0 ||
    typeof reversal.policyNumber !== "string" || typeof reversal.date !== "string" || typeof reversal.reason !== "string") return null
  return { id: reversal.id, policyNumber: reversal.policyNumber, date: reversal.date, reason: reversal.reason }
}
