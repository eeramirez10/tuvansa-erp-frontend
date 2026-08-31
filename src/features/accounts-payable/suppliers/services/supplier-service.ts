import { apiClient } from "@/shared/api/api-client"
import type {
  Supplier,
  SupplierClassificationsResponse,
  SupplierPanelDefinition,
  SupplierPanelResponse,
  SupplierSearchResponse,
} from "@/features/accounts-payable/suppliers/model"

type ItemResponse<T> = { data: T }

export type SupplierSearchCriteria = {
  q?: string
  status?: "active" | "inactive" | "all"
  page?: number
  pageSize?: number
}

export async function searchSuppliers(criteria: SupplierSearchCriteria, signal?: AbortSignal) {
  const response = await apiClient.get<SupplierSearchResponse>("/accounts-payable/suppliers", {
    params: criteria,
    signal,
  })
  return response.data
}

export async function getSupplier(supplierId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<Supplier>>(
    `/accounts-payable/suppliers/${supplierId}`,
    { signal },
  )
  return response.data.data
}

export async function getFirstSupplier(signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<Supplier>>(
    "/accounts-payable/suppliers/first",
    { signal },
  )
  return response.data.data
}

export async function getAdjacentSupplier(
  supplierId: number,
  direction: "previous" | "next",
) {
  const response = await apiClient.get<ItemResponse<Supplier | null>>(
    `/accounts-payable/suppliers/${supplierId}/${direction}`,
  )
  return response.data.data
}

export async function getSupplierPanel(
  supplierId: number,
  panel: SupplierPanelDefinition,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<SupplierPanelResponse>(
    `/accounts-payable/suppliers/${supplierId}/${panel.path}`,
    { signal },
  )
  return response.data
}

export async function getSupplierClassifications(
  supplierId: number,
  position: number,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<SupplierClassificationsResponse>(
    `/accounts-payable/suppliers/${supplierId}/actions/classifications`,
    { params: { position }, signal },
  )
  return response.data
}
