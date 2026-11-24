import type { PurchaseReception, PurchaseReceptionPedimento } from "@/features/purchasing/purchase-receptions/model"
import { apiClient } from "@/shared/api/api-client"

export type PurchaseReceptionCreateLine = {
  orderLineId: number
  productCode: string
  description: string
  unit: string
  factor: number
  ordered: number
  fulfilled: number
  assigned: number
  suggested: number
  maximum: number
}

export type PurchaseReceptionCreatePreview = {
  id: number
  number: string
  supplier: PurchaseReception["supplier"]
  revision: number
  legacyVersion: string
  canWrite: boolean
  reason: string | null
  defaults: { receivedAt: string; warehouse: string }
  warehouses: Array<{ code: string; name: string }>
  lines: PurchaseReceptionCreateLine[]
  canRetireCompletedOrder: boolean
  pedimentoAvailable?: boolean
}

export type PurchaseReceptionCreateInput = Pick<PurchaseReceptionCreatePreview, "revision" | "legacyVersion"> & {
  requestKey: string
  orderNumber: string
  receivedAt: string
  warehouse: string
  supplierReference: string
  lines: Array<{ orderLineId: number; quantity: number }>
  pedimento?: PurchaseReceptionPedimento
}

type PurchaseReceptionCreateResult = {
  reception: PurchaseReception
  orderComplete: boolean
  orderRetired: boolean
}

const receptionsPath = "/purchasing/purchase-receptions"

export async function getPurchaseReceptionCreatePreview(orderNumber: string, signal?: AbortSignal) {
  const response = await apiClient.get<{ data: PurchaseReceptionCreatePreview }>(`${receptionsPath}/create`, {
    params: { orderNumber }, signal,
  })
  return response.data.data
}

export async function createPurchaseReception(payload: PurchaseReceptionCreateInput) {
  const response = await apiClient.post<{ data: PurchaseReceptionCreateResult }>(receptionsPath, payload)
  return response.data.data
}
