export const movementWindowId = "inventory:movements"
export const movementSearchWindowId = "inventory:movements:search"
export const movementCaptureWindowId = "inventory:movements:capture"
export const movementPrintWindowId = "inventory:movements:print"
export const isLocalInventoryAdjustment = (id: number) => id >= 7_950_000_000_000 && id <= 7_950_099_999_999

export type InventoryMovementHeader = {
  id: number
  document: string
  date: string | null
  reference: string | null
  reference2: string | null
  warehouse: string | null
  supplierCode: string | null
  customerCode: string | null
  customerName: string | null
  type: string
  status: number
  company: number
  userId: number
  inventoryFlag: number
  billingFlag: number
}

export type InventoryMovementLine = {
  id: number
  productCode: string
  description: string
  quantity: number
  unit: string
  cost: number
  pieces: number
  piecesText?: string
  warehouse: string
  type: string
  lotId?: number
  lotWarehouse?: string
}

export type InventoryMovement = {
  header: InventoryMovementHeader
  lines: InventoryMovementLine[]
  totals: { quantity: number; cost: number; entries?: number; exits?: number }
  comment?: string
  cancellationAvailable: boolean
  cancellationReason?: string
}

export type InventoryMovementPrint = {
  format: "QTUVANSA007" | "QTUVANSA002"
  type: "EI" | "SI" | "TR"
  document: string
  date: string
  reference: string
  warehouse: string
  sourceWarehouse?: string
  warehouseName: string
  companyName: string
  place: string
  comment: string
  lines: Array<{
    id: number
    productCode: string
    description: string
    warehouse?: string
    quantity: number
    cost: number
    amount: number
    customs: { entry: string; date: string | null; office: string } | null
  }>
  total: number
}

export type MovementCaptureType = "EI" | "SI" | "TR"

export type MovementCaptureOptions = {
  writable: boolean
  reason: string | null
  automaticPeps?: boolean
  defaultDate: string
  defaultWarehouse: string
  types: Array<{ code: MovementCaptureType; name: string; sign: 1 | 0 | -1 }>
  warehouses: Array<{ code: string; name: string }>
}

export type MovementCaptureInput = {
  requestKey: string
  type: MovementCaptureType
  date: string
  warehouse: string
  destinationWarehouse?: string
  reference?: string
  document?: string
  lines: Array<{ productId: number; quantity: number; cost?: number }>
}

export const movementSearchFields = [
  { key: "document", label: "Documento" },
  { key: "date", label: "Fecha" },
  { key: "reference", label: "REF" },
  { key: "reference2", label: "REF2" },
  { key: "warehouse", label: "Almacen" },
  { key: "supplier", label: "Proveedor" },
  { key: "customer", label: "Cliente" },
] as const

export type MovementSearchField = typeof movementSearchFields[number]["key"]
export type MovementSearchCriteria = Partial<Record<MovementSearchField, string>>

export type MovementSearchResponse = {
  data: InventoryMovementHeader[]
  pagination: { page: number; pageSize: number; total: number }
}
