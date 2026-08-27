export type OrderLine = {
  id: number
  productId: number
  productCode: string
  description: string
  ordered: number
  fulfilled: number
  remaining: number
  unit: string
  assigned: number
  branch: number
  price: number
  classCode: string
  currencyId: number
  piecesAssignment: string
  discount: number
  publicPrice: number
  sku: string
  color: string
  size: string
}

export type Order = {
  id: number
  number: string
  customerOrderNumber: string
  customer: { id: number; code: string; name: string }
  documentKind: "order" | "quote" | "unknown"
  status: string
  fulfilledAmount: number
  branch: number
  department: string
  dates: { orderedAt: string | null; from: string | null; dueAt: string | null }
  attention: string
  termsDays: number
  authorization: string
  initial: boolean
  warehouse: string
  currencyId: number
  exchangeRate: number
  minimumFulfillmentPercentage: number
  observations: string
  classifications: string[]
  totals: {
    quantity: number
    ordered: number
    fulfilled: number
    remaining: number
    subtotal: number
    discount: number
    freight: number
    insurance: number
    other: number
    tax: number
    total: number
  }
  lines: OrderLine[]
}

export type OrderSearchResponse = {
  data: Order[]
  pagination: { page: number; pageSize: number; total: number; pages: number }
}

export type OrderPanelSection = "actions" | "secondary-actions"
export type OrderPanelKey =
  | "assign-all" | "authorize" | "invoices" | "boxes" | "classifications"
  | "comments" | "quote-conversion" | "duplicate" | "labels" | "print"
  | "monarch" | "pieces" | "transfer" | "assign-ct" | "consolidate"
  | "ct" | "split-ct" | "export" | "purchase-order" | "split"
  | "branch" | "wip"

export type OrderPanelDefinition = {
  key: OrderPanelKey
  label: string
  section: OrderPanelSection
}

export type OrderPanel = {
  order: { id: number; number: string }
  key: OrderPanelKey
  section: OrderPanelSection
  button: string
  available: boolean
  source: "mysql" | "static" | "not-available"
  items: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
  reason?: string
}

export type OrderMutationInput = {
  number?: string
  customerId?: number
  customerOrderNumber?: string
  orderedAt?: string
  from?: string
  dueAt?: string
  branch?: number
  department?: string
  attentionCode?: string
  termsDays?: number
  warehouse?: string
  currencyId?: number
  initial?: boolean
  observations?: string
  status?: string
  classifications?: string[]
  lines?: Array<{ productId: number; quantity: number; price: number; discount?: number }>
}
