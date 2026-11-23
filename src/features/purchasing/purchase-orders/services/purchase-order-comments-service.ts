import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import { apiClient } from "@/shared/api/api-client"

export type PurchaseOrderCommentsFields = {
  from: string | null
  dueAt: string | null
  terms: number
  supplierOrderNumber: string
  department: string
  discountPercentages: [number, number, number]
  exchangeRate: number
  warehouse: string
  currencyId: number
  lines: [string, string, string, string, string]
  otherLabel: string
  freight: number
  insurance: number
  other: number
  confirmedAt: string | null
}

export type PurchaseOrderCommentsUpdate = {
  revision: number
  legacyVersion: string
  fields: PurchaseOrderCommentsFields
}

export type PurchaseOrderCommentsEditor = PurchaseOrderCommentsUpdate & {
  canWrite: boolean
  reason: string
}

const commentsPath = (id: number) => `/purchasing/purchase-orders/${id}/actions/comments`

export async function getPurchaseOrderCommentsEditor(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<{ data: PurchaseOrderCommentsEditor }>(`${commentsPath(id)}/editor`, { signal })
  return response.data.data
}

export async function updatePurchaseOrderComments(id: number, update: PurchaseOrderCommentsUpdate) {
  const response = await apiClient.patch<{ data: PurchaseOrder }>(commentsPath(id), update)
  return response.data.data
}
