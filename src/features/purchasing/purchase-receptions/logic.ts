import { queryOptions } from "@tanstack/react-query"
import { getGeneralExpensesPreview, lookupGeneralExpensesCatalog } from "@/features/purchasing/purchase-receptions/services/general-expenses-service"
import { getPurchaseReceptionPedimentoReport } from "@/features/purchasing/purchase-receptions/services/purchase-reception-pedimento-report-service"
import type { PurchaseReceptionCancellationKind, PurchaseReceptionPanelKey, PurchaseReceptionSupplierSearch } from "@/features/purchasing/purchase-receptions/model"
import {
  getPurchaseReception,
  getPurchaseReceptionComments,
  getPurchaseReceptionDocumenting,
  getPurchaseReceptionPanel,
  getPurchaseReceptionPieceLine,
  getPurchaseReceptionSupplierChange,
  searchPurchaseReceptions,
  type PurchaseReceptionSearchCriteria,
} from "@/features/purchasing/purchase-receptions/services/purchase-reception-service"

export const purchaseReceptionKeys = {
  all: ["purchasing", "purchase-receptions"] as const,
  detail: (id: number) => [...purchaseReceptionKeys.all, "detail", id] as const,
  supplierChange: (id: number) => [...purchaseReceptionKeys.detail(id), "change-supplier"] as const,
  supplierChoices: (id: number, filters: PurchaseReceptionSupplierSearch) => [...purchaseReceptionKeys.supplierChange(id), "suppliers", filters] as const,
  comments: (id: number) => [...purchaseReceptionKeys.detail(id), "comments"] as const,
  documenting: (id: number) => [...purchaseReceptionKeys.detail(id), "documenting"] as const,
  search: (criteria: PurchaseReceptionSearchCriteria) => [...purchaseReceptionKeys.all, "search", criteria] as const,
  panel: (id: number, key: PurchaseReceptionPanelKey) => [...purchaseReceptionKeys.detail(id), "panel", key] as const,
  pedimentoReport: (id: number) => [...purchaseReceptionKeys.detail(id), "pedimento-report"] as const,
  pieceLine: (id: number, lineId: number) => [...purchaseReceptionKeys.detail(id), "piece-line", lineId] as const,
  cancellation: (id: number, kind: PurchaseReceptionCancellationKind) => [...purchaseReceptionKeys.detail(id), `cancel-${kind}`] as const,
}

export const purchaseReceptionQueryOptions = (id: number) => queryOptions({
  queryKey: purchaseReceptionKeys.detail(id),
  queryFn: ({ signal }) => getPurchaseReception(id, signal),
})

export const purchaseReceptionSupplierChangeQueryOptions = (id: number) => queryOptions({
  queryKey: purchaseReceptionKeys.supplierChange(id),
  queryFn: ({ signal }) => getPurchaseReceptionSupplierChange(id, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
  retry: false,
})

export const purchaseReceptionCommentsQueryOptions = (id: number) => queryOptions({
  queryKey: purchaseReceptionKeys.comments(id),
  queryFn: ({ signal }) => getPurchaseReceptionComments(id, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
  retry: false,
})

export const purchaseReceptionDocumentingQueryOptions = (id: number) => queryOptions({
  queryKey: purchaseReceptionKeys.documenting(id),
  queryFn: ({ signal }) => getPurchaseReceptionDocumenting(id, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
  retry: false,
})

export const purchaseReceptionSearchQueryOptions = (criteria: PurchaseReceptionSearchCriteria) => queryOptions({
  queryKey: purchaseReceptionKeys.search(criteria),
  queryFn: ({ signal }) => searchPurchaseReceptions(criteria, signal),
})

export const purchaseReceptionPanelQueryOptions = (id: number, key: PurchaseReceptionPanelKey) => queryOptions({
  queryKey: purchaseReceptionKeys.panel(id, key),
  queryFn: ({ signal }) => getPurchaseReceptionPanel(id, key, signal),
})

export const purchaseReceptionPedimentoReportQueryOptions = (id: number) => queryOptions({
  queryKey: purchaseReceptionKeys.pedimentoReport(id),
  queryFn: ({ signal }) => getPurchaseReceptionPedimentoReport(id, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
  retry: false,
})

export const purchaseReceptionPieceLineQueryOptions = (id: number, lineId: number) => queryOptions({
  queryKey: purchaseReceptionKeys.pieceLine(id, lineId),
  queryFn: ({ signal }) => getPurchaseReceptionPieceLine(id, lineId, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
  retry: false,
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
