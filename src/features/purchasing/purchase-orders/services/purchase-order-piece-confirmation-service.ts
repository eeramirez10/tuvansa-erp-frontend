import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import { apiClient } from "@/shared/api/api-client"

type PurchaseOrderPieceConfirmationInput = {
  revision: number
  legacyVersion: string
}

type PurchaseOrderPieceConfirmationPreview = PurchaseOrderPieceConfirmationInput & {
  id: number
  number: string
  canWrite: boolean
  reason: string
  pieceCount: number
}

const endpoint = (id: number) => `/purchasing/purchase-orders/${id}/actions/pieces/confirmation`

export async function getPurchaseOrderPieceConfirmation(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<{ data: PurchaseOrderPieceConfirmationPreview }>(endpoint(id), { signal })
  return response.data.data
}

export async function confirmPurchaseOrderPieces(id: number, { revision, legacyVersion }: PurchaseOrderPieceConfirmationInput) {
  const response = await apiClient.patch<{ data: PurchaseOrder }>(endpoint(id), { revision, legacyVersion })
  return response.data.data
}
