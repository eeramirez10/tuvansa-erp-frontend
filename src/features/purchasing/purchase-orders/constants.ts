import type { PurchaseOrderAction } from "@/features/purchasing/purchase-orders/model"

export const purchaseOrderActions: readonly PurchaseOrderAction[] = [
  { key: "add-pieces", label: "Alta Piezas" },
  { key: "authorize", label: "Autorizar" },
  { key: "receipts", label: "Auxiliar", panelKey: "receipts" },
  { key: "change-supplier", label: "Cambia Prv" },
  { key: "classifications", label: "Clasificar", panelKey: "classifications" },
  { key: "comments", label: "Comentarios", panelKey: "comments" },
  { key: "confirm-all", label: "Confirmar todo" },
  { key: "quote", label: "Cotiz" },
  { key: "ct", label: "CT", panelKey: "ct" },
  { key: "divide-branch", label: "Div. Sucursal" },
  { key: "duplicate", label: "Duplicar" },
  { key: "labels", label: "Etiquetas" },
  { key: "generate-percent", label: "Gen %" },
  { key: "print", label: "Imprimir" },
  { key: "print-confirmation", label: "Imprimir Conf." },
  { key: "pieces", label: "Piezas", panelKey: "pieces" },
  { key: "branch", label: "Sucursal" },
  { key: "split", label: "Split" },
]
