import type { PurchaseOrderAction } from "@/features/purchasing/purchase-orders/model"

export const purchaseOrderActions: readonly PurchaseOrderAction[] = [
  { key: "add-pieces", label: "Alta Piezas", readOnly: false },
  { key: "authorize", label: "Autorizar", readOnly: false },
  { key: "receipts", label: "Auxiliar", panelKey: "receipts", readOnly: true },
  { key: "change-supplier", label: "Cambia Prv", readOnly: false },
  { key: "classifications", label: "Clasificar", panelKey: "classifications", readOnly: true },
  { key: "comments", label: "Comentarios", panelKey: "comments", readOnly: true },
  { key: "confirm-all", label: "Confirmar todo", readOnly: false },
  { key: "quote", label: "Cotiz", readOnly: false },
  { key: "ct", label: "CT", readOnly: false },
  { key: "divide-branch", label: "Div. Sucursal", readOnly: false },
  { key: "duplicate", label: "Duplicar", readOnly: false },
  { key: "labels", label: "Etiquetas", readOnly: false },
  { key: "generate-percent", label: "Gen %", readOnly: false },
  { key: "print", label: "Imprimir", readOnly: false },
  { key: "print-confirmation", label: "Imprimir Conf.", readOnly: false },
  { key: "pieces", label: "Piezas", readOnly: false },
  { key: "branch", label: "Sucursal", readOnly: false },
  { key: "split", label: "Split", readOnly: false },
]
