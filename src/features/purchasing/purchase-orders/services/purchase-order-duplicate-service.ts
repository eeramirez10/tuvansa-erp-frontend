import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import { apiClient } from "@/shared/api/api-client"

export type PurchaseOrderDuplicateFields = {
  supplierCode: string
  percentage: number
  orderedAt: string
  from: string | null
  supplierOrderNumber: string
  branchCode: string
}

export type PurchaseOrderDuplicatePreparation = {
  id: number
  number: string
  revision: number
  legacyVersion: string
  canWrite: boolean
  reason: string
  lineCount: number
  fields: PurchaseOrderDuplicateFields
}

type DuplicatePurchaseOrderInput = {
  revision: number
  legacyVersion: string
  requestKey: string
  markedOnly: boolean
  fields: PurchaseOrderDuplicateFields
}

function duplicatePath(id: number) {
  return `/purchasing/purchase-orders/${id}/actions/duplicate`
}

export async function getPurchaseOrderDuplicate(id: number, markedOnly: boolean, signal?: AbortSignal) {
  const response = await apiClient.get<{ data: PurchaseOrderDuplicatePreparation }>(duplicatePath(id), {
    params: { markedOnly },
    signal,
  })
  return response.data.data
}

export async function duplicatePurchaseOrder(id: number, input: DuplicatePurchaseOrderInput) {
  const response = await apiClient.post<{ data: PurchaseOrder }>(duplicatePath(id), input)
  return response.data.data
}
