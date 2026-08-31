import { queryOptions } from "@tanstack/react-query"
import type { PurchaseOrderPanelKey } from "@/features/purchasing/purchase-orders/model"
import {
  getPurchaseOrder,
  getPurchaseOrderPanel,
  searchPurchaseOrders,
  type PurchaseOrderSearchCriteria,
} from "@/features/purchasing/purchase-orders/services/purchase-order-service"

export const purchaseOrderKeys = {
  all: ["purchasing", "purchase-orders"] as const,
  detail: (id: number) => [...purchaseOrderKeys.all, "detail", id] as const,
  search: (criteria: PurchaseOrderSearchCriteria) => [...purchaseOrderKeys.all, "search", criteria] as const,
  panel: (id: number, key: PurchaseOrderPanelKey) => [...purchaseOrderKeys.detail(id), "panel", key] as const,
}

export const purchaseOrderQueryOptions = (id: number) => queryOptions({
  queryKey: purchaseOrderKeys.detail(id),
  queryFn: ({ signal }) => getPurchaseOrder(id, signal),
})

export const purchaseOrderSearchQueryOptions = (criteria: PurchaseOrderSearchCriteria) => queryOptions({
  queryKey: purchaseOrderKeys.search(criteria),
  queryFn: ({ signal }) => searchPurchaseOrders(criteria, signal),
})

export const purchaseOrderPanelQueryOptions = (id: number, key: PurchaseOrderPanelKey) => queryOptions({
  queryKey: purchaseOrderKeys.panel(id, key),
  queryFn: ({ signal }) => getPurchaseOrderPanel(id, key, signal),
})
