import { apiClient } from "@/shared/api/api-client"
import type { CollectionCommissions, CollectionCriteria, CollectionOptions } from "@/features/sales/commissions/model"
export async function getCollectionOptions(signal?: AbortSignal) {
  const { data } = await apiClient.get<{ data: CollectionOptions }>("/sales/reports/collection-commissions/options", { signal })
  return data.data
}
export async function getCollectionCommissions(criteria: CollectionCriteria, signal?: AbortSignal) {
  const { data } = await apiClient.get<{ data: CollectionCommissions }>("/sales/reports/collection-commissions", { params: criteria, signal, timeout: 60000 })
  return data.data
}
