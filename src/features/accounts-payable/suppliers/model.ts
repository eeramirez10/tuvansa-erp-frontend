export type Supplier = {
  id: number
  code: string
  name: string
  isActive: boolean
  deactivatedAt: string | null
  address: {
    street: string
    neighborhood: string
    city: string
    state: string
    postalCode: string
  }
  contact: {
    name: string
    phone: string
    phone2: string
    fax: string
    email: string
  }
  fiscal: {
    taxId: string
    curp: string
    accountingAccount: string
  }
  terms: {
    priceList: number
    discounts: [number, number]
    paymentTermDays: number
    applyToSupplierCode: string
    creditLimit: number
    currencyId: number
    type: number
  }
  totals: {
    actualPaymentTermDays: number
    previousBalance: number
    currentBalance: number
    accumulatedPurchases: number
    lastPurchaseAt: string | null
    lastPaymentAt: string | null
  }
  indicators: { hasEvents: boolean }
  notes: string
  createdAt: string | null
}

export type SupplierSearchResponse = {
  data: Supplier[]
  pagination: { page: number; pageSize: number; total: number }
}

export type SupplierCatalogFields = Pick<Supplier, "code" | "name" | "address" | "contact" | "fiscal" | "terms" | "notes">

export type SupplierCreatePreview = {
  writable: boolean
  reason: string | null
  fields: SupplierCatalogFields
  accountingAccountRequired: boolean
}

export type SupplierEditPreview = SupplierCreatePreview & {
  revision: string
  codeEditable: boolean
  deletionReason: string | null
}

export type SupplierPanelDefinition = {
  key: string
  label: string
  title: string
  section: "actions" | "queries"
  ct?: boolean
  path: string
  columns: readonly SupplierPanelColumn[]
}

export type SupplierPanelColumn = {
  key: string
  label: string
  width?: string
  format?: "text" | "number" | "money" | "date" | "boolean"
}

export type SupplierPanelResponse = {
  data: {
    supplier: Pick<Supplier, "id" | "code" | "name"> & { currentBalance: number }
    items: Array<Record<string, unknown>>
    summary?: Record<string, unknown>
    detail?: Record<string, unknown>
    unavailableReason?: string
  }
}

export type SupplierGroupingPosition = {
  id: number
  revision: string
  document: string
  amount: number
}

export type SupplierGroupingInput = {
  requestKey: string
  target: Pick<SupplierGroupingPosition, "id" | "revision">
  sources: Array<Pick<SupplierGroupingPosition, "id" | "revision">>
}

export type SupplierGroupingResult = {
  targetId: number
  sourceIds: number[]
  amount: number
  remaining: number
  date: string
}

export type SupplierClassificationsResponse = {
  data: {
    supplier: Pick<Supplier, "id" | "code" | "name"> & { currentBalance: number }
    classifications: Array<{ position: number; label: string; code: string; number: string; description: string }>
    selectedPosition: number
    options: Array<{ id: number; code: string; description: string; number: string; type: string }>
    revision: number
    canWrite: boolean
  }
}

export type SupplierClassificationUpdate = { current: string[]; revision: number; requestKey: string }

export type SupplierActivityKind = "events" | "contacts"
export type SupplierActivityCommand = {
  operation: "create" | "change" | "remove"
  requestKey: string
  id?: string | number
  revision?: number
  fields?: Record<string, string | null>
}

export type SupplierActivityItem = { id: string | number; revision: number } & Record<string, unknown>

export type SupplierVariousUpdate = {
  requestKey: string
  revision: number
  fields: Record<string, string | number | number[]>
}

export type SupplierPaymentMode = "transfer" | "check"

export type SupplierPaymentPreview = {
  receiptId: number
  number: string
  remaining: number
  revision: number
  canWrite: boolean
  reason: string
  bankAccounts: Array<{ id: number; code: string; name: string }>
  defaults: { date: string; amount: number; mode: "transfer" }
}

export type SupplierPaymentInput = {
  requestKey: string
  revision: number
  bankAccountId: number
  mode: SupplierPaymentMode
  amount: number
  date: string
  description: string
}

export type SupplierPayment = Pick<SupplierPaymentInput, "bankAccountId" | "mode" | "amount" | "date"> & {
  id: number
  receiptId: number
  receiptNumber: string
  number: string
  policyNumber: string
  remaining: number
}
