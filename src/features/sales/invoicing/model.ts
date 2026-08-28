export type InvoiceLine = {
  id: number
  productId: number
  productCode: string
  description: string
  quantity: number
  fulfilledQuantity: number
  unit: string
  price: number
  grossPrice: number
  discount: number
  amount: number
  branch: number
  agent: string
  pieces: number
  page: number
  factor: number
  cost: number
  package: string
  sku: string
  family: string
}

export type Invoice = {
  id: number
  number: string
  orderNumber: string
  customerOrderNumber: string
  customer: { id: number; code: string; name: string; billedName: string }
  movementType: string
  status: string
  canceled: boolean
  dates: {
    issuedAt: string | null
    dueAt: string | null
    paidAt: string | null
    deliveryNoteAt: string | null
  }
  delayDays: number
  attention: string
  attentionCode: string
  branch: number
  department: string
  route: number
  pieces: number
  warehouse: string
  currency: { id: number; name: string; exchangeRate: number }
  initial: boolean
  cfdStatus: string
  folio: string
  deliveryNote: string
  warehouseSeal: string
  discountPercentages: number[]
  totals: {
    quantity: number
    fulfilledQuantity: number
    subtotal: number
    discount: number
    freight: number
    insurance: number
    other: number
    exciseTax: number
    tax: number
    total: number
    paid: number
    balance: number
  }
  lines: InvoiceLine[]
}

export type InvoiceSearchResponse = {
  data: Invoice[]
  pagination: { page: number; pageSize: number; total: number; pages: number }
}

export type InvoicePanelSection = "actions" | "summaries"
export type InvoicePanelKey =
  | "auxiliary" | "boxes" | "classifications" | "comments" | "ct"
  | "print" | "lots" | "pieces" | "seal" | "ticket-to-invoice"
  | "transfer" | "edit-pieces" | "truck-settlement"

export type InvoicePanelDefinition = {
  key: InvoicePanelKey
  label: string
  section: InvoicePanelSection
}

export type InvoicePanel = {
  invoice: { id: number; number: string }
  key: InvoicePanelKey
  section: InvoicePanelSection
  button: string
  available: boolean
  source: "mysql" | "static"
  items: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
  readOnly?: boolean
  reason?: string
}
