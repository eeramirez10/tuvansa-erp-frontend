import { apiClient } from "@/shared/api/api-client"
import type { PostingReversal, PostingReversalInput, PostingReversalPreview } from "@/features/accounts-payable/posting-reversal-model"
import type {
  Supplier,
  SupplierClassificationsResponse,
  SupplierPanelDefinition,
  SupplierPanelResponse,
  SupplierPayment,
  SupplierPaymentInput,
  SupplierPaymentPreview,
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

const supplierPaymentPath = (supplierId: number, receiptId: number) =>
  `/accounts-payable/suppliers/${supplierId}/payments/${receiptId}`

export async function getSupplierPaymentPreview(supplierId: number, receiptId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<SupplierPaymentPreview>>(
    supplierPaymentPath(supplierId, receiptId),
    { signal },
  )
  return response.data.data
}

export async function recordSupplierPayment(supplierId: number, receiptId: number, input: SupplierPaymentInput) {
  const response = await apiClient.post<ItemResponse<SupplierPayment>>(
    supplierPaymentPath(supplierId, receiptId),
    input,
  )
  return response.data.data
}

const supplierPaymentReversalPath = (supplierId: number, paymentId: number) =>
  `${supplierPaymentPath(supplierId, paymentId)}/reversal`

export async function getSupplierPaymentReversalPreview(supplierId: number, paymentId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PostingReversalPreview>>(
    supplierPaymentReversalPath(supplierId, paymentId),
    { signal },
  )
  return response.data.data
}

export async function reverseSupplierPayment(supplierId: number, paymentId: number, input: PostingReversalInput) {
  const response = await apiClient.post<ItemResponse<PostingReversal>>(
    supplierPaymentReversalPath(supplierId, paymentId),
    input,
  )
  return response.data.data
}
