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
  costCenter: number
  branch: number
  lotId: number
  inventoryCreatedAt: string | null
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
    total: number
    balance: number
  }
  lines: PurchaseReceptionLine[]
}

export type PurchaseReceptionSearchResponse = {
  data: PurchaseReception[]
  pagination: { page: number; pageSize: number; total: number; pages: number }
}

export type PurchaseReceptionPanelKey = "auxiliary" | "classifications"

export type PurchaseReceptionPanel = {
  purchaseReception: { id: number; number: string }
  key: PurchaseReceptionPanelKey
  section: "actions"
  button: string
  source: "mysql"
  items: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
}

export type PurchaseReceptionAction = {
  key: string
  label: string
  panelKey?: PurchaseReceptionPanelKey
}
