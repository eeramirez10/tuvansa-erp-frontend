import type { PurchaseReceptionPedimentoReport } from "@/features/purchasing/purchase-receptions/model"
import { apiClient } from "@/shared/api/api-client"
import type { ApiItemResponse } from "@/shared/types/api"

export async function getPurchaseReceptionPedimentoReport(id: number, signal: AbortSignal) {
  const { data } = await apiClient.get<ApiItemResponse<PurchaseReceptionPedimentoReport>>(
    `/purchasing/purchase-receptions/${id}/actions/pedimento-report`, { signal },
  )
  return data.data
}
