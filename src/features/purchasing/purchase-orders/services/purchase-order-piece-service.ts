import { apiClient } from "@/shared/api/api-client"

export type PurchaseOrderPieceEntry = {
  id: number | null
  serial: string
  quantity: number
}

export type PurchaseOrderPiece = {
  id: number
  productCode: string
  serial: string
  pieces: number
  quantity: number
  warehouse: string
  document: string
  receipt: string
}

export type PurchaseOrderPieceEditor = {
  id: number
  number: string
  revision: number
  legacyVersion: string
  canWrite: boolean
  reason: string
  products: Array<{ productCode: string, description: string, ordered: number }>
  items: PurchaseOrderPiece[]
}

export type PurchaseOrderPieceUpdate = Pick<PurchaseOrderPieceEditor, "revision" | "legacyVersion"> & {
  productCode: string
  entries: PurchaseOrderPieceEntry[]
}

const piecesPath = (id: number) => `/purchasing/purchase-orders/${id}/actions/pieces`

export async function getPurchaseOrderPieceEditor(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<{ data: PurchaseOrderPieceEditor }>(`${piecesPath(id)}/editor`, { signal })
  return response.data.data
}

export async function updatePurchaseOrderPieces(id: number, update: PurchaseOrderPieceUpdate) {
  const response = await apiClient.patch<{ data: PurchaseOrderPieceEditor }>(piecesPath(id), update)
  return response.data.data
}
