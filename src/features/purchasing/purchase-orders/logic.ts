import { queryOptions } from "@tanstack/react-query"
import type { PurchaseOrder, PurchaseOrderPanelKey } from "@/features/purchasing/purchase-orders/model"
import {
  getPurchaseOrder,
  getPurchaseOrderPanel,
  searchPurchaseOrders,
  type PurchaseOrderSearchCriteria,
} from "@/features/purchasing/purchase-orders/services/purchase-order-service"

export const purchaseOrderKeys = {
  all: ["purchasing", "purchase-orders"] as const,
  detail: (id: number) => [...purchaseOrderKeys.all, "detail", id] as const,
  searches: () => [...purchaseOrderKeys.all, "search"] as const,
  search: (criteria: PurchaseOrderSearchCriteria) => [...purchaseOrderKeys.searches(), criteria] as const,
  panel: (id: number, key: PurchaseOrderPanelKey) => [...purchaseOrderKeys.detail(id), "panel", key] as const,
}

export const displayPurchaseOrderDate = (input: string | null) =>
  input ? input.slice(0, 10).split("-").reverse().join("/") : ""

export const purchaseOrderKindLabel: Record<PurchaseOrder["documentKind"], string> = {
  order: "PEDIDO",
  quote: "COTIZACIÓN",
  unknown: "",
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
