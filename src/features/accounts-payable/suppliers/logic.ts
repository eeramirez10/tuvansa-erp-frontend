import { queryOptions } from "@tanstack/react-query"
import { parsePostingReversal } from "@/features/accounts-payable/posting-reversal-model"
import {
  getFirstSupplier,
  getSupplier,
  getSupplierClassifications,
  getSupplierCreatePreview,
  getSupplierEditPreview,
  getSupplierPanel,
  getSupplierPaymentPreview,
  searchSuppliers,
  type SupplierSearchCriteria,
} from "@/features/accounts-payable/suppliers/services/supplier-service"
import type { SupplierPanelDefinition } from "@/features/accounts-payable/suppliers/model"

export const supplierKeys = {
  all: ["accounts-payable", "suppliers"] as const,
  first: () => [...supplierKeys.all, "first"] as const,
  detail: (supplierId: number) => [...supplierKeys.all, "detail", supplierId] as const,
  search: (criteria: SupplierSearchCriteria) => [...supplierKeys.all, "search", criteria] as const,
  panel: (supplierId: number, panelKey: string) => [...supplierKeys.detail(supplierId), "panel", panelKey] as const,
  classifications: (supplierId: number, position: number) => [...supplierKeys.detail(supplierId), "classifications", position] as const,
  payment: (supplierId: number, receiptId: number) => [...supplierKeys.detail(supplierId), "payment", receiptId] as const,
  paymentReversal: (supplierId: number, paymentId: number) => [...supplierKeys.detail(supplierId), "payment-reversal", paymentId] as const,
  createPreview: () => [...supplierKeys.all, "create"] as const,
  editPreview: (id: number) => [...supplierKeys.detail(id), "edit"] as const,
}

export const supplierQueryOptions = (supplierId: number) => queryOptions({
  queryKey: supplierKeys.detail(supplierId),
  queryFn: ({ signal }) => getSupplier(supplierId, signal),
})

export const firstSupplierQueryOptions = () => queryOptions({
  queryKey: supplierKeys.first(),
  queryFn: ({ signal }) => getFirstSupplier(signal),
})

export const supplierSearchQueryOptions = (criteria: SupplierSearchCriteria) => queryOptions({
  queryKey: supplierKeys.search(criteria),
  queryFn: ({ signal }) => searchSuppliers(criteria, signal),
})

export const supplierPanelQueryOptions = (supplierId: number, panel: SupplierPanelDefinition) => queryOptions({
  queryKey: supplierKeys.panel(supplierId, panel.key),
  queryFn: ({ signal }) => getSupplierPanel(supplierId, panel, signal),
})

export const supplierClassificationsQueryOptions = (supplierId: number, position: number) => queryOptions({
  queryKey: supplierKeys.classifications(supplierId, position),
  queryFn: ({ signal }) => getSupplierClassifications(supplierId, position, signal),
  placeholderData: (previousData) => previousData,
})

export const supplierPaymentQueryOptions = (supplierId: number, receiptId: number) => queryOptions({
  queryKey: supplierKeys.payment(supplierId, receiptId),
  queryFn: ({ signal }) => getSupplierPaymentPreview(supplierId, receiptId, signal),
  refetchOnMount: "always",
  refetchOnWindowFocus: false,
})

export const supplierCreateQueryOptions = () => queryOptions({
  queryKey: supplierKeys.createPreview(),
  queryFn: ({ signal }) => getSupplierCreatePreview(signal),
  refetchOnMount: "always",
  gcTime: 0,
  retry: false,
})

export const supplierEditQueryOptions = (id: number) => queryOptions({
  queryKey: supplierKeys.editPreview(id),
  queryFn: ({ signal }) => getSupplierEditPreview(id, signal),
  refetchOnMount: "always",
  gcTime: 0,
  retry: false,
})

export function supplierBalanceReceiptId(row: Record<string, unknown> | undefined): number | null {
  if (!row || row.canPay === false) return null

  const id = Number(row.receiptId ?? row.id)
  if (!Number.isSafeInteger(id) || id <= 0) return null

  // Older balance responses identify local receptions by their reserved id range.
  return row.canPay === true || (id >= 6_700_000_000_000 && id <= 6_700_099_999_998) ? id : null
}

export function supplierReversiblePayment(row: Record<string, unknown> | undefined) {
  if (row?.movementType !== "PP") return null
  const reversal = parsePostingReversal(row.reversal)
  const id = Number(row.paymentId ?? row.id)
  if (!(row.canReverse === true || reversal) || !Number.isSafeInteger(id) || id <= 0) return null
  return { id, reversal }
}

const supplierDayFormatter = new Intl.DateTimeFormat("es-MX", { timeZone: "UTC" })

export function supplierCalendarDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const day = value.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day === "1900-12-31" || day.startsWith("0000-")) return undefined
  const parsed = new Date(`${day}T00:00:00Z`)
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === day ? day : undefined
}

export function supplierDateLabel(value: unknown): string {
  const day = supplierCalendarDate(value)
  return day ? supplierDayFormatter.format(new Date(`${day}T00:00:00Z`)) : ""
}
