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
  pieces: number | string
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
  cancellationAvailable?: boolean
  cancellation?: RemissionCancellation | null
  transfer?: InvoiceTransferReceipt
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

export type InvoiceTransferReceipt = { id: number; number: string; date: string; from: string; to: string; amount: number }

export type InvoiceTransferPreview = {
  warehouses: { code: string; name: string }[]
  from: string
  to: string | null
  date: string
  amount: number
  revision: string | null
  reason: string | null
  receipt: InvoiceTransferReceipt | null
  lines: { productCode: string; description: string; quantity: number; unit: string; price: number; cost: number | null }[]
}

export type InvoiceTransferInput = { warehouse: string; revision: string; requestKey: string; confirmed: true }

export type InvoiceSearchResponse = {
  data: Invoice[]
  pagination: { page: number; pageSize: number; total: number; pages: number }
}

export type InvoiceFromOrderPreview = {
  orderId: number
  number: string
  customer: { id: number; code: string; name: string }
  warehouse: string
  revision: number
  canWrite: boolean
  reason: string | null
  fiscalStart: string | null
  fiscalEnd: string | null
  defaults: { issuedAt: string | null }
  lines: Array<{
    orderLineId: number
    productCode: string
    description: string
    unit: string
    ordered: number
    fulfilled: number
    assigned: number
    maximum: number
    suggested: number
  }>
}

export type CreateInvoiceFromOrderInput = {
  orderNumber: string
  requestKey: string
  revision: number
  issuedAt: string
  lines: Array<{ orderLineId: number; quantity: number }>
}

export type CreateInvoiceFromOrderResult = { invoice: Invoice; orderComplete: boolean }

export type RemissionCancellation = {
  id: number
  date: string
  reason: string
  regeneratedOrder: boolean
}

export type RemissionCancellationPreview = {
  canWrite: boolean
  reason: string | null
  number: string
  originalDate: string
  date: string
  fiscalStart: string | null
  fiscalEnd: string | null
  amount: number
  order: { id: number; number: string; canRegenerate: boolean; reason: string | null }
  alreadyRecorded: RemissionCancellation | null
}

export type RemissionCancellationInput = {
  requestKey: string
  date: string
  reason: string
  confirmed: true
  regenerateOrder: boolean
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

export type StampingSimulation = {
  mode: "simulation"
  reference: string
  simulatedAt: string
}

export type TicketConversionResult = {
  invoiceId: number
  sourceNumber: string
  number: string
  issuedAt: string
}

export type TicketConversion = {
  sourceNumber: string
  targetType: "FE"
  issuedAt: string
  total: number
  balance: number
  currency: string
  version: string | null
  result: TicketConversionResult | null
}

export type TicketConversionInput = { expectedVersion: string; requestKey: string }

export type InvoicePanel = {
  invoice: { id: number; number: string }
  key: InvoicePanelKey
  section: InvoicePanelSection
  button: string
  available: boolean
  source: "mysql" | "postgres" | "static"
  items: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
  readOnly?: boolean
  reason?: string
  stampingSimulation?: { result: StampingSimulation | null }
  ticketConversion?: TicketConversion
}
