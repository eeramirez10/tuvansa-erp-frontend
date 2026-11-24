export type AccountingPolicyMovement = {
  id: number
  accountId: number
  accountCode: string
  accountName: string
  debit: number
  credit: number
  reference: string
  exchangeRate: number
  costCenter: number
  reconciled: boolean
  accountType: number
}

export type AccountingPolicy = {
  id: number
  number: string
  date: string | null
  cheque: string
  company: number
  origin: string
  applied: boolean
  beneficiary: string
  family: string
  concept: string
  amountInWords: string
  userId: number
  report: string
  auditAt: string | null
  postDate: string | null
  classifications: string[]
  exchangeRate: number
  usedAt: string | null
  totals: { debit: number; credit: number; difference: number }
  movements: AccountingPolicyMovement[]
  manual?: { revision: number; canceled: boolean; reconciled: boolean }
}

export type ManualPolicyOperation = "apply" | "unapply" | "delete"

export type ManualPolicyPreview = NonNullable<AccountingPolicy["manual"]> & {
  fiscalStart: string | null
  fiscalEnd: string | null
  canEdit: boolean
  canApply: boolean
  canUnapply: boolean
  canDelete: boolean
  reason: string | null
}

export type ManualPolicyCaptureOptions = {
  canWrite: boolean
  reason: string | null
  fiscalStart: string | null
  fiscalEnd: string | null
  defaults: { date: string; type: "3" }
  costCenters: Array<{ code: number; name: string }>
}

export type ManualPolicyAccount = { id: number; code: string; name: string; type: number }

export type ManualPolicyInput = {
  requestKey: string
  date: string
  concept: string
  beneficiary: string
  family: string
  lines: Array<{ accountCode: string; costCenter: number; debit: number; credit: number; reference: string }>
}

export type ManualPolicyActionInput = { requestKey: string; revision: number; confirmed: true }

export type DuplicatePolicyInput = { requestKey: string; revision: string; date: string; confirmed: true }

export type AccountingPolicyComments = {
  policy: { id: number; number: string }
  fields: Pick<AccountingPolicy, "date" | "cheque" | "report" | "postDate" | "origin" | "beneficiary" | "family" | "concept" | "amountInWords">
    & { comments: [string, string, string, string, string, string] }
  revision: number | null
  applied: boolean
  canWrite: boolean
  reason: string | null
  userId: number
  auditAt: string | null
  exchangeRate: number
}

export type AccountingPolicyCommentsInput = {
  fields: AccountingPolicyComments["fields"] & { date: string }
  requestKey: string
  revision: number
}

export type DuplicatePolicyPreview = {
  policy: { id: number; number: string }
  date: string
  fiscalStart: string | null
  fiscalEnd: string | null
  revision: string
  canWrite: boolean
  reason: string | null
}

export type AccountingPolicySearchResponse = {
  data: AccountingPolicy[]
  pagination: { page: number; pageSize: number; total: number; pages: number }
}

export type AccountingPolicyClassifications = {
  policy: { id: number; number: string }
  key: "classifications"
  section: "actions"
  button: "Clasificar"
  source: "mysql"
  items: Array<Record<string, unknown>>
  summary: { current: string[] }
}

export type AccountingPolicyAction = {
  key: string
  label: string
  panel?: "classifications"
}
