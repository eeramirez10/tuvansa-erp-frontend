import { apiClient } from "@/shared/api/api-client"
import type { InventoryByFamily, InventoryCriteria, InventoryOptions } from "@/features/inventories/reports/model"

export async function getInventoryReportOptions(signal?: AbortSignal) {
  return (await apiClient.get<{ data: InventoryOptions }>("/inventories/reports/by-family/options", { signal })).data.data
}
export async function getInventoryByFamily(criteria: InventoryCriteria, signal?: AbortSignal) {
  return (await apiClient.get<{ data: InventoryByFamily }>("/inventories/reports/by-family", { params: criteria, signal, timeout: 45_000 })).data.data
}
