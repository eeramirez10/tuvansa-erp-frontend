export type InventoryCriteria = { asOf: string; warehouse: string; family: string }
export type InventoryOptions = {
  company: string; defaultDate: string; defaultWarehouse: string
  warehouses: Array<{ code: string; name: string }>
  families: Array<{ code: string; name: string }>
}
export type InventoryProductBalance = {
  productId: number; code: string; description: string; family: string; familyName: string; warehouse: string
  unitId: number; unit: string; incoming: number; outgoing: number; quantity: number
  firstDate: string | null; lastDate: string | null; movements: number; undatedMovements: number; undatedQuantity: number
}
export type InventoryTotals = {
  unitId: number; unit: string; incoming: number; outgoing: number; quantity: number; undatedMovements: number; undatedQuantity: number
}
export type InventoryMeters = { incoming: number; outgoing: number; quantity: number; undatedQuantity: number }
export type ConvertedInventoryProduct = InventoryProductBalance & { metersPerUnit: number | null; meters: InventoryMeters | null }
export type InventoryMeterCell = InventoryMeters & { warehouse: string; percentage: number | null }
export type InventoryByFamily = {
  title: string; company: string; criteria: InventoryCriteria; warehouseName: string; generatedAt: string
  groups: Array<{ code: string; name: string; products: ConvertedInventoryProduct[]; totals: InventoryTotals[]; meters: InventoryMeters; byWarehouse: InventoryMeterCell[]; percentage: number | null; unconverted: InventoryTotals[] }>
  totals: InventoryTotals[]; empty: boolean; provisional: boolean; undatedMovements: number; notes: string[]; source: "derivada"
  meters: InventoryMeters; meterColumns: Array<{ warehouse: string; name: string }>; meterTotals: InventoryMeterCell[]; unconverted: InventoryTotals[]
}
