import type { PurchaseReceptionAction } from "@/features/purchasing/purchase-receptions/model"

export const purchaseReceptionActions: readonly PurchaseReceptionAction[] = [
  { key: "add-pieces", label: "Alta Piezas" },
  { key: "add-loose-pieces", label: "Alta Piezas L." },
  { key: "auxiliary", label: "Auxiliar", panelKey: "auxiliary" },
  { key: "change-supplier", label: "Cambia Prv" },
  { key: "classifications", label: "Clasificar", panelKey: "classifications" },
  { key: "comments", label: "Comentarios" },
  { key: "labels", label: "Etiquetas" },
  { key: "document", label: "Documenta" },
  { key: "print", label: "Imprimir" },
  { key: "pieces", label: "Piezas" },
  { key: "ticket-to-invoice", label: "Tiket > Factura" },
  { key: "transfer", label: "Traspaso" },
  { key: "customs-report", label: "Reporte pedimento" },
  { key: "customs-entry", label: "Pedimento" },
  { key: "edit-pieces", label: "Edita pzas" },
]
