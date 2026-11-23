import { queryOptions } from "@tanstack/react-query"
import {
  getFirstSupplier,
  getSupplier,
  getSupplierClassifications,
  getSupplierPanel,
  getSupplierPaymentPreview,
  searchSuppliers,
  type SupplierSearchCriteria,
} from "@/features/accounts-payable/suppliers/services/supplier-service"
import type { SupplierPanelDefinition } from "@/features/accounts-payable/suppliers/model"

export const supplierKeys = {
  all: ["accounts-payable", "suppliers"] as const,
  first: () => [...supplierKeys.all, "first"] as const,
  detail: (supplierId: number) => [...supplierKeys.all, "detail", supplierId] as const,
  search: (criteria: SupplierSearchCriteria) => [...supplierKeys.all, "search", criteria] as const,
  panel: (supplierId: number, panelKey: string) => [...supplierKeys.detail(supplierId), "panel", panelKey] as const,
  classifications: (supplierId: number, position: number) => [...supplierKeys.detail(supplierId), "classifications", position] as const,
  payment: (supplierId: number, receiptId: number) => [...supplierKeys.detail(supplierId), "payment", receiptId] as const,
}

export const supplierQueryOptions = (supplierId: number) => queryOptions({
  queryKey: supplierKeys.detail(supplierId),
  queryFn: ({ signal }) => getSupplier(supplierId, signal),
})

export const firstSupplierQueryOptions = () => queryOptions({
  queryKey: supplierKeys.first(),
  queryFn: ({ signal }) => getFirstSupplier(signal),
})

export const supplierSearchQueryOptions = (criteria: SupplierSearchCriteria) => queryOptions({
  queryKey: supplierKeys.search(criteria),
  queryFn: ({ signal }) => searchSuppliers(criteria, signal),
})

export const supplierPanelQueryOptions = (supplierId: number, panel: SupplierPanelDefinition) => queryOptions({
  queryKey: supplierKeys.panel(supplierId, panel.key),
  queryFn: ({ signal }) => getSupplierPanel(supplierId, panel, signal),
})

export const supplierClassificationsQueryOptions = (supplierId: number, position: number) => queryOptions({
  queryKey: supplierKeys.classifications(supplierId, position),
  queryFn: ({ signal }) => getSupplierClassifications(supplierId, position, signal),
  placeholderData: (previousData) => previousData,
})

export const supplierPaymentQueryOptions = (supplierId: number, receiptId: number) => queryOptions({
  queryKey: supplierKeys.payment(supplierId, receiptId),
  queryFn: ({ signal }) => getSupplierPaymentPreview(supplierId, receiptId, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
})

export function supplierBalanceReceiptId(row: Record<string, unknown> | undefined): number | null {
  if (!row || row.canPay === false) return null

  const id = Number(row.receiptId ?? row.id)
  if (!Number.isSafeInteger(id) || id <= 0) return null

  // Older balance responses identify local receptions by their reserved id range.
  return row.canPay === true || (id >= 6_700_000_000_000 && id <= 6_700_099_999_998) ? id : null
}
