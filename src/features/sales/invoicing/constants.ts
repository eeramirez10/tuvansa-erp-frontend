import type { InvoicePanelDefinition } from "@/features/sales/invoicing/model"

export const invoiceActionPanels: readonly InvoicePanelDefinition[] = [
  { key: "auxiliary", label: "Auxiliar", section: "actions" },
  { key: "boxes", label: "Cajas", section: "actions" },
  { key: "classifications", label: "Clasifica", section: "actions" },
  { key: "comments", label: "Comentarios", section: "actions" },
  { key: "ct", label: "CT", section: "actions" },
  { key: "print", label: "Imprimir", section: "actions" },
  { key: "lots", label: "Lotes", section: "actions" },
  { key: "pieces", label: "Piezas", section: "actions" },
  { key: "seal", label: "Sellar", section: "actions" },
]

export const invoiceSummaryPanels: readonly InvoicePanelDefinition[] = [
  { key: "ticket-to-invoice", label: "Tiket > Factura", section: "summaries" },
  { key: "transfer", label: "Traspaso", section: "summaries" },
  { key: "edit-pieces", label: "Edita pzas", section: "summaries" },
  { key: "truck-settlement", label: "Liquidación camión", section: "summaries" },
]
