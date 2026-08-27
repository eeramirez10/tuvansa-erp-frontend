import { apiClient } from "@/shared/api/api-client"
import type {
  Order, OrderMutationInput, OrderPanel, OrderPanelKey, OrderSearchResponse,
} from "@/features/sales/orders/model"

type ItemResponse<T> = { data: T }
export type OrderSearchCriteria = {
  q?: string; orderNumber?: string; customerOrderNumber?: string
  status?: string; customerCode?: string; orderedAt?: string; dueAt?: string
  agent?: string; branch?: number; warehouse?: string; authorization?: string
  minimumFulfillmentPercentage?: number; from?: string; to?: string
  page?: number; pageSize?: number
}

const panelPaths: Record<OrderPanelKey, string> = {
  "assign-all": "actions/assign-all", authorize: "actions/authorize",
  invoices: "actions/auxiliar", boxes: "actions/boxes",
  classifications: "actions/classifications", comments: "actions/comments",
  "quote-conversion": "actions/quote-conversion", duplicate: "actions/duplicate",
  labels: "actions/labels", print: "actions/print", monarch: "actions/monarch",
  pieces: "actions/pieces", transfer: "actions/transfer",
  "assign-ct": "secondary-actions/assign-ct", consolidate: "secondary-actions/consolidate",
  ct: "secondary-actions/ct", "split-ct": "secondary-actions/split-ct",
  export: "secondary-actions/export", "purchase-order": "secondary-actions/purchase-order",
  split: "secondary-actions/split", branch: "secondary-actions/branch",
  wip: "secondary-actions/wip",
}

export async function searchOrders(criteria: OrderSearchCriteria, signal?: AbortSignal) {
  const response = await apiClient.get<OrderSearchResponse>("/sales/orders", { params: criteria, signal })
  return response.data
}
export async function getOrder(orderId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<Order>>(`/sales/orders/${orderId}`, { signal })
  return response.data.data
}
export async function getAdjacentOrder(orderId: number, direction: "previous" | "next") {
  const response = await apiClient.get<ItemResponse<Order | null>>(`/sales/orders/${orderId}/${direction}`)
  return response.data.data
}
export async function getOrderPanel(orderId: number, key: OrderPanelKey, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<OrderPanel>>(
    `/sales/orders/${orderId}/${panelPaths[key]}`, { signal },
  )
  return response.data
}
export async function createOrder(input: OrderMutationInput) {
  const response = await apiClient.post<ItemResponse<Order>>("/sales/orders", input)
  return response.data.data
}
export async function updateOrder(orderId: number, input: OrderMutationInput) {
  const response = await apiClient.patch<ItemResponse<Order>>(`/sales/orders/${orderId}`, input)
  return response.data.data
}
export async function deleteOrder(orderId: number) { await apiClient.delete(`/sales/orders/${orderId}`) }
