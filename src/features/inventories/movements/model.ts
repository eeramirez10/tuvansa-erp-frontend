export const movementWindowId = "inventory:movements"
export const movementSearchWindowId = "inventory:movements:search"

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
}

export type InventoryMovement = {
  header: InventoryMovementHeader
  lines: InventoryMovementLine[]
  totals: { quantity: number; cost: number; entries?: number; exits?: number }
  cancellationAvailable: boolean
  cancellationReason?: string
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
