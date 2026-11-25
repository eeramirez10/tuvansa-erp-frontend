import type { InventoryMovementPrint } from "@/features/inventories/movements/model"
import { formatDate } from "@/features/inventories/products/query-formatters"

const quantity = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 })
const unitCost = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 4, maximumFractionDigits: 4 })
const amount = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }
const text = (value: string) => value.replace(/[&<>"']/g, (character) => entities[character])

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
  .customs { border-top: none; padding-top: 0; font-size: 9pt; }
  tfoot td { border-top: 1px solid #444; font-weight: bold; }
  .comments { margin-top: 12pt; white-space: pre-wrap; }
  .signatures { display: flex; gap: 32pt; justify-content: space-evenly; margin-top: 38pt; break-inside: avoid; }
  .signatures p { min-width: 130pt; text-align: center; border-top: 1px solid #444; padding-top: 4pt; }
`

export function buildInventoryMovementPrintDocument(report: InventoryMovementPrint) {
  const entry = report.type === "EI"
  const transfer = report.type === "TR"
  const title = transfer ? "Traspaso de material" : entry ? "Entrada de material" : "Salida de material"
  const warehouse = [report.warehouse, report.warehouseName].filter(Boolean).join(" · ")
  const warehouseLabel = transfer ? "Almacén destino" : entry ? "Entrada almacén" : "Salida almacén"
  const columnCount = transfer ? 7 : 6
  const date = formatDate(report.date)
  const lines = report.lines.map((line, index) => {
    const lot = line.customs
    const customs = lot && (lot.entry || lot.date || lot.office)
      ? `<tr><td colspan="${columnCount}" class="customs">Pedimento ${text(lot.entry)} · Fecha ${text(formatDate(lot.date))} · Aduana ${text(lot.office)}</td></tr>`
      : ""
    return `<tr><td class="number">${index + 1}</td><td class="number">${quantity.format(line.quantity)}</td>
      <td>${text(line.productCode)}</td><td>${text(line.description)}</td>
      ${transfer ? `<td>${text(line.warehouse ?? "")}</td>` : ""}
      <td class="number">${unitCost.format(line.cost)}</td><td class="number">${amount.format(line.amount)}</td></tr>${customs}`
  }).join("")

  return `<!doctype html>
  <html lang="es-MX"><head><meta charset="utf-8"><title>${title} ${text(report.document)}</title><style>${styles}</style></head>
    <body>
      <header><strong>${text(report.companyName)}</strong><h1>${title}</h1></header>
      <dl>
        <dt>Documento</dt><dd>${text(report.document)}</dd>
        <dt>Lugar y fecha</dt><dd>${text([report.place, date].filter(Boolean).join(" · "))}</dd>
        ${transfer ? `<dt>Almacén origen</dt><dd>${text(report.sourceWarehouse ?? "")}</dd>` : ""}
        <dt>${warehouseLabel}</dt><dd>${text(warehouse)}</dd>
        <dt>${report.type === "SI" ? "Salida de" : "Referencia"}</dt><dd>${text(report.reference)}</dd>
      </dl>
      <table>
        <thead><tr><th class="number">#</th><th class="number">Cant.</th><th>Código</th><th>Descripción</th>${transfer ? "<th>Alm.</th>" : ""}<th class="number">Costo U.</th><th class="number">Importe</th></tr></thead>
        <tbody>${lines}</tbody>
        <tfoot><tr><td colspan="${columnCount - 1}" class="number">Total</td><td class="number">${amount.format(report.total)}</td></tr></tfoot>
      </table>
      <p class="comments"><strong>Comentarios</strong> ${text(report.comment)}</p>
      <div class="signatures"><p>Firma</p><p>Firma de aceptación</p></div>
    </body>
  </html>`
}
