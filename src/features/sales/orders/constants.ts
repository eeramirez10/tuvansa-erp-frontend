import type { OrderPanelDefinition } from "@/features/sales/orders/model"

export const orderActionPanels: readonly OrderPanelDefinition[] = [
  { key: "assign-all", label: "Asignar todo", section: "actions" },
  { key: "authorize", label: "Autorizar", section: "actions" },
  { key: "invoices", label: "Auxiliar", section: "actions" },
  { key: "boxes", label: "Cajas", section: "actions" },
  { key: "classifications", label: "Clasificar", section: "actions" },
  { key: "comments", label: "Comentarios", section: "actions" },
  { key: "quote-conversion", label: "Cotiz", section: "actions" },
  { key: "duplicate", label: "Duplicar", section: "actions" },
  { key: "labels", label: "Etiquetas", section: "actions" },
  { key: "print", label: "Imprimir", section: "actions" },
  { key: "monarch", label: "Monarch", section: "actions" },
  { key: "pieces", label: "Piezas", section: "actions" },
  { key: "transfer", label: "Traspaso", section: "actions" },
]

export const orderSecondaryActionPanels: readonly OrderPanelDefinition[] = [
  { key: "assign-ct", label: "Asignar CT", section: "secondary-actions" },
  { key: "consolidate", label: "Consolidar", section: "secondary-actions" },
  { key: "ct", label: "CT", section: "secondary-actions" },
  { key: "split-ct", label: "Divide ct", section: "secondary-actions" },
  { key: "export", label: "EXP", section: "secondary-actions" },
  { key: "purchase-order", label: "Genera O.C.", section: "secondary-actions" },
  { key: "split", label: "Split", section: "secondary-actions" },
  { key: "branch", label: "Sucursal", section: "secondary-actions" },
  { key: "wip", label: "WIP", section: "secondary-actions" },
]
