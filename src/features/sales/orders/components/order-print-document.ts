import type { Client } from "@/features/accounts-receivable/clients/model"
import type { Order } from "@/features/sales/orders/model"
import { orderPrintFilter, printQuantities, type OrderPrintOptions } from "./order-print-settings"

const price = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 5 })
const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const quantity = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 })
const documentTitles = { order: "Pedido", quote: "Cotización", unknown: "Documento de venta" } as const

export type OrderPrintEntry = {
  order: Order
  customer?: Client
  comments?: string
  amountInWords?: string
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

type PrintField = { label: string; value: string }
type PrintCell = { value: string; align?: "right" }
export type OrderPrintSection = {
  title: string
  company: string
  header: PrintField[]
  columns: string[]
  rows: PrintCell[][]
  amounts: PrintField[]
  notes: PrintField[]
  signatures: string[]
  totalNote: boolean
}

function createSection(
  { order, customer, delivery, comments, amountInWords }: OrderPrintEntry,
  options: OrderPrintOptions, filter: ReturnType<typeof orderPrintFilter>, company: string,
): OrderPrintSection {
  const { format, quantities } = options
  const title = `${documentTitles[order.documentKind]} ${order.number}`
  const legacy = order.storage?.legacyId !== null && !order.captureDetails
  const localCurrency = order.captureDetails?.collectionCurrency === "DOLARES" || (!order.captureDetails && order.currencyId === 1)
    ? "USD" : "MXN"
  const currency = legacy ? legacyCurrency(order.currencyId) : localCurrency
  const usingPacking = format === "packing-list"
  const isCommercial = format === "order"
  const isQuote = order.documentKind === "quote"
  const header = [
    { label: "Cliente", value: `${order.customer.code} · ${order.customer.name}` },
    { label: isQuote ? "Fecha de cotización" : "Fecha de pedido", value: date(order.dates.orderedAt) },
    { label: isQuote ? "Vigencia de cotización" : "Vence", value: date(order.dates.dueAt) },
    { label: "Almacén", value: order.warehouse },
    { label: "Moneda", value: currency },
    ...(isCommercial && order.exchangeRate > 0 ? [{ label: "Tipo de cambio", value: price.format(order.exchangeRate) }] : []),
    ...(isCommercial ? [{ label: "Plazo", value: `${quantity.format(order.termsDays)} días` }] : []),
    ...(order.attention ? [{ label: "Agente", value: order.attention }] : []),
    ...(order.customerOrderNumber ? [{ label: "Pedido del cliente", value: order.customerOrderNumber }] : []),
  ]
  if (customer) {
    const { street, exteriorNumber, interiorNumber, neighborhood, borough, city, state, postalCode } = customer.address
    const address = [[street, exteriorNumber, interiorNumber].filter(Boolean).join(" "), neighborhood,
      borough, city, state, postalCode].filter(Boolean).join(", ")
    const customerFields = [
      { label: "Dirección del cliente", value: address },
      { label: "RFC", value: customer.fiscal.taxId },
      { label: "Teléfono", value: customer.contact.phones },
      { label: "Fax", value: customer.contact.fax },
      { label: "Correo electrónico", value: customer.contact.email },
    ]
    header.push(...customerFields.filter(field => field.value?.trim()))
  }
  if (!isCommercial) header.push({ label: "Desde", value: date(order.dates.from) })
  const contact = delivery?.contact || customer?.contact.name
  if (contact) header.push({ label: "Contacto", value: contact })
  if (usingPacking && delivery?.boxes) header.push({ label: "Cajas", value: quantity.format(delivery.boxes) })

  const remarks = [...new Set([order.observations, comments].map(value => value?.trim()).filter(Boolean))].join("\n")
  const notes = [
    ...(delivery?.address.length ? [{ label: "Entregar en", value: delivery.address.join("\n") }] : []),
    ...(remarks && format !== "summary" ? [{ label: "Comentarios", value: remarks }] : []),
    ...(isCommercial && amountInWords ? [{ label: "Importe con letra", value: amountInWords }] : []),
  ]
  const signatures = !isCommercial ? [] : isQuote
    ? ["Firma de aceptación del vendedor", "Firma de aceptación del cliente"]
    : ["Tomó pedido", "Ventas", "Crédito", "Almacén"]

  const lines = order.lines.filter(line => filter(line) && (quantities === "ordered" || line[quantities] > 0))
  const quantityLabel = quantities === "ordered" ? "Cant." : printQuantities.find(option => option.value === quantities)!.label
  const columns = ["Código", "Descripción", quantityLabel, "U.M.", ...(usingPacking ? [] : ["Precio unitario", "Descto.", "Importe", "Total"])]
  const rows: PrintCell[][] = lines.map(line => {
    const lineCurrency = legacy && line.currencyId !== 0 ? legacyCurrency(line.currencyId) : currency
    const gross = line[quantities] * line.price
    return [
      { value: line.productCode }, { value: line.description },
      { value: quantity.format(line[quantities]), align: "right" }, { value: line.unit },
      ...(usingPacking ? [] : [
        { value: `${price.format(line.price)} ${lineCurrency}`, align: "right" as const },
        { value: `${quantity.format(line.discount)}%`, align: "right" as const },
        { value: money.format(gross), align: "right" as const },
        { value: money.format(gross * (1 - line.discount / 100)), align: "right" as const },
      ]),
    ]
  })
  const byUnit = new Map<string, number>()
  for (const line of lines) byUnit.set(line.unit, (byUnit.get(line.unit) ?? 0) + line[quantities])
  const summaryRows: PrintCell[][] = [...byUnit].map(([unit, count]) =>
    [{ value: unit }, { value: quantity.format(count), align: "right" }])

  const subtotals = [
    { label: "Subtotal", value: order.totals.subtotal, always: true },
    { label: "Descuento", value: order.totals.discount },
    { label: "Flete", value: order.totals.freight },
    { label: "Seguro", value: order.totals.insurance },
    { label: "Otros", value: order.totals.other },
    { label: "IVA", value: order.totals.tax, always: true },
  ].filter(({ always, value }) => always || value !== 0)
  const formatTitle = usingPacking ? "Lista de empaque" : format === "summary" ? "Resumen" : ""

  return {
    title: formatTitle ? `${formatTitle} · ${title}` : title,
    company,
    header,
    notes,
    signatures,
    columns: format === "summary" ? ["Unidad", quantityLabel] : columns,
    rows: format === "summary" ? summaryRows : rows,
    amounts: usingPacking ? [] : [
      ...subtotals.map(({ label, value }) => ({ label, value: money.format(value) })),
      { label: "Total", value: `${money.format(order.totals.total)} ${currency}` },
    ],
    totalNote: quantities !== "ordered" || lines.length !== order.lines.length,
  }
}

export function getOrderPrintSections(entries: OrderPrintEntry[], options: OrderPrintOptions, company: string) {
  const filter = orderPrintFilter(options.filter)
  return entries.map(entry => createSection(entry, options, filter, company))
}

function renderOrder(section: OrderPrintSection) {
  return `<section class="report">
    <header>${section.company ? `<strong>${text(section.company)}</strong>` : ""}<h1>${text(section.title)}</h1></header>
    <dl class="details">${section.header.map(({ label, value }) =>
      `<div><dt>${text(label)}</dt><dd>${text(value)}</dd></div>`).join("")}</dl>
    <table aria-label="Partidas">
      <thead><tr>${section.columns.map(column => `<th>${text(column)}</th>`).join("")}</tr></thead>
      <tbody>${section.rows.map(row => `<tr>${row.map(cell =>
        `<td class="${cell.align === "right" ? "number" : ""}">${text(cell.value)}</td>`).join("")}</tr>`).join("")
        || `<tr><td class="empty" colspan="${section.columns.length}">Sin partidas para la selección</td></tr>`}</tbody>
    </table>
    <div class="closing">
    <dl class="notes">${section.notes.map(({ label, value }) =>
      `<div><dt>${text(label)}</dt><dd>${text(value)}</dd></div>`).join("")}</dl>
    ${section.amounts.length ? `<dl class="totals">
      ${section.totalNote ? '<div class="total-note">Importes del folio</div>' : ""}
      ${section.amounts.map(({ label, value }) =>
        `<div${label === "Total" ? ' class="total"' : ""}><dt>${text(label)}</dt><dd class="number">${text(value)}</dd></div>`).join("")}
    </dl>` : ""}
    </div>
    ${section.signatures.length ? `<div class="signatures">${section.signatures.map(label => `<div>${text(label)}</div>`).join("")}</div>` : ""}
  </section>`
}

export function buildOrderPrintDocument(sections: OrderPrintSection[], copies: number) {
  const title = sections.length === 1 && sections[0] ? sections[0].title : "Pedidos"
  const pages = sections.map(renderOrder).join("")
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
  header { display: flex; align-items: start; justify-content: space-between; gap: 5mm; border-bottom: 2px solid #262626; padding-bottom: 3mm; }
  header strong { max-width: 55%; }
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
  td { overflow-wrap: anywhere; }
  .closing { display: flex; gap: 5mm; margin-top: 4mm; align-items: start; }
  .notes { flex: 1; min-width: 0; }
  .notes div { margin-bottom: 2mm; break-inside: avoid; }
  .notes dt { font-weight: bold; }
  .notes dd { white-space: pre-wrap; }
  .signatures { display: flex; gap: 5mm; margin-top: 10mm; text-align: center; break-inside: avoid; }
  .signatures div { flex: 1; border-top: 1px solid #333; padding-top: 2mm; }
  .empty { padding: 5mm; text-align: center; }
  .totals { width: min(64mm, 100%); margin-left: auto; break-inside: avoid; }
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
