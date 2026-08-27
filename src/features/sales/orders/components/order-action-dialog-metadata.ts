import type { OrderPanelKey } from "@/features/sales/orders/model"

export const actionDialogTitles: Partial<Record<OrderPanelKey, string>> = {
  "assign-all": "Asignar todo",
  authorize: "Autoriza pedido",
  invoices: "Facturas de pedido",
  boxes: "Empaque",
  classifications: "Clasificadores",
  "quote-conversion": "Cotización",
  duplicate: "Duplica Pedido",
  labels: "Etiquetas",
  print: "Imprimir",
  monarch: "Monarch",
  pieces: "Piezas",
  transfer: "Traspaso",
}

export const actionDialogWidths: Partial<Record<OrderPanelKey, string>> = {
  "assign-all": "sm:max-w-[29rem]",
  authorize: "sm:max-w-[35rem]",
  invoices: "sm:max-w-[22rem]",
  boxes: "sm:max-w-[58rem]",
  classifications: "sm:max-w-[29rem]",
  "quote-conversion": "sm:max-w-[31rem]",
  duplicate: "sm:max-w-[26rem]",
  labels: "sm:max-w-[52rem]",
  print: "sm:max-w-[29rem]",
  monarch: "sm:max-w-[52rem]",
  pieces: "sm:max-w-[52rem]",
  transfer: "sm:max-w-[31rem]",
}
