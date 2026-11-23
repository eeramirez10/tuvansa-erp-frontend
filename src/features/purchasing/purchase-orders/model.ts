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
  currencyName: string
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
  received: { quantity: number; pieces: number }
  branch: number
  department: string
  dates: { orderedAt: string | null; from: string | null; dueAt: string | null }
  warehouse: string
  initial: boolean
  taxPercentage: number
  discountPercentages: [number, number, number]
  otherLabel: string
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

export type PurchaseOrderPanelKey = "receipts" | "classifications" | "comments" | "ct" | "pieces"

export type PurchaseOrderPanel = {
  purchaseOrder: { id: number; number: string }
  key: PurchaseOrderPanelKey
  section: "actions"
  button: string
  source: "mysql" | "mysql+postgres" | "postgres"
  items: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
}

export type PurchaseOrderClassificationPanel = Omit<PurchaseOrderPanel, "items" | "summary"> & {
  items: Array<{ classifier: number; code: string; description: string; compositeCode: string }>
  summary: { current: string[]; labels: string[]; canWrite: boolean; revision: number }
}

export type PurchaseOrderClassificationUpdate = { current: string[]; revision: number }

export type PurchaseOrderEditLine = {
  id: number | null
  productCode: string
  quantity: number
  unit: string
  discount: number
  price: number
  branch: number
  pieces: string
}

export type PurchaseOrderEditor = {
  id: number
  number: string
  revision: number
  legacyVersion: string
  canWrite: boolean
  priceLocked: boolean
  supplierUnits: boolean
  reason: string
  lines: Array<PurchaseOrderEditLine & { description: string; factor: number }>
}

export type PurchaseOrderEdit = {
  revision: number
  legacyVersion: string
  removeZero: boolean
  lines: PurchaseOrderEditLine[]
}

export type PurchaseOrderRemoveInput = {
  number: string
  revision: number
  legacyVersion: string
}

export type PurchaseOrderRemoval = PurchaseOrderRemoveInput & {
  id: number
  supplier: PurchaseOrder["supplier"]
  canRemove: boolean
  reason: string
}

export type PurchaseOrderRemovalResult = {
  id: number
  number: string
  replacement: PurchaseOrder | null
}

export type PurchaseOrderConfirmationMode = "confirm" | "unconfirm"

export type PurchaseOrderConfirmation = {
  id: number
  number: string
  revision: number
  legacyVersion: string
  hasAssignments: boolean
  canWrite: boolean
  reason: string
}

export type PurchaseOrderEditProduct = {
  code: string
  description: string
  defaultUnit: string
  eligible: boolean
  taxable: boolean
  exciseTaxPercentage: number
  units: Array<{ code: string; factor: number; suggestedPrice: number | null }>
}

export type PurchaseOrderCreateDefaults = {
  movement: string
  today: string
  from: string
  dueAt: string
  warehouse: string
  warehouses: PurchaseOrderWarehouse[]
  selectWarehouse: boolean
  taxPercentage: number
  discountLocked: boolean
  maxLines: number
  canWrite: boolean
}

export type PurchaseOrderWarehouse = { code: string; description: string }

export type PurchaseOrderCreateSupplier = PurchaseOrder["supplier"] & {
  terms: number
  taxType: number
  taxPercentage: number
  agent: string
  discountPercentages: [number, number, number]
  currencyId: number
  currencyName: string
  priceLocked: boolean
  supplierUnits: boolean
}

export type PurchaseOrderCreateInput = {
  requestKey: string
  supplierCode: string
  supplierOrderNumber: string
  orderedAt: string
  from: string
  dueAt: string
  warehouse: string
  agent: string
  discountPercentages: [number, number, number]
  taxPercentage: number
  freight: number
  insurance: number
  other: number
  otherLabel: string
  onAccount: number
  lines: PurchaseOrderEditLine[]
}

export type PurchaseOrderColorSizeGroup = {
  root: string
  description: string
  ordered: number
  fulfilled: number
  remaining: number
  sizes: string[]
  colors: Array<{ color: string; ordered: number[]; fulfilled: number[]; remaining: number[] }>
}

export type PurchaseOrderAction = {
  key: string
  label: string
  panelKey?: PurchaseOrderPanelKey
}
