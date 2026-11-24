import type { PurchaseLabelLine, PurchaseOrderLabelType } from "@/features/purchasing/purchase-orders/components/purchase-order-labels"
import { apiClient } from "@/shared/api/api-client"

export async function getPurchaseReceptionLabels(id: number, signal: AbortSignal) {
  const response = await apiClient.get<{ data: { lines: PurchaseLabelLine[]; formats: PurchaseOrderLabelType[] } }>(
    `/purchasing/purchase-receptions/${id}/actions/labels`, { signal },
  )
  return response.data.data
}
