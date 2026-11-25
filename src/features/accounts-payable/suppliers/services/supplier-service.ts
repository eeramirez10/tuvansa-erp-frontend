import { apiClient } from "@/shared/api/api-client"
import { isApiNotFound } from "@/shared/api/api-error"
import type { PostingReversal, PostingReversalInput, PostingReversalPreview } from "@/features/accounts-payable/posting-reversal-model"
import type {
  Supplier,
  SupplierCatalogFields,
  SupplierClassificationsResponse,
  SupplierClassificationUpdate,
  SupplierActivityCommand,
  SupplierActivityItem,
  SupplierActivityKind,
  SupplierVariousUpdate,
  SupplierCreatePreview,
  SupplierEditPreview,
  SupplierPanelDefinition,
  SupplierPanelResponse,
  SupplierGroupingInput,
  SupplierGroupingResult,
  SupplierPayment,
  SupplierPaymentInput,
  SupplierPaymentPreview,
  SupplierSearchResponse,
} from "@/features/accounts-payable/suppliers/model"

type ItemResponse<T> = { data: T }

export async function groupSupplierBalance(supplierId: number, input: SupplierGroupingInput) {
  const response = await apiClient.post<ItemResponse<SupplierGroupingResult>>(`/accounts-payable/suppliers/${supplierId}/balance/grouping`, input)
  return response.data.data
}

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
  try {
    const response = await apiClient.get<ItemResponse<Supplier | null>>(
      "/accounts-payable/suppliers/first",
      { signal },
    )
    return response.data.data
  } catch (error) {
    if (isApiNotFound(error)) return null
    throw error
  }
}

const supplierPath = "/accounts-payable/suppliers"

export async function getSupplierCreatePreview(signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<SupplierCreatePreview>>(`${supplierPath}/create`, { signal })
  return response.data.data
}

export async function getSupplierEditPreview(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<SupplierEditPreview>>(`${supplierPath}/${id}/edit`, { signal })
  return response.data.data
}

export async function createSupplier(requestKey: string, fields: SupplierCatalogFields) {
  const response = await apiClient.post<ItemResponse<Supplier>>(supplierPath, { requestKey, fields })
  return response.data.data
}

export async function updateSupplier(id: number, revision: string, fields: SupplierCatalogFields) {
  const response = await apiClient.patch<ItemResponse<Supplier>>(`${supplierPath}/${id}`, { revision, fields })
  return response.data.data
}

export async function removeSupplier(id: number, revision: string) {
  await apiClient.delete(`${supplierPath}/${id}`, { data: { revision, confirmed: true } })
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

export async function saveSupplierClassifications(supplierId: number, input: SupplierClassificationUpdate) {
  await apiClient.patch(`/accounts-payable/suppliers/${supplierId}/actions/classifications`, input)
}

export async function saveSupplierVarious(supplierId: number, input: SupplierVariousUpdate) {
  await apiClient.patch(`/accounts-payable/suppliers/${supplierId}/actions/various`, input)
}

export async function saveSupplierActivity(supplierId: number, kind: SupplierActivityKind, input: SupplierActivityCommand) {
  const url = `/accounts-payable/suppliers/${supplierId}/actions/${kind}`
  const { operation, id, requestKey, revision, fields } = input
  if (operation === "remove") {
    await apiClient.delete(`${url}/${id}`, { data: { requestKey, revision, confirmed: true } })
    return undefined
  }
  const response = operation === "create"
    ? await apiClient.post<ItemResponse<SupplierActivityItem>>(url, { requestKey, fields })
    : await apiClient.patch<ItemResponse<SupplierActivityItem>>(`${url}/${id}`, { requestKey, revision, fields })
  return response.data.data
}

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
