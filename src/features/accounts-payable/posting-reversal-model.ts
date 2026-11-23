export type PostingReversal = {
  id: number
  policyNumber: string
  date: string
  reason: string
}

export type PostingReversalPreview = {
  canWrite: boolean
  reason: string | null
  number: string
  policyNumber: string
  date: string
  originalDate: string
  minimumDate?: string | null
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
}
