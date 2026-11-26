import { apiClient } from "@/shared/api/api-client"
import type {
  Order, OrderCommentsUpdateInput, OrderDuplicatePreview, OrderMutationInput, OrderPanel, OrderPanelKey, OrderSearchResponse,
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
export async function getOrderByNumber(orderNumber: string, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<Order>>(
    `/sales/orders/by-number/${encodeURIComponent(orderNumber)}`,
    { signal },
  )
  return response.data.data
}
export async function getAdjacentOrder(orderId: number, direction: "previous" | "next") {
  const response = await apiClient.get<ItemResponse<Order | null>>(`/sales/orders/${orderId}/${direction}`)
  return response.data.data
}
export async function getOrdersForPrint(current: Pick<Order, "id" | "number">, from: string, to: string) {
  const lower = from.trim().toUpperCase()
  const upper = to.trim().toUpperCase()
  if (!lower || !upper || lower.localeCompare(upper, "en") > 0) {
    throw new Error("Indica un rango válido de folios.")
  }
  const lookup = (number: string) => number === current.number.toUpperCase()
    ? getOrder(current.id) : getOrderByNumber(number)

  const first = await lookup(lower)
  if (lower === upper) return [first]
  const last = await lookup(upper)
  const orders = [first]
  const seen = new Set([first.id])
  let order = first
  while (order.id !== last.id) {
    const next = await getAdjacentOrder(order.id, "next")
    if (!next || seen.has(next.id) || next.number.toUpperCase().localeCompare(upper, "en") > 0) {
      throw new Error("El rango de pedidos cambió. Vuelve a consultar los folios.")
    }
    orders.push(next)
    seen.add(next.id)
    order = next
  }
  return orders
}
export async function getOrderPanel(orderId: number, key: OrderPanelKey, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<OrderPanel>>(
    `/sales/orders/${orderId}/${panelPaths[key]}`, { signal },
  )
  return response.data
}
export async function getOrderDuplicatePreview(orderId: number, companyId: number, signal?: AbortSignal) {
  return (await apiClient.get<ItemResponse<OrderDuplicatePreview>>(`/sales/orders/${orderId}/actions/duplicate`, {
    params: { companyId }, signal,
  })).data.data
}
export async function duplicateOrder(orderId: number, companyId: number, input: { requestKey: string; revision: string; orderedAt: string }) {
  return (await apiClient.post<ItemResponse<Order>>(`/sales/orders/${orderId}/actions/duplicate`, input, {
    params: { companyId },
  })).data.data
}
export async function createOrder(input: OrderMutationInput) {
  const response = await apiClient.post<ItemResponse<Order>>("/sales/orders", input)
  return response.data.data
}
export async function updateOrder(orderId: number, input: OrderMutationInput) {
  const response = await apiClient.patch<ItemResponse<Order>>(`/sales/orders/${orderId}`, input)
  return response.data.data
}
export async function updateOrderComments(orderId: number, input: OrderCommentsUpdateInput) {
  const response = await apiClient.patch<ItemResponse<Order>>(`/sales/orders/${orderId}/actions/comments`, input)
  return response.data.data
}
export async function deleteOrder(orderId: number) { await apiClient.delete(`/sales/orders/${orderId}`) }
