import { queryOptions } from "@tanstack/react-query"
import type { OrderPanelKey } from "@/features/sales/orders/model"
import { getOrder, getOrderByNumber, getOrderPanel, searchOrders, type OrderSearchCriteria } from "@/features/sales/orders/services/order-service"

export const orderKeys = {
  all: ["sales", "orders"] as const,
  detail: (orderId: number) => [...orderKeys.all, "detail", orderId] as const,
  byNumber: (orderNumber: string) => [...orderKeys.all, "by-number", orderNumber] as const,
  search: (criteria: OrderSearchCriteria) => [...orderKeys.all, "search", criteria] as const,
  panel: (orderId: number, key: OrderPanelKey) => [...orderKeys.detail(orderId), "panel", key] as const,
}
export const orderQueryOptions = (orderId: number) => queryOptions({
  queryKey: orderKeys.detail(orderId), queryFn: ({ signal }) => getOrder(orderId, signal),
})
export const orderByNumberQueryOptions = (orderNumber: string) => queryOptions({
  queryKey: orderKeys.byNumber(orderNumber),
  queryFn: ({ signal }) => getOrderByNumber(orderNumber, signal),
})
export const orderSearchQueryOptions = (criteria: OrderSearchCriteria) => queryOptions({
  queryKey: orderKeys.search(criteria), queryFn: ({ signal }) => searchOrders(criteria, signal),
})
export const orderPanelQueryOptions = (orderId: number, key: OrderPanelKey) => queryOptions({
  queryKey: orderKeys.panel(orderId, key), queryFn: ({ signal }) => getOrderPanel(orderId, key, signal),
})
