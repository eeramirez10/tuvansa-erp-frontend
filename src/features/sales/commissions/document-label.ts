import type { CollectionInvoice } from "@/features/sales/commissions/model"

export function collectionAdjustmentLabel(row: Pick<CollectionInvoice, "kind" | "canceled">) {
  if (row.kind === "cancellation") return "CANCELADA"
  if (row.kind === "return") return "DEVOLUCIÓN"
  if (row.kind === "credit-note") return "NOTA DE CRÉDITO"
  if (row.kind === "adjustment-reversal") return "REVERSIÓN D/C"
  return row.canceled ? "CANCELADA" : ""
}
export function collectionDocumentLabel(row: Pick<CollectionInvoice, "number" | "kind" | "canceled" | "reviewRequired">) {
  const label = collectionAdjustmentLabel(row)
  return row.number + (label ? "\n" + label : "") + (row.reviewRequired ? "\nREVISAR" : "")
}
