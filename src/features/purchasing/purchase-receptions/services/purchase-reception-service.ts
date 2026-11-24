import type { PostingReversal, PostingReversalInput, PostingReversalPreview } from "@/features/accounts-payable/posting-reversal-model"
import type {
  PurchaseReception,
  PurchaseReceptionCancellationKind,
  PurchaseReceptionComments,
  PurchaseReceptionDocumenting,
  PurchaseReceptionPanel,
  PurchaseReceptionPanelKey,
  PurchaseReceptionPieceInput,
  PurchaseReceptionPieceLine,
  PurchaseReceptionSearchResponse,
} from "@/features/purchasing/purchase-receptions/model"
import { apiClient } from "@/shared/api/api-client"

type ItemResponse<T> = { data: T }

export type PurchaseReceptionSearchCriteria = {
  q?: string
  documentNumber?: string
  receivedAt?: string
  orderNumber?: string
  supplierReference?: string
  deliveryNote?: string
  folio?: string
  supplierCode?: string
  warehouse?: string
  page?: number
  pageSize?: number
}

const panelPaths: Record<PurchaseReceptionPanelKey, string> = {
  auxiliary: "actions/auxiliary",
  classifications: "actions/classifications",
  pedimento: "actions/pedimento",
  pieces: "actions/pieces",
}

export async function searchPurchaseReceptions(criteria: PurchaseReceptionSearchCriteria, signal?: AbortSignal) {
  const response = await apiClient.get<PurchaseReceptionSearchResponse>("/purchasing/purchase-receptions", { params: criteria, signal })
  return response.data
}

export async function getPurchaseReception(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PurchaseReception>>(`/purchasing/purchase-receptions/${id}`, { signal })
  return response.data.data
}

const commentsPath = (id: number) => `/purchasing/purchase-receptions/${id}/actions/comments`

export async function getPurchaseReceptionComments(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PurchaseReceptionComments>>(commentsPath(id), { signal })
  return response.data.data
}

export async function savePurchaseReceptionComments(id: number, input: Pick<PurchaseReceptionComments, "fields" | "revision">) {
  const response = await apiClient.patch<ItemResponse<PurchaseReceptionComments>>(commentsPath(id), input)
  return response.data.data
}

const documentPath = (id: number) => `/purchasing/purchase-receptions/${id}/actions/document`

export async function getPurchaseReceptionDocumenting(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PurchaseReceptionDocumenting>>(documentPath(id), { signal })
  return response.data.data
}

export async function documentPurchaseReception(id: number, input: {
  requestKey: string; revision: string; documents: Array<{ number: string; amount: number }>
}) {
  const response = await apiClient.post<ItemResponse<PurchaseReceptionDocumenting>>(documentPath(id), input)
  return response.data.data
}

export async function getAdjacentPurchaseReception(id: number, direction: "previous" | "next") {
  const response = await apiClient.get<ItemResponse<PurchaseReception | null>>(`/purchasing/purchase-receptions/${id}/${direction}`)
  return response.data.data
}

export async function getPurchaseReceptionPanel(id: number, key: PurchaseReceptionPanelKey, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PurchaseReceptionPanel>>(
    `/purchasing/purchase-receptions/${id}/${panelPaths[key]}`,
    { signal },
  )
  return response.data.data
}

const piecePath = (id: number) => `/purchasing/purchase-receptions/${id}/actions/pieces`
const pieceLinePath = (id: number, lineId: number) => `${piecePath(id)}/lines/${lineId}`

export async function getPurchaseReceptionPieceLine(id: number, lineId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PurchaseReceptionPieceLine>>(pieceLinePath(id, lineId), { signal })
  return response.data.data
}

export async function addPurchaseReceptionPiece(id: number, lineId: number, input: PurchaseReceptionPieceInput) {
  const response = await apiClient.post<ItemResponse<{ serialNumber: string }>>(pieceLinePath(id, lineId), input)
  return response.data.data
}

export async function editPurchaseReceptionLinePieces(id: number, lineId: number, input: { pieces: string; revision: string }) {
  const response = await apiClient.patch<ItemResponse<{ pieces: string }>>(pieceLinePath(id, lineId), input)
  return response.data.data
}

export async function renamePurchaseReceptionPiece(id: number, pieceId: number, input: { serial: string; previousSerial: string }) {
  const response = await apiClient.patch<ItemResponse<{ serialNumber: string }>>(`${piecePath(id)}/${pieceId}/serial`, input)
  return response.data.data
}

const cancellationPath = (id: number, kind: PurchaseReceptionCancellationKind) =>
  `/purchasing/purchase-receptions/${id}/actions/cancel-${kind}`

export async function getPurchaseReceptionCancellationPreview(id: number, kind: PurchaseReceptionCancellationKind, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<PostingReversalPreview>>(cancellationPath(id, kind), { signal })
  return response.data.data
}

export async function cancelPurchaseReception(id: number, kind: PurchaseReceptionCancellationKind, input: PostingReversalInput) {
  const response = await apiClient.post<ItemResponse<PostingReversal>>(cancellationPath(id, kind), input)
  return response.data.data
}
