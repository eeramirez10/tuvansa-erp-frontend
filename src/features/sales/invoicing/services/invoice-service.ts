import type {
  Invoice,
  InvoicePanel,
  InvoicePanelKey,
  InvoiceSearchResponse,
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
