export type BankAccountMonthlyValues = {
  month: number
  balance: number
  charges: number
  credits: number
  budget: number
}

export type BankAccount = {
  id: number
  code: string
  family: string
  accountNumber: string
  branch: string
  name: string
  nature: "debtor" | "creditor"
  systemType: "bank" | "expense" | "other"
  currency: { id: number; name: string }
  balances: { current: number; bank: number; previous: number; inTransit: number }
  currencyBalances: { current: number; month12: number; previous: number }
  control: {
    manager: string
    phone: string
    customerNumber: string
    controlEnabled: boolean
    nextCheckNumber: number
    nextDepositNumber: number
    nextTransferNumber: number
    subAccounts: boolean
    preventJournalEntries: boolean
    format: string
    movements: boolean
    budgetable: boolean
    company: number
    deposits: boolean
    payments: boolean
    multiCompany: number
  }
  prorationPercentages: { sales: number; inventory: number; distribution: number; advance: number }
  fiscalReports: { annualInflationAdjustment: number; deductibleIetu: boolean; nonDeductibleVat: boolean }
  createdAt: string | null
  ledger: { firstPeriod: BankAccountMonthlyValues[]; secondPeriod: BankAccountMonthlyValues[] }
}

export type BankAccountSearchResponse = {
  data: BankAccount[]
  pagination: { page: number; pageSize: number; total: number; pages: number }
}

export type BankAccountFormFields = Pick<BankAccount,
  "code" | "family" | "accountNumber" | "branch" | "name" | "nature" | "systemType" | "control" | "prorationPercentages" | "fiscalReports"
> & { currencyId: number }

export type BankAccountFormPreview = {
  fields: BankAccountFormFields
  options: {
    codeLengths: number[]
    currencies: Array<{ id: number; name: string }>
    natures: Array<{ id: BankAccount["nature"]; name: string }>
    systemTypes: Array<{ id: BankAccount["systemType"]; name: string }>
  }
  canWrite: boolean
  reason: string | null
  revision: string | null
  editableFields: string[]
  canDelete?: boolean
  deleteReason?: string | null
}

export type CreateBankAccountInput = { requestKey: string; fields: BankAccountFormFields }
export type UpdateBankAccountInput = { revision: string; fields: BankAccountFormFields }

export type BankPanelKey =
  | "movements"
  | "deposits"
  | "payments"
  | "reconciliation"
  | "automatic-reconciliation"
  | "auxiliary"
  | "supplier-expenses"
  | "general-ledger"
  | "cost-center-ledger"
  | "authorization-review"
  | "classifiers"
  | "transfer"
  | "unapplied-auxiliary"
export type BankPanelDefinition = { key: BankPanelKey; label: string }
export type BankPanel = {
  button: string
  section: "actions"
  source: string[]
  available: boolean
  readOnly: boolean
  items: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
  reason?: string
}

export type BankReconciliationInput = {
  requestKey: string
  movementIds: number[]
  statementDate: string
  statementBalance: number
  expectedBankBalance: number
}

export type BankReconciliation = {
  id: number
  movementIds: number[]
  statementDate: string
  bankBalance: number
  previousBankBalance: number
  netMovement: number
}

type BankTransferAccount = Pick<BankAccount, "id" | "code" | "name">
type BankTransferMode = "check" | "transfer"

export type BankTransferPreview = {
  source: BankTransferAccount
  destinations: BankTransferAccount[]
  canWrite: boolean
  reason: string | null
  defaults: { date: string; checkNumber: string }
  fiscalStart: string
  fiscalEnd: string
}

export type BankTransferInput = {
  requestKey: string
  destinationBankAccountId: number
  mode: BankTransferMode
  date: string
  amount: number
  reference: string
  beneficiary: string
  description: string
}

export type BankTransfer = Pick<BankTransferInput, "date" | "amount" | "reference" | "beneficiary" | "description" | "mode"> & {
  id: number
  number: string
  policyNumber: string
  source: BankTransferAccount
  destination: BankTransferAccount
  sourceMovementId: number
  destinationMovementId: number
}
