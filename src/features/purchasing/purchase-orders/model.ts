export type PurchaseOrderLine = {
  id: number
  productId: number
  productCode: string
  description: string
  ordered: number
  fulfilled: number
  remaining: number
  unit: string
  classCode: string
  branch: number
  price: number
  discount: number
  currencyId: number
  confirmed: boolean
  observations: string
  assigned: number
  piecesAssignment: string
  factor: number
  supplierProductCode: string
}

export type PurchaseOrder = {
  id: number
  number: string
  supplierOrderNumber: string
  supplier: { id: number; code: string; name: string }
  documentKind: "order" | "quote" | "unknown"
  status: string
  branch: number
  department: string
  dates: { orderedAt: string | null; from: string | null; dueAt: string | null }
  warehouse: string
  initial: boolean
  taxPercentage: number
  classifications: string[]
  totals: {
    assigned: number
    ordered: number
    fulfilled: number
    remaining: number
    subtotal: number
    discount: number
    exciseTax: number
    freight: number
    insurance: number
    other: number
    tax: number
    total: number
  }
  lines: PurchaseOrderLine[]
}

export type PurchaseOrderSearchResponse = {
  data: PurchaseOrder[]
  pagination: { page: number; pageSize: number; total: number; pages: number }
}

export type PurchaseOrderPanelKey = "receipts" | "classifications" | "comments"

export type PurchaseOrderPanel = {
  purchaseOrder: { id: number; number: string }
  key: PurchaseOrderPanelKey
  section: "actions"
  button: string
  source: "mysql"
  items: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
}

export type PurchaseOrderAction = {
  key: string
  label: string
  panelKey?: PurchaseOrderPanelKey
  readOnly: boolean
}
