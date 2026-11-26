import type { Order } from "@/features/sales/orders/model"
import { orderPrintFilter, printQuantities, type OrderPrintOptions } from "./order-print-settings"

const price = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 5 })
const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const quantity = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 })
const documentTitles = { order: "Pedido", quote: "Cotización", unknown: "Documento de venta" } as const

export type OrderPrintEntry = {
  order: Order
  delivery?: { address: string[]; contact: string; boxes: number }
}

function text(value: string | number) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;")
}

function date(value: string | null) {
  if (!value) return "—"
  const [year, month, day] = value.slice(0, 10).split("-")
  return year && month && day ? `${day}/${month}/${year}` : value
}

function legacyCurrency(id: number) {
  if (id === 0 || id === 1) return "MXN"
  return id === 2 ? "USD" : `Moneda ${id}`
}

function table(columns: string[], rows: string) {
  return `<table aria-label="Partidas">
    <thead><tr>${columns.map(column => `<th>${text(column)}</th>`).join("")}</tr></thead>
    <tbody>${rows || `<tr><td class="empty" colspan="${columns.length}">Sin partidas para la selección</td></tr>`}</tbody>
  </table>`
}

function renderOrder({ order, delivery }: OrderPrintEntry, options: OrderPrintOptions, filter: ReturnType<typeof orderPrintFilter>) {
  const { format, quantities } = options
  const title = `${documentTitles[order.documentKind]} ${order.number}`
  const legacy = order.storage?.legacyId !== null && !order.captureDetails
  const localCurrency = order.captureDetails?.collectionCurrency === "DOLARES" || (!order.captureDetails && order.currencyId === 1)
    ? "USD" : "MXN"
  const currency = legacy ? legacyCurrency(order.currencyId) : localCurrency
  const header = [
    { label: "Cliente", value: `${order.customer.code} · ${order.customer.name}` },
    ...(order.customerOrderNumber ? [{ label: "Pedido del cliente", value: order.customerOrderNumber }] : []),
    { label: "Fecha", value: date(order.dates.orderedAt) },
    { label: "Desde", value: date(order.dates.from) },
    { label: "Vence", value: date(order.dates.dueAt) },
    { label: "Almacén", value: order.warehouse },
    { label: "Moneda", value: currency },
  ]

  const usingPacking = format === "packing-list"
  if (usingPacking && delivery) {
    if (delivery.address.length) header.push({ label: "Dirección de entrega", value: delivery.address.join(" · ") })
    if (delivery.contact) header.push({ label: "Contacto", value: delivery.contact })
    if (delivery.boxes > 0) header.push({ label: "Cajas", value: quantity.format(delivery.boxes) })
  }

  const lines = order.lines.filter(line => filter(line) && (quantities === "ordered" || line[quantities] > 0))
  const quantityLabel = printQuantities.find(option => option.value === quantities)?.label ?? "Cantidad"
  const columns = ["Código", "Descripción", quantityLabel, "U.M.", ...(usingPacking ? [] : ["Precio unitario", "Descuento"])]
  const rows = lines.map(line => {
    const lineCurrency = legacy && line.currencyId !== 0 ? legacyCurrency(line.currencyId) : currency
    return `<tr>
      <td class="code">${text(line.productCode)}</td><td>${text(line.description)}</td>
      <td class="number">${quantity.format(line[quantities])}</td><td>${text(line.unit)}</td>
      ${usingPacking ? "" : `<td class="number">${price.format(line.price)} ${text(lineCurrency)}</td>
      <td class="number">${quantity.format(line.discount)}%</td>`}
    </tr>`
  }).join("")
  const byUnit = new Map<string, number>()
  for (const line of lines) byUnit.set(line.unit, (byUnit.get(line.unit) ?? 0) + line[quantities])
  const summaryRows = [...byUnit].map(([unit, count]) =>
    `<tr><td>${text(unit)}</td><td class="number">${quantity.format(count)}</td></tr>`).join("")

  const subtotals = [
    { label: "Subtotal", value: order.totals.subtotal, always: true },
    { label: "Descuento", value: order.totals.discount },
    { label: "Flete", value: order.totals.freight },
    { label: "Seguro", value: order.totals.insurance },
    { label: "Otros", value: order.totals.other },
    { label: "IVA", value: order.totals.tax, always: true },
  ].filter(({ always, value }) => always || value !== 0)
  const formatTitle = usingPacking ? "Lista de empaque" : format === "summary" ? "Resumen" : ""

  return `<section class="report">
    <header><h1>${text(formatTitle ? `${formatTitle} · ${title}` : title)}</h1></header>
    <dl class="details">${header.map(({ label, value }) =>
      `<div><dt>${text(label)}</dt><dd>${text(value)}</dd></div>`).join("")}</dl>
    ${format === "summary" ? table(["Unidad", quantityLabel], summaryRows) : table(columns, rows)}
    ${usingPacking ? "" : `<dl class="totals">
      ${quantities !== "ordered" || lines.length !== order.lines.length ? '<div class="total-note">Importes del folio</div>' : ""}
      ${subtotals.map(({ label, value }) => `<div><dt>${text(label)}</dt><dd class="number">${money.format(value)}</dd></div>`).join("")}
      <div class="total"><dt>Total</dt><dd class="number">${money.format(order.totals.total)} ${text(currency)}</dd></div>
    </dl>`}
  </section>`
}

export function buildOrderPrintDocument(entries: OrderPrintEntry[], options: OrderPrintOptions, copies = 1) {
  const filter = orderPrintFilter(options.filter)
  const title = entries.length === 1 && entries[0]
    ? `${documentTitles[entries[0].order.documentKind]} ${entries[0].order.number}` : "Pedidos"
  const pages = entries.map(entry => renderOrder(entry, options, filter)).join("")
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${text(title)}</title>
<style>
  @page { size: letter; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #161616; background: #fff; font: 10pt/1.35 Arial, sans-serif; }
  main { max-width: 188mm; margin: 0 auto; padding: 8mm; }
  header { border-bottom: 2px solid #262626; padding-bottom: 3mm; }
  h1 { font-size: 18pt; margin: 0; overflow-wrap: anywhere; }
  dl { margin: 0; }
  .details { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2.5mm 4mm; padding: 4mm 0; }
  .details div:first-child { grid-column: 1 / -1; }
  .details dt { font-size: 8pt; color: #444; }
  dd { margin: 0; overflow-wrap: anywhere; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th, td { border-bottom: 1px solid #aaa; padding: 1.8mm 1.5mm; text-align: left; vertical-align: top; }
  th { border-block: 1px solid #333; font-size: 8.5pt; }
  .number { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .code { white-space: nowrap; }
  .empty { padding: 5mm; text-align: center; }
  .totals { width: min(73mm, 100%); margin: 4mm 0 0 auto; break-inside: avoid; }
  .totals div { display: grid; grid-template-columns: 1fr auto; gap: 3mm; padding: 1mm 0; }
  .totals .total { border-top: 1px solid #333; margin-top: 1mm; font-weight: bold; }
  .report + .report { margin-top: 10mm; }
  .totals .total-note { display: block; color: #444; font-size: 8pt; }
  @media print {
    main { max-width: none; padding: 0; }
    .report + .report { break-before: page; margin-top: 0; }
  }
</style>
</head>
<body><main>${pages.repeat(copies)}</main></body>
</html>`
}
