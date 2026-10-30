import { queryOptions } from "@tanstack/react-query"
import type { InventoryByFamily, InventoryCriteria, InventoryMeasure } from "@/features/inventories/reports/model"
import { getInventoryByFamily, getInventoryReportOptions } from "@/features/inventories/reports/services/inventory-reports-service"

export const inventoryReportOptionsQuery = () => queryOptions({
  queryKey: ["inventories", "reports", "by-family", "options"], queryFn: ({ signal }) => getInventoryReportOptions(signal), staleTime: 0,
})
export const inventoryByFamilyQuery = (criteria: InventoryCriteria) => queryOptions({
  queryKey: ["inventories", "reports", "by-family", criteria], queryFn: ({ signal }) => getInventoryByFamily(criteria, signal), staleTime: 0, retry: false,
})
export const inventoryQuantity = (value: number) => value.toLocaleString("es-MX", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
export const inventoryDate = (value: string | null) => value ? value.split("-").reverse().join("/") : "—"
export const inventoryMoney = (value: number) => "$" + value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export function inventoryMatrix(report: InventoryByFamily, measure: InventoryMeasure) {
  return { rows: report.groups.map(group => ({ code: group.code, name: group.name,
    cells: measure === "historical" ? group.historicalByWarehouse : measure === "value" ? group.valueByWarehouse : group.byWarehouse.map(cell => ({ warehouse: cell.warehouse, amount: cell.quantity, percentage: cell.percentage })),
    amount: measure === "historical" ? group.historical.reported : measure === "value" ? group.valuation.reported : group.meters.quantity,
    percentage: measure === "historical" ? group.historicalPercentage : measure === "value" ? group.valuationPercentage : group.percentage })),
    totals: measure === "historical" ? report.historicalTotals : measure === "value" ? report.valuationTotals : report.meterTotals.map(cell => ({ warehouse: cell.warehouse, amount: cell.quantity, percentage: cell.percentage })),
    total: measure === "historical" ? report.historical.reported : measure === "value" ? report.valuation.reported : report.meters.quantity }
}
export const inventoryMeasureLabel = (measure: InventoryMeasure) => measure === "historical" ? "Costo histórico de movimientos (AICOSTO), revaluaciones aparte" : measure === "value" ? "Costo promedio ACTUAL (ILISTA4), moneda base" : "Metros estimados"
