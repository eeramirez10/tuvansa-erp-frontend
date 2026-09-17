import { apiClient } from "@/shared/api/api-client"
import type { Order } from "@/features/sales/orders/model"
import type { CaptureCustomer, CaptureCustomerMatch, CaptureCustomerSearchCriteria, CaptureInput, CaptureOptions, CaptureProduct } from "@/features/sales/orders/capture-model"

export async function getCaptureOptions(signal?: AbortSignal) {
  return (await apiClient.get<{data: CaptureOptions}>("/sales/orders/capture/options", { signal })).data.data
}
export async function getCaptureCustomer(code: string, signal?: AbortSignal) {
  return (await apiClient.get<{data: CaptureCustomer}>(`/sales/orders/capture/customers/${encodeURIComponent(code)}`, { signal })).data.data
}
export async function searchCaptureCustomers(criteria: CaptureCustomerSearchCriteria, signal?: AbortSignal) {
  const params = {
    ...(criteria.code ? { code: criteria.code } : {}),
    ...(criteria.name ? { name: criteria.name } : {}),
    ...(criteria.taxId ? { taxId: criteria.taxId } : {}),
    limit: 50,
  }
  return (await apiClient.get<{data: CaptureCustomerMatch[]}>("/sales/orders/capture/customers", { params, signal })).data.data
}
export async function getCaptureProduct(code: string, warehouse: string, typeCode: string, customerCode: string, signal?: AbortSignal) {
  return (await apiClient.get<{data: CaptureProduct}>(`/sales/orders/capture/products/${encodeURIComponent(code)}`, { params: { warehouse, typeCode, customerCode }, signal })).data.data
}
export async function saveCapturedOrder(input: CaptureInput) {
  return (await apiClient.post<{data: Order}>("/sales/orders/capture", input)).data.data
}
export async function toggleOrderQuote(id: number) {
  return (await apiClient.post<{data: Order}>(`/sales/orders/${id}/actions/quote-conversion`, {})).data.data
}
export async function setOrderAuthorization(id: number, authorized: boolean) {
  return (await apiClient.post<{data: Order}>(`/sales/orders/${id}/actions/authorization`, { authorized })).data.data
}
export async function setOrderAssignment(id: number, lines: Array<{lineId: number; assigned: number}>) {
  return (await apiClient.post<{data: Order}>(`/sales/orders/${id}/actions/assignment`, { lines })).data.data
}
