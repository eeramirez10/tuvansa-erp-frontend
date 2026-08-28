import { queryOptions } from "@tanstack/react-query"
import type { InvoicePanelKey } from "@/features/sales/invoicing/model"
import {
  getFirstInvoice,
  getInvoice,
  getInvoiceByNumber,
  getInvoicePanel,
  searchInvoices,
  type InvoiceSearchCriteria,
} from "@/features/sales/invoicing/services/invoice-service"

export const invoiceKeys = {
  all: ["sales", "invoices"] as const,
  detail: (invoiceId: number) => [...invoiceKeys.all, "detail", invoiceId] as const,
  first: () => [...invoiceKeys.all, "first"] as const,
  byNumber: (invoiceNumber: string) => [...invoiceKeys.all, "by-number", invoiceNumber] as const,
  search: (criteria: InvoiceSearchCriteria) => [...invoiceKeys.all, "search", criteria] as const,
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
