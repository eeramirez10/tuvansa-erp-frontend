import { queryOptions } from "@tanstack/react-query"
import type { InventoryCriteria } from "@/features/inventories/reports/model"
import { getInventoryByFamily, getInventoryReportOptions } from "@/features/inventories/reports/services/inventory-reports-service"

export const inventoryReportOptionsQuery = () => queryOptions({
  queryKey: ["inventories", "reports", "by-family", "options"], queryFn: ({ signal }) => getInventoryReportOptions(signal), staleTime: 0,
})
export const inventoryByFamilyQuery = (criteria: InventoryCriteria) => queryOptions({
  queryKey: ["inventories", "reports", "by-family", criteria], queryFn: ({ signal }) => getInventoryByFamily(criteria, signal), staleTime: 0, retry: false,
})
export const inventoryQuantity = (value: number) => value.toLocaleString("es-MX", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
export const inventoryDate = (value: string | null) => value ? value.split("-").reverse().join("/") : "—"
