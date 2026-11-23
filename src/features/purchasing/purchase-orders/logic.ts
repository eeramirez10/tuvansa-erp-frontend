import { queryOptions, type QueryClient } from "@tanstack/react-query"
import type { PurchaseOrder, PurchaseOrderPanelKey, PurchaseOrderSupplierSearch } from "@/features/purchasing/purchase-orders/model"
import {
  getPurchaseOrder,
  getPurchaseOrderAuthorization,
  getPurchaseOrderConfirmation,
  getPurchaseOrderEditor,
  getPurchaseOrderPanel,
  getPurchaseOrderRemoval,
  getPurchaseOrderSupplierAction,
  searchAuthorizationSuppliers,
  searchPurchaseOrders,
  type PurchaseOrderSearchCriteria,
} from "@/features/purchasing/purchase-orders/services/purchase-order-service"

export const purchaseOrderKeys = {
  all: ["purchasing", "purchase-orders"] as const,
  detail: (id: number) => [...purchaseOrderKeys.all, "detail", id] as const,
  searches: () => [...purchaseOrderKeys.all, "search"] as const,
  search: (criteria: PurchaseOrderSearchCriteria) => [...purchaseOrderKeys.searches(), criteria] as const,
  panel: (id: number, key: PurchaseOrderPanelKey) => [...purchaseOrderKeys.detail(id), "panel", key] as const,
  editor: (id: number) => [...purchaseOrderKeys.detail(id), "edit"] as const,
  removal: (id: number) => [...purchaseOrderKeys.detail(id), "removal"] as const,
  confirmation: (id: number) => [...purchaseOrderKeys.detail(id), "confirmation"] as const,
  authorization: (id: number) => [...purchaseOrderKeys.detail(id), "authorization"] as const,
  supplierAction: (id: number) => [...purchaseOrderKeys.detail(id), "supplier-action"] as const,
  authorizationSuppliers: (filters: PurchaseOrderSupplierSearch) => [...purchaseOrderKeys.all, "authorization", "suppliers", filters] as const,
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

export const purchaseOrderEditorQueryOptions = (id: number) => queryOptions({
  queryKey: purchaseOrderKeys.editor(id),
  queryFn: ({ signal }) => getPurchaseOrderEditor(id, signal),
  refetchOnMount: "always",
})

export const purchaseOrderRemovalQueryOptions = (id: number) => queryOptions({
  queryKey: purchaseOrderKeys.removal(id),
  queryFn: ({ signal }) => getPurchaseOrderRemoval(id, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
})

export const purchaseOrderConfirmationQueryOptions = (id: number) => queryOptions({
  queryKey: purchaseOrderKeys.confirmation(id),
  queryFn: ({ signal }) => getPurchaseOrderConfirmation(id, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
})

export const purchaseOrderAuthorizationQueryOptions = (id: number) => queryOptions({
  queryKey: purchaseOrderKeys.authorization(id),
  queryFn: ({ signal }) => getPurchaseOrderAuthorization(id, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
})

export const purchaseOrderAuthorizationSupplierQueryOptions = (filters: PurchaseOrderSupplierSearch) => queryOptions({
  queryKey: purchaseOrderKeys.authorizationSuppliers(filters),
  queryFn: ({ signal }) => searchAuthorizationSuppliers(filters, signal),
  enabled: Boolean(filters.code || filters.name),
})

export const purchaseOrderSupplierActionQueryOptions = (id: number) => queryOptions({
  queryKey: purchaseOrderKeys.supplierAction(id),
  queryFn: ({ signal }) => getPurchaseOrderSupplierAction(id, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
})

export async function refreshPurchaseOrder(queryClient: QueryClient, order: PurchaseOrder) {
  const detail = purchaseOrderKeys.detail(order.id)
  await queryClient.cancelQueries({ queryKey: detail })
  queryClient.setQueryData(detail, order)
  await queryClient.invalidateQueries({ queryKey: detail, predicate: (entry) => entry.queryKey.length > detail.length })
  void queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.searches() })
}
