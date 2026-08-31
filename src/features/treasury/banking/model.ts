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
  readOnly: true
  items: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
  reason?: string
}
