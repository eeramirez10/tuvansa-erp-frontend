import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import { apiClient } from "@/shared/api/api-client"

type PurchaseOrderColorSizeChangeCell = {
  lineId: number
  productCode: string
  root: string
  color: string
  size: string
  quantity: number
  fulfilled: number
}

type PurchaseOrderColorSizeChangeInput = {
  lineId: number
  quantity: number
  revision: number
  legacyVersion: string
}

type PurchaseOrderColorSizeEditor = Pick<PurchaseOrderColorSizeChangeInput, "revision" | "legacyVersion"> & {
  id: number
  number: string
  cells: PurchaseOrderColorSizeChangeCell[]
  canWrite: boolean
  reason: string
}

export async function getPurchaseOrderColorSizeEditor(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<{ data: PurchaseOrderColorSizeEditor }>(
    `/purchasing/purchase-orders/${id}/actions/ct/editor`,
    { signal },
  )
  return response.data.data
}

export async function changePurchaseOrderColorSize(id: number, data: PurchaseOrderColorSizeChangeInput) {
  const response = await apiClient.patch<{ data: PurchaseOrder }>(
    `/purchasing/purchase-orders/${id}/actions/ct`,
    data,
  )
  return response.data.data
}
