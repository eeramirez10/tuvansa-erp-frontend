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
    cells: measure === "value" ? group.valueByWarehouse : group.byWarehouse.map(cell => ({ warehouse: cell.warehouse, amount: cell.quantity, percentage: cell.percentage })),
    amount: measure === "value" ? group.valuation.reported : group.meters.quantity,
    percentage: measure === "value" ? group.valuationPercentage : group.percentage })),
    totals: measure === "value" ? report.valuationTotals : report.meterTotals.map(cell => ({ warehouse: cell.warehouse, amount: cell.quantity, percentage: cell.percentage })),
    total: measure === "value" ? report.valuation.reported : report.meters.quantity }
}
