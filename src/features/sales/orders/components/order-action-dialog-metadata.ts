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

export const secondaryActionDialogTitles: Partial<Record<OrderPanelKey, string>> = {
  "assign-ct": "Captura color y talla",
  consolidate: "Consolidar pedido",
  ct: "Pedido CyT",
  "split-ct": "Divide ct",
  export: "Entrada color y talla",
  "purchase-order": "Duplica O.C.",
  split: "Split",
  branch: "Duplica Pedido",
  wip: "W.I.P.",
}

export const secondaryActionDialogWidths: Partial<Record<OrderPanelKey, string>> = {
  "assign-ct": "sm:max-w-[37rem]",
  consolidate: "sm:max-w-[31rem]",
  ct: "sm:max-w-[44rem]",
  "split-ct": "sm:max-w-[45rem]",
  export: "sm:max-w-[52rem]",
  "purchase-order": "sm:max-w-[22rem]",
  split: "sm:max-w-[48rem]",
  branch: "sm:max-w-[19rem]",
  wip: "sm:max-w-[41rem]",
}
