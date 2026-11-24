import type { PostingReversal } from "@/features/accounts-payable/posting-reversal-model"

export type PurchaseReceptionCancellationKind = "expense" | "reception"

export type PurchaseReceptionPedimento = {
  number: string
  date: string | null
  customsOffice: string
  incrementables: number
}

export type PurchaseReceptionLine = {
  id: number
  productId: number
  productCode: string
  description: string
  quantity: number
  invoicedQuantity: number
  unit: string
  price: number
  grossPrice: number
  discount: number
  amount: number
  pieces: string
  costCenter: number | string
  branch: number
  lotId: number
  inventoryCreatedAt: string | null
  expenseTaxes?: { vat: number; vatWithholding: number; incomeWithholding: number }
}

export type PurchaseReception = {
  id: number
  number: string
  orderNumber: string
  supplierReference: string
  supplier: { id: number; code: string; name: string }
  department: string
  warehouse: string
  branch: number
  status: string
  cancelled: boolean
  cancellationAvailable?: boolean
  pedimento?: PurchaseReceptionPedimento
  cancellation?: PostingReversal | null
  dates: { receivedAt: string | null; dueAt: string | null; orderedAt: string | null }
  delayDays: number
  classifications: string[]
  discountPercentages: number[]
  totals: {
    units: number
    pieces: number
    subtotal: number
    discount: number
    freight: number
    insurance: number
    other: number
    otherLabel: string
    exciseTax: number
    taxPercentage: number
    tax: number
    withholdingTax: number
    expenseTaxes?: { vatWithholding: number; incomeWithholding: number }
    total: number
    balance: number
  }
  lines: PurchaseReceptionLine[]
}

export type PurchaseReceptionSearchResponse = {
  data: PurchaseReception[]
  pagination: { page: number; pageSize: number; total: number; pages: number }
}

export type PurchaseReceptionPanelKey = "auxiliary" | "classifications" | "pedimento" | "pieces"

export type PurchaseReceptionPanel = {
  purchaseReception: { id: number; number: string }
  key: PurchaseReceptionPanelKey
  section: "actions"
  button: string
  source: "mysql" | "postgres"
  items: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
}

export type PurchaseReceptionAction = {
  key: string
  label: string
  panelKey?: PurchaseReceptionPanelKey
}

export type PurchaseReceptionPieceLine = {
  lineId: number
  productCode: string
  description: string
  pieces: string
  remaining: number
  suggestedSerial: string
  canAdd: boolean
  addReason: string | null
  canEdit: boolean
  editReason: string | null
  revision: string
}

export type PurchaseReceptionPieceInput = {
  serial: string
  quantity: number
  reference: string
  requestKey: string
  revision: string
}

export type GeneralExpensesTaxAccount = "vat" | "vatWithholding" | "incomeWithholding"

type GeneralExpensesOption = { code: string; name: string }

export type GeneralExpensesPreview = {
  canWrite: boolean
  reason: string | null
  defaults: { date: string; type: "GA" }
  fiscalStart: string | null
  fiscalEnd: string | null
  costCenters: GeneralExpensesOption[]
  defaultTaxAccounts?: Partial<Record<GeneralExpensesTaxAccount, string>>
  taxAccounts: Record<GeneralExpensesTaxAccount, GeneralExpensesOption[]>
}

export type GeneralExpensesCatalog = {
  supplier?: GeneralExpensesOption & {
    id: number; vatRate: number; vatWithholdingRate: number; incomeWithholdingRate: number; calculateTaxes: boolean
  }
  product?: GeneralExpensesOption & { id: number; vatExempt: boolean; retentionsEligible: boolean }
}

export type GeneralExpensesInput = {
  requestKey: string
  date: string
  reference: string
  beneficiary: string
  description: string
  taxAccounts?: Partial<Record<GeneralExpensesTaxAccount, string>>
  lines: Array<{
    supplierCode: string
    productCode: string
    reference: string
    base: number
    vat: number
    vatWithholding: number
    incomeWithholding: number
    costCenter: string
  }>
}

export type GeneralExpensesResult = {
  id: number
  policyNumber: string
  documents: Array<{
    id: number
    number: string
    supplierId: number
    supplierCode: string
    supplierName: string
    reference: string
    total: number
  }>
}
