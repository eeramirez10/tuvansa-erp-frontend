import type { PurchaseOrder, PurchaseOrderLine } from "@/features/purchasing/purchase-orders/model"

type PrintAddress = {
  name?: string
  taxId?: string
  address?: readonly string[]
}

type PrintLine = {
  listPrice?: number
  unitPrice?: number
  total?: number
  weight?: number
}

export type PurchaseOrderPrintDetails = {
  reportName?: string
  company?: PrintAddress
  delivery?: PrintAddress
  supplier?: PrintAddress
  orderedBy?: string
  approvedBy?: string
  approvalRole?: string
  branchName?: string
  termDays?: number
  requisition?: string
  currency?: string
  comments?: readonly string[]
  lineDetails?: Readonly<Record<number, PrintLine>>
  totals?: { subtotal?: number; tax?: number; total?: number }
}

export type PurchaseOrderPrintOptions = {
  confirmed?: boolean
  details?: PurchaseOrderPrintDetails
}

const styles = `
  @page { size: letter; margin: 16mm 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #171717; background: #fff; font: 10pt/1.35 Arial, sans-serif; }
  h1, h2, p, dl, dd { margin: 0; }
  h1 { font-size: 18pt; line-height: 1.15; }
  .title { display: grid; grid-template-columns: 1fr auto; align-items: start; gap: 14pt; padding-bottom: 12pt; border-bottom: 2pt solid #222; }
  .company { font-weight: bold; margin-bottom: 4pt; }
  .branch { margin-top: 4pt; }
  .document-number { min-width: 105pt; text-align: right; }
  .document-number strong { display: block; font-size: 16pt; }
  .metadata { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 9pt; padding: 11pt 0; }
  dt, .label { font-weight: bold; font-size: 8pt; }
  .addresses { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12pt; padding: 8pt 0 14pt; border-top: 1px solid #999; }
  .addresses h2 { margin-bottom: 3pt; font-size: 9pt; }
  address { font-style: normal; overflow-wrap: anywhere; }
  .currency { text-align: right; margin-bottom: 4pt; }
  table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  thead { display: table-header-group; }
  th, td { border: 1px solid #686868; padding: 4pt; text-align: left; vertical-align: top; }
  th { font-weight: bold; background: #eee; print-color-adjust: exact; }
  tr { break-inside: avoid; }
  tbody tr:nth-child(n+2) td { border-top-color: #999; }
  .number { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .footer { display: grid; grid-template-columns: 1.5fr 1fr; column-gap: 18pt; margin-top: 16pt; break-inside: avoid; }
  .notes p { white-space: pre-wrap; overflow-wrap: anywhere; }
  .notes .requirement { font-weight: bold; margin-top: 8pt; }
  .totals { display: grid; grid-template-columns: 1fr auto; align-content: start; gap: 2pt 9pt; }
  .totals .grand-total { border-top: 1px solid #333; margin-top: 3pt; padding-top: 3pt; }
  .signatures { display: flex; gap: 28pt; margin-top: 24pt; break-inside: avoid; }
  .signatures div { width: 125pt; border-top: 1px solid #222; padding: 4pt 0; text-align: center; font-size: 8pt; }
  .signatures strong { display: block; margin-bottom: 2pt; }
  .reference { margin-top: 9pt; font-size: 8pt; }
  @media screen { body { max-width: 190mm; margin: 16mm auto; padding: 0 8mm; } }
`

const text = (value: string | number | undefined) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;")

const date = (value: string | null) => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "")
  return parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : (value ?? "")
}

const quantityFormat = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const decimal = (value: number | undefined) => value === undefined ? "" : quantityFormat.format(value)

const addressBlock = (label: string, address?: PrintAddress) => `
  <section>
    <h2>${text(label)}</h2>
    <address><strong>${text(address?.name)}</strong>
    ${[address?.taxId, ...(address?.address ?? [])].filter(Boolean).map((line) => `<div>${text(line)}</div>`).join("")}
    </address>
  </section>`

function printLine(
  line: PurchaseOrderLine,
  order: number,
  confirmed: boolean,
  monterrey: boolean,
  detail: PrintLine | undefined,
) {
  return `<tr>
    <td class="number">${order}</td>
    <td class="number">${decimal(confirmed ? line.assigned : Math.abs(line.ordered))}</td>
    ${monterrey ? "" : `<td>${text(line.productCode)}</td>`}
    <td>${text(line.unit)}</td>
    <td>${text(line.description)}</td>
    ${monterrey ? "" : `<td class="number">${decimal(detail ? detail.listPrice : line.price)}</td>
    <td class="number">${decimal(line.discount || undefined)}</td>`}
    <td class="number">${decimal(detail?.unitPrice)}</td>
    <td class="number">${decimal(detail?.total)}</td>
  </tr>`
}

export function buildPurchaseOrderPrintDocument(
  purchaseOrder: PurchaseOrder,
  { confirmed = false, details = {} }: PurchaseOrderPrintOptions = {},
) {
  const reportName = details.reportName ?? (confirmed ? "QTUVANSA004A" : "QTUVANSA004")
  if (reportName !== "QTUVANSA004" && reportName !== "QTUVANSA004A") {
    throw new Error(`El formato de impresión ${reportName} no está disponible.`)
  }
  const monterrey = reportName === "QTUVANSA004A"
  const title = "Orden de compra"
  const lines = confirmed ? purchaseOrder.lines.filter((line) => line.assigned > 0) : purchaseOrder.lines
  const rows = lines.map((line, index) => printLine(line, index + 1, confirmed, monterrey, details.lineDetails?.[line.id]))
  const columns = monterrey
    ? ["Partida", "Cant.", "Unidad", "Descripción", "P. Unitario", "Importe"]
    : ["Par", "Cant.", "Código", "UM", "Descripción", "P. Lista", "Dcto", "P. Unit.", "Total"]
  const { subtotal, discount, exciseTax, freight, insurance, other, tax, total } = purchaseOrder.totals
  const totals = monterrey || confirmed
    ? [
        { label: "Sub-total", amount: details.totals?.subtotal ?? (confirmed ? undefined : subtotal) },
        { label: "IVA", amount: details.totals?.tax ?? (confirmed ? undefined : tax) },
      ]
    : [
        { label: "Sub-total", amount: details.totals?.subtotal ?? subtotal },
        { label: "Descuento", amount: discount },
        { label: "IEPS", amount: exciseTax },
        { label: "Flete", amount: freight },
        { label: "Seguro", amount: insurance },
        { label: purchaseOrder.otherLabel || "Otros", amount: other },
        { label: "IVA", amount: details.totals?.tax ?? tax },
      ].filter(({ label, amount }) => label === "Sub-total" || amount !== 0)
  const supplier = {
    ...details.supplier,
    name: [purchaseOrder.supplier.code, details.supplier?.name ?? purchaseOrder.supplier.name].filter(Boolean).join(" "),
  }
  const weights = lines.map((line) => details.lineDetails?.[line.id]?.weight)
  const weight = lines.length && weights.every((value) => value !== undefined)
    ? weights.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : undefined

  return `<!doctype html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${title} ${text(purchaseOrder.number)}</title>
      <style>${styles}</style>
    </head>
    <body data-format="${reportName}">
      <main>
        <header class="title">
          <div>
            <p class="company">${text(details.company?.name)}</p>
            <h1>${title}</h1>
            <p class="branch">${text(details.branchName)}</p>
          </div>
          <p class="document-number"><span class="label">Orden No.</span><strong>${text(purchaseOrder.number)}</strong></p>
        </header>
        <dl class="metadata">
          <div><dt>Fecha</dt><dd>${text(date(purchaseOrder.dates.orderedAt))}</dd></div>
          <div><dt>Fecha de entrega</dt><dd>${text(date(purchaseOrder.dates.dueAt))}</dd></div>
          <div><dt>Plazo</dt><dd>${details.termDays === undefined ? "" : `${text(details.termDays)} días`}</dd></div>
          <div><dt>Requisición</dt><dd>${text(details.requisition)}</dd></div>
          <div><dt>Ordenado por</dt><dd>${text(details.orderedBy)}</dd></div>
        </dl>
        <div class="addresses">
          ${addressBlock("Facturar a", details.company)}
          ${addressBlock("Entregar en", details.delivery)}
          ${addressBlock("Proveedor", supplier)}
        </div>
        ${details.currency ? `<p class="currency"><strong>Moneda</strong> ${text(details.currency)}</p>` : ""}
        <table aria-label="Partidas de la orden">
          <thead><tr>${columns.map((column) => `<th scope="col">${column}</th>`).join("")}</tr></thead>
          <tbody>${rows.length ? rows.join("") : `<tr><td colspan="${columns.length}">${confirmed ? "Sin partidas confirmadas." : "Sin partidas."}</td></tr>`}</tbody>
        </table>
        <footer>
          <div class="footer">
            <section class="notes">
              ${details.comments?.map((comment) => `<p>${text(comment)}</p>`).join("") ?? ""}
              ${monterrey ? "" : '<p class="requirement">EL MATERIAL NO SE RECIBE SIN CERTIFICADOS DE CALIDAD</p>'}
            </section>
            <dl class="totals">
              ${weight === undefined ? "" : `<dt>Total peso en kilos</dt><dd class="number">${decimal(weight)}</dd>`}
              ${totals.map(({ label, amount }) => `<dt>${text(label)}</dt><dd class="number">${decimal(amount)}</dd>`).join("")}
              <dt class="grand-total">Total</dt>
              <dd class="grand-total number">${decimal(details.totals?.total ?? (confirmed ? undefined : total))}</dd>
            </dl>
          </div>
          ${monterrey
            ? `<div class="signatures">
                <div><strong>${text(details.orderedBy)}</strong>CAPTURA</div>
                <div><strong>${text(details.approvedBy)}</strong>${text(details.approvalRole ?? "GERENTE DE COMPRAS")}</div>
              </div>`
            : '<div class="signatures"><div>DEPTO. DE COMPRAS</div><div>GTE. DE COMPRAS</div></div>'}
          <p class="reference">TF-AD-01</p>
        </footer>
      </main>
    </body>
    </html>`
}

export function printPurchaseOrder(purchaseOrder: PurchaseOrder, options?: PurchaseOrderPrintOptions) {
  return printPurchaseOrderDocument(buildPurchaseOrderPrintDocument(purchaseOrder, options), "Documento de orden de compra")
}

export function printPurchaseOrderDocument(html: string, title: string) {
  const frame = document.createElement("iframe")
  frame.title = title
  frame.setAttribute("aria-hidden", "true")
  frame.style.cssText = "position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0"
  frame.srcdoc = html

  return new Promise<void>((resolve, reject) => {
    const fail = () => {
      frame.remove()
      reject(new Error("No fue posible abrir la vista de impresión."))
    }
    frame.addEventListener("error", fail, { once: true })
    frame.addEventListener("load", () => {
      const printWindow = frame.contentWindow
      if (!printWindow) {
        fail()
        return
      }

      try {
        printWindow.addEventListener("afterprint", () => frame.remove(), { once: true })
        printWindow.print()
        resolve()
      } catch {
        fail()
      }
    }, { once: true })
    document.body.append(frame)
  })
}
