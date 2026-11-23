import { queryOptions } from "@tanstack/react-query"
import { getGeneralExpensesPreview, lookupGeneralExpensesCatalog } from "@/features/purchasing/purchase-receptions/services/general-expenses-service"
import type { PurchaseReceptionPanelKey } from "@/features/purchasing/purchase-receptions/model"
import {
  getPurchaseReception,
  getPurchaseReceptionPanel,
  searchPurchaseReceptions,
  type PurchaseReceptionSearchCriteria,
} from "@/features/purchasing/purchase-receptions/services/purchase-reception-service"

export const purchaseReceptionKeys = {
  all: ["purchasing", "purchase-receptions"] as const,
  detail: (id: number) => [...purchaseReceptionKeys.all, "detail", id] as const,
  search: (criteria: PurchaseReceptionSearchCriteria) => [...purchaseReceptionKeys.all, "search", criteria] as const,
  panel: (id: number, key: PurchaseReceptionPanelKey) => [...purchaseReceptionKeys.detail(id), "panel", key] as const,
  expenseCancellation: (id: number) => [...purchaseReceptionKeys.detail(id), "cancel-expense"] as const,
}

export const purchaseReceptionQueryOptions = (id: number) => queryOptions({
  queryKey: purchaseReceptionKeys.detail(id),
  queryFn: ({ signal }) => getPurchaseReception(id, signal),
})

export const purchaseReceptionSearchQueryOptions = (criteria: PurchaseReceptionSearchCriteria) => queryOptions({
  queryKey: purchaseReceptionKeys.search(criteria),
  queryFn: ({ signal }) => searchPurchaseReceptions(criteria, signal),
})

export const purchaseReceptionPanelQueryOptions = (id: number, key: PurchaseReceptionPanelKey) => queryOptions({
  queryKey: purchaseReceptionKeys.panel(id, key),
  queryFn: ({ signal }) => getPurchaseReceptionPanel(id, key, signal),
})

export const generalExpensesPreviewQueryOptions = () => queryOptions({
  queryKey: [...purchaseReceptionKeys.all, "general-expenses", "create"],
  queryFn: ({ signal }) => getGeneralExpensesPreview(signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
  retry: false,
})

export const generalExpensesCatalogQueryOptions = (field: "supplierCode" | "productCode", code: string) => queryOptions({
  queryKey: [...purchaseReceptionKeys.all, "general-expenses", "catalog", field, code],
  queryFn: ({ signal }) => lookupGeneralExpensesCatalog(field, code, signal),
  enabled: code.length > 0,
  staleTime: 60_000,
  retry: false,
})
