import type { Product, ProductCustomerOrderItem } from "@/features/inventories/products/model"

type PrintableCustomerOrder = Pick<
  ProductCustomerOrderItem,
  "customerCode" | "customerName" | "orderedAt" | "orderNumber" | "quantity" | "fulfilled"
> & { remaining: number }

const columns = ["Código", "Cliente", "Fecha E", "Num", "Pedido", "Surtido", "Resta"]

const printStyles = `
  @page { margin: 14mm; }
  body { margin: 0; font: 10pt Arial, sans-serif; color: #000; }
  h1 { font-size: 13pt; margin: 0 0 12pt; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 3pt; text-align: left; vertical-align: top; }
  th { border-bottom: 1px solid #000; }
  tr { break-inside: avoid; }
  tfoot { display: table-row-group; font-weight: bold; }
  tfoot td { border-top: 1px solid #000; }
  thead :nth-child(n+5), tbody :nth-child(n+5), tfoot :nth-child(n+2) { text-align: right; }
`

export function printProductCustomerOrders(
  product: Pick<Product, "code" | "description">,
  items: readonly PrintableCustomerOrder[],
) {
  const frame = document.createElement("iframe")
  frame.title = "Documento de pedidos por cliente"
  frame.setAttribute("aria-hidden", "true")
  frame.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0"
  document.body.append(frame)

  try {
    const printDocument = frame.contentDocument
    const printWindow = frame.contentWindow
    if (!printDocument || !printWindow) {
      throw new Error("No fue posible preparar la vista de impresión.")
    }

    const title = `${product.code} ${product.description}`
    printDocument.documentElement.lang = "es"
    printDocument.title = title
    const heading = printDocument.createElement("h1")
    heading.textContent = title
    const style = printDocument.createElement("style")
    style.textContent = printStyles
    printDocument.head.append(style)

    const table = printDocument.createElement("table")
    const header = table.createTHead().insertRow()
    for (const label of columns) {
      const cell = printDocument.createElement("th")
      cell.scope = "col"
      cell.textContent = label
      header.append(cell)
    }
    const body = table.createTBody()
    const totals = { quantity: 0, fulfilled: 0, remaining: 0 }
    for (const item of items) {
      const row = body.insertRow()
      const values = [item.customerCode, item.customerName, item.orderedAt, item.orderNumber,
        item.quantity.toFixed(3), item.fulfilled.toFixed(3), item.remaining.toFixed(3)]
      for (const value of values) row.insertCell().textContent = value
      totals.quantity += item.quantity
      totals.fulfilled += item.fulfilled
      totals.remaining += item.remaining
    }
    const footer = table.createTFoot().insertRow()
    const label = footer.insertCell()
    label.colSpan = 4
    label.textContent = "Totales"
    for (const total of Object.values(totals)) footer.insertCell().textContent = total.toFixed(3)
    printDocument.body.append(heading, table)

    printWindow.addEventListener("afterprint", () => frame.remove(), { once: true })
    printWindow.print()
  } catch (error) {
    frame.remove()
    throw error
  }
}
