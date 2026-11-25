import type { InventoryMovementPrint } from "@/features/inventories/movements/model"
import { formatDate } from "@/features/inventories/products/query-formatters"

const twoDecimals = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fourDecimals = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 4, maximumFractionDigits: 4 })

const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }
const text = (value: string) => value.replace(/[&<>"']/g, (character) => entities[character])

function amountInCents(value: number) {
  const magnitude = Math.abs(value) * 100
  return Math.sign(value) * Math.round(magnitude + magnitude * Number.EPSILON)
}

const styles = `
  @page { size: letter; margin: 16mm 12mm; }
  body { margin: 0 auto; max-width: 190mm; padding: 12mm; color: #151515; font: 10.5pt Arial, sans-serif; }
  @media print { body { max-width: none; padding: 0; } }
  header { border-bottom: 2px solid #222; padding-bottom: 8pt; }
  h1 { margin: 3pt 0 0; font-size: 16pt; }
  p { margin: 4pt 0; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 4pt 10pt; }
  dt { font-weight: bold; }
  dd { margin: 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 4pt 5pt; vertical-align: top; text-align: left; }
  th { border-block: 1px solid #444; }
  td { border-bottom: 1px solid #ddd; }
  tr { break-inside: avoid; }
  .number { text-align: right; white-space: nowrap; }
  .customs { margin: 2pt 0 0; font-size: 9pt; }
  .report-footer { margin-top: 12pt; break-inside: avoid; }
  .movement-summary { display: flex; flex-wrap: wrap; gap: 8pt 24pt; }
  .comments { white-space: pre-wrap; }
  .total { display: flex; justify-content: flex-end; gap: 16pt; border-top: 1px solid #444; padding: 4pt 5pt; }
  .signatures { display: flex; gap: 32pt; justify-content: space-evenly; margin-top: 38pt; break-inside: avoid; }
  .signatures p { min-width: 130pt; text-align: center; border-top: 1px solid #444; padding-top: 4pt; }
`

export function buildInventoryMovementPrintDocument(report: InventoryMovementPrint) {
  const transfer = report.type === "TR"
  const outgoing = report.format === "QTUVANSA002"
  const title = transfer ? "Traspaso de material" : outgoing ? "Salida de inventario" : "Entrada de inventario"
  const warehouse = [report.warehouse, report.warehouseName].filter(Boolean).join(" · ")
  const warehouseLabel = transfer ? "Almacén destino" : outgoing ? "Salida almacén" : "Entrada almacén"
  const dateLabel = outgoing ? "Fecha de salida" : "Fecha de entrada"
  const date = formatDate(report.date)
  const direction = outgoing ? -1 : 1
  const formatMovementValue = (value: number) => twoDecimals.format(value === 0 ? 0 : value * direction)
  const cost = outgoing ? twoDecimals : fourDecimals
  const totalQuantity = report.lines.reduce((sum, line) => sum + line.quantity, 0)
  const printLines = report.lines.map(line => ({ ...line, cents: amountInCents(line.amount) }))
  const totalCents = printLines.reduce((sum, line) => sum + line.cents, 0)
  const lines = printLines.map((line, index) => {
    const lot = line.customs
    const customs = lot && (lot.entry || lot.date || lot.office)
      ? `<p class="customs">Pedimento ${text(lot.entry)} · Fecha ${text(formatDate(lot.date))} · Aduana ${text(lot.office)}</p>`
      : ""
    return `<tr><td class="number">${index + 1}</td><td class="number">${formatMovementValue(line.quantity)}</td>
      <td>${text(line.productCode)}</td><td>${text(line.description)}${customs}</td>
      ${transfer ? `<td>${text(line.warehouse ?? "")}</td>` : ""}
      <td class="number">${cost.format(line.cost)}</td><td class="number">${formatMovementValue(line.cents / 100)}</td></tr>`
  }).join("")

  return `<!doctype html>
  <html lang="es-MX"><head><meta charset="utf-8"><title>${title} ${text(report.document)}</title><style>${styles}</style></head>
    <body>
      <header><strong>${text(report.companyName)}</strong><h1>${title}</h1></header>
      <dl>
        <dt>Documento</dt><dd>${text(report.document)}</dd>
        <dt>Lugar y fecha</dt><dd>${text([report.place, date].filter(Boolean).join(" · "))}</dd>
        <dt>${outgoing ? "Salida de" : "Referencia"}</dt><dd>${text(report.reference)}</dd>
        ${transfer ? `<dt>Almacén origen</dt><dd>${text(report.sourceWarehouse ?? "")}</dd>` : ""}
        <dt>${warehouseLabel}</dt><dd>${text(warehouse)}</dd>
      </dl>
      <table>
        <thead><tr><th class="number">#</th><th class="number">Cant.</th><th>Código</th><th>Descripción</th>${transfer ? "<th>Alm.</th>" : ""}<th class="number">Costo U.</th><th class="number">Importe</th></tr></thead>
        <tbody>${lines}</tbody>
      </table>
      <section class="report-footer">
        <p class="movement-summary">
          <span><strong>Cantidad total</strong> ${formatMovementValue(totalQuantity)}</span>
          <span><strong>${dateLabel}</strong> ${text(date)}</span>
        </p>
        <p class="comments"><strong>Comentarios</strong> ${text(report.comment)}</p>
        <p class="total"><strong>Total</strong><strong class="number">${formatMovementValue(totalCents / 100)}</strong></p>
        <div class="signatures"><p>Firma</p><p>Firma de aceptación</p></div>
      </section>
    </body>
  </html>`
}
