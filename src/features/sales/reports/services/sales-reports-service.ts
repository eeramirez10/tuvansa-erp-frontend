import { apiClient } from "@/shared/api/api-client"
import type { SalesByFamily, SalesCriteria, SalesOptions } from "@/features/sales/reports/model"
export async function getSalesReportOptions(signal?: AbortSignal) {
  return (await apiClient.get<{ data: SalesOptions }>("/sales/reports/by-family/options", { signal })).data.data
}
export async function getSalesByFamily(criteria: SalesCriteria, signal?: AbortSignal) {
  return (await apiClient.get<{ data: SalesByFamily }>("/sales/reports/by-family", { params: criteria, signal, timeout: 45_000 })).data.data
}
