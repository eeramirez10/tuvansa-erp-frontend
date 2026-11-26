import type {
  CreateInvoiceFromOrderInput,
  CreateInvoiceFromOrderResult,
  Invoice,
  InvoiceFromOrderPreview,
  InvoicePanel,
  InvoicePanelKey,
  InvoiceSearchResponse,
  InvoiceTransferInput,
  InvoiceTransferPreview,
  InvoiceTransferReceipt,
  RemissionCancellation,
  RemissionCancellationInput,
  RemissionCancellationPreview,
  StampingSimulation,
  TicketConversionInput,
  TicketConversionResult,
} from "@/features/sales/invoicing/model"
import { apiClient } from "@/shared/api/api-client"

type ItemResponse<T> = { data: T }

export type InvoiceSearchCriteria = {
  q?: string
  issuedAt?: string
  invoiceNumber?: string
  orderNumber?: string
  customerOrderNumber?: string
  deliveryNote?: string
  folio?: string
  customerCode?: string
  warehouseSeal?: string
  amount?: number
  page?: number
  pageSize?: number
}

const panelPaths: Record<InvoicePanelKey, string> = {
  auxiliary: "actions/auxiliary",
  boxes: "actions/boxes",
  classifications: "actions/classifications",
  comments: "actions/comments",
  ct: "actions/ct",
  print: "actions/print",
  lots: "actions/lots",
  pieces: "actions/pieces",
  seal: "actions/seal",
  "ticket-to-invoice": "summaries/ticket-to-invoice",
  transfer: "summaries/transfer",
  "edit-pieces": "summaries/edit-pieces",
  "truck-settlement": "summaries/truck-settlement",
}

export async function searchInvoices(criteria: InvoiceSearchCriteria, signal?: AbortSignal) {
  const response = await apiClient.get<InvoiceSearchResponse>("/sales/invoices", {
    params: criteria,
    signal,
  })
  return response.data
}

export async function getInvoice(invoiceId: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<Invoice>>(`/sales/invoices/${invoiceId}`, { signal })
  return response.data.data
}

export async function getFirstInvoice(signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<Invoice | null>>("/sales/invoices/first", { signal })
  return response.data.data
}

export async function getInvoiceByNumber(invoiceNumber: string, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<Invoice>>(
    `/sales/invoices/by-number/${encodeURIComponent(invoiceNumber)}`,
    { signal },
  )
  return response.data.data
}

export async function getAdjacentInvoice(
  invoiceId: number,
  direction: "previous" | "next",
) {
  const response = await apiClient.get<ItemResponse<Invoice | null>>(
    `/sales/invoices/${invoiceId}/${direction}`,
  )
  return response.data.data
}

export async function getInvoicePanel(
  invoiceId: number,
  key: InvoicePanelKey,
  signal?: AbortSignal,
) {
  const response = await apiClient.get<ItemResponse<InvoicePanel>>(
    `/sales/invoices/${invoiceId}/${panelPaths[key]}`,
    { signal },
  )
  return response.data.data
}

export async function simulateInvoiceStamping(invoiceId: number) {
  const response = await apiClient.post<ItemResponse<StampingSimulation>>(
    `/sales/invoices/${invoiceId}/actions/seal/simulation`,
    {},
  )
  return response.data.data
}

export async function convertTicketToInvoice(invoiceId: number, input: TicketConversionInput) {
  const response = await apiClient.post<ItemResponse<TicketConversionResult>>(
    `/sales/invoices/${invoiceId}/${panelPaths["ticket-to-invoice"]}`,
    input,
  )
  return response.data.data
}

const transferPath = (id: number) => `/sales/invoices/${id}/${panelPaths.transfer}`

export async function getInvoiceTransferPreview(id: number, warehouse: string, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<InvoiceTransferPreview>>(`${transferPath(id)}/preview`, {
    params: warehouse ? { warehouse } : undefined,
    signal,
  })
  return response.data.data
}

export async function confirmInvoiceTransfer(id: number, input: InvoiceTransferInput) {
  const response = await apiClient.post<ItemResponse<InvoiceTransferReceipt>>(transferPath(id), input)
  return response.data.data
}

export async function editInvoiceLinePieces(invoiceId: number, lineId: number, edit: {
  expectedVersion: string
  requestKey: string
  value: string
}) {
  await apiClient.patch(`/sales/invoices/${invoiceId}/${panelPaths["edit-pieces"]}/${lineId}`, edit)
}

const fromOrderPath = "/sales/invoices/from-order"

export async function getInvoiceFromOrderPreview(orderNumber: string, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<InvoiceFromOrderPreview>>(fromOrderPath, {
    params: { orderNumber },
    signal,
  })
  return response.data.data
}

export async function createInvoiceFromOrder(input: CreateInvoiceFromOrderInput) {
  const response = await apiClient.post<ItemResponse<CreateInvoiceFromOrderResult>>(fromOrderPath, input)
  return response.data.data
}

const cancelRemissionPath = (id: number) => `/sales/invoices/${id}/actions/cancel-remission`

export async function getRemissionCancellationPreview(id: number, signal?: AbortSignal) {
  const response = await apiClient.get<ItemResponse<RemissionCancellationPreview>>(cancelRemissionPath(id), { signal })
  return response.data.data
}

export async function cancelRemission(id: number, input: RemissionCancellationInput) {
  const response = await apiClient.post<ItemResponse<RemissionCancellation>>(cancelRemissionPath(id), input)
  return response.data.data
}
