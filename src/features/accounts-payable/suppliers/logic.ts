import { queryOptions } from "@tanstack/react-query"
import {
  getFirstSupplier,
  getSupplier,
  getSupplierClassifications,
  getSupplierPanel,
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
