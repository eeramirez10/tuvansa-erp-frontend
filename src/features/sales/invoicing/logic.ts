import { queryOptions } from "@tanstack/react-query"
import type { Invoice, InvoicePanelKey } from "@/features/sales/invoicing/model"
import {
  getFirstInvoice,
  getInvoice,
  getInvoiceByNumber,
  getInvoiceFromOrderPreview,
  getInvoicePanel,
  getRemissionCancellationPreview,
  searchInvoices,
  type InvoiceSearchCriteria,
} from "@/features/sales/invoicing/services/invoice-service"

export function isLocalRemission({ id, number }: Pick<Invoice, "id" | "number">) {
  return /^FAW\d{8}$/.test(number) && id >= 7_100_000_000_000 && id <= 7_100_099_999_998
}

export const invoiceKeys = {
  all: ["sales", "invoices"] as const,
  detail: (invoiceId: number) => [...invoiceKeys.all, "detail", invoiceId] as const,
  first: () => [...invoiceKeys.all, "first"] as const,
  byNumber: (invoiceNumber: string) => [...invoiceKeys.all, "by-number", invoiceNumber] as const,
  search: (criteria: InvoiceSearchCriteria) => [...invoiceKeys.all, "search", criteria] as const,
  fromOrder: (orderNumber: string) => [...invoiceKeys.all, "from-order", orderNumber] as const,
  remissionCancellation: (id: number) => [...invoiceKeys.detail(id), "cancel-remission"] as const,
  panel: (invoiceId: number, key: InvoicePanelKey) =>
    [...invoiceKeys.detail(invoiceId), "panel", key] as const,
}

export const invoiceQueryOptions = (invoiceId: number) => queryOptions({
  queryKey: invoiceKeys.detail(invoiceId),
  queryFn: ({ signal }) => getInvoice(invoiceId, signal),
})

export const firstInvoiceQueryOptions = () => queryOptions({
  queryKey: invoiceKeys.first(),
  queryFn: async ({ signal }) => {
    const invoice = await getFirstInvoice(signal)
    if (invoice === null) throw new Error("No hay facturas disponibles")
    return invoice
  },
})

export const invoiceByNumberQueryOptions = (invoiceNumber: string) => queryOptions({
  queryKey: invoiceKeys.byNumber(invoiceNumber),
  queryFn: ({ signal }) => getInvoiceByNumber(invoiceNumber, signal),
})

export const invoiceSearchQueryOptions = (criteria: InvoiceSearchCriteria) => queryOptions({
  queryKey: invoiceKeys.search(criteria),
  queryFn: ({ signal }) => searchInvoices(criteria, signal),
})

export const invoicePanelQueryOptions = (invoiceId: number, key: InvoicePanelKey) => queryOptions({
  queryKey: invoiceKeys.panel(invoiceId, key),
  queryFn: ({ signal }) => getInvoicePanel(invoiceId, key, signal),
})

export const invoiceFromOrderQueryOptions = (orderNumber: string) => queryOptions({
  queryKey: invoiceKeys.fromOrder(orderNumber),
  queryFn: ({ signal }) => getInvoiceFromOrderPreview(orderNumber, signal),
  enabled: orderNumber !== "",
  gcTime: 0,
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
  retry: false,
})

export const remissionCancellationQueryOptions = (invoiceId: number) => queryOptions({
  queryKey: invoiceKeys.remissionCancellation(invoiceId),
  queryFn: ({ signal }) => getRemissionCancellationPreview(invoiceId, signal),
  refetchOnMount: "always",
  retry: false,
})
