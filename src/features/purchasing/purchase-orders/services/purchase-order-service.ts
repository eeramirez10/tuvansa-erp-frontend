import type {
  PurchaseOrder,
  PurchaseOrderClassificationPanel,
  PurchaseOrderClassificationUpdate,
  PurchaseOrderEdit,
  PurchaseOrderEditor,
  PurchaseOrderEditProduct,
  PurchaseOrderPanel,
  PurchaseOrderPanelKey,
  PurchaseOrderSearchResponse,
} from "@/features/purchasing/purchase-orders/model"
import { apiClient } from "@/shared/api/api-client"

type ItemResponse<T> = { data: T }

export type PurchaseOrderSearchCriteria = {
  q?: string
  orderNumber?: string
  supplierOrderNumber?: string
  supplierCode?: string
  orderedAt?: string
  dueAt?: string
  agent?: string
  documentType?: number
  page?: number
  pageSize?: number
}

const panelPaths: Record<PurchaseOrderPanelKey, string> = {
  receipts: "actions/auxiliar",
  classifications: "actions/classifications",
  comments: "actions/comments",
  ct: "actions/ct",
  pieces: "actions/pieces",
}

export async function searchPurchaseOrders(criteria: PurchaseOrderSearchCriteria, signal?: AbortSignal) {
  const response = await apiClient.get<PurchaseOrderSearchResponse>("/purchasing/purchase-orders", { params: criteria, signal })
  return response.data
}

export async function getPurchaseOrder(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PurchaseOrder>>(`/purchasing/purchase-orders/${id}`, { signal })
  return response.data.data
}

export async function getAdjacentPurchaseOrder(id: number, direction: "previous" | "next") {
  const response = await apiClient.get<ItemResponse<PurchaseOrder | null>>(`/purchasing/purchase-orders/${id}/${direction}`)
  return response.data.data
}

export async function getPurchaseOrderPanel(id: number, key: PurchaseOrderPanelKey, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PurchaseOrderPanel>>(
    `/purchasing/purchase-orders/${id}/${panelPaths[key]}`,
    { signal },
  )
  return response.data.data
}

export async function updatePurchaseOrderClassifications(id: number, update: PurchaseOrderClassificationUpdate) {
  const response = await apiClient.patch<ItemResponse<PurchaseOrderClassificationPanel>>(
    `/purchasing/purchase-orders/${id}/${panelPaths.classifications}`,
    update,
  )
  return response.data.data
}

export async function getPurchaseOrderEditor(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PurchaseOrderEditor>>(`/purchasing/purchase-orders/${id}/edit`, { signal })
  return response.data.data
}

export async function searchPurchaseOrderEditProducts(id: number, query: string, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PurchaseOrderEditProduct[]>>(
    `/purchasing/purchase-orders/${id}/edit/products`, { params: { q: query }, signal },
  )
  return response.data.data
}

export async function editPurchaseOrder(id: number, edit: PurchaseOrderEdit) {
  const response = await apiClient.patch<ItemResponse<PurchaseOrder>>(`/purchasing/purchase-orders/${id}`, edit)
  return response.data.data
}
