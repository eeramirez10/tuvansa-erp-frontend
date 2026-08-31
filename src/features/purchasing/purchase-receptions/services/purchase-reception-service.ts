import type {
  PurchaseReception,
  PurchaseReceptionPanel,
  PurchaseReceptionPanelKey,
  PurchaseReceptionSearchResponse,
} from "@/features/purchasing/purchase-receptions/model"
import { apiClient } from "@/shared/api/api-client"

type ItemResponse<T> = { data: T }

export type PurchaseReceptionSearchCriteria = {
  q?: string
  documentNumber?: string
  receivedAt?: string
  orderNumber?: string
  supplierReference?: string
  deliveryNote?: string
  folio?: string
  supplierCode?: string
  warehouse?: string
  page?: number
  pageSize?: number
}

const panelPaths: Record<PurchaseReceptionPanelKey, string> = {
  auxiliary: "actions/auxiliary",
  classifications: "actions/classifications",
}

export async function searchPurchaseReceptions(criteria: PurchaseReceptionSearchCriteria, signal?: AbortSignal) {
  const response = await apiClient.get<PurchaseReceptionSearchResponse>("/purchasing/purchase-receptions", { params: criteria, signal })
  return response.data
}

export async function getPurchaseReception(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PurchaseReception>>(`/purchasing/purchase-receptions/${id}`, { signal })
  return response.data.data
}

export async function getAdjacentPurchaseReception(id: number, direction: "previous" | "next") {
  const response = await apiClient.get<ItemResponse<PurchaseReception | null>>(`/purchasing/purchase-receptions/${id}/${direction}`)
  return response.data.data
}

export async function getPurchaseReceptionPanel(id: number, key: PurchaseReceptionPanelKey, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PurchaseReceptionPanel>>(
    `/purchasing/purchase-receptions/${id}/${panelPaths[key]}`,
    { signal },
  )
  return response.data.data
}
