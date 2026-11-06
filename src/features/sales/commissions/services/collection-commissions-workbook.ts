import ExcelJS from "exceljs"
import type { CollectionCommissions } from "@/features/sales/commissions/model"
import { collectionHeaders } from "@/features/sales/commissions/logic"
const money = '"$"#,##0.00;[Red]-"$"#,##0.00;"$"0.00'
export function createCollectionCommissionsWorkbook(report: CollectionCommissions) {
  const book = new ExcelJS.Workbook(); book.creator = "TUVANSA ERP"; book.created = new Date(report.generatedAt); book.calcProperties.fullCalcOnLoad = true
  const create = (name: string, headers: string[]) => {
    const sheet = book.addWorksheet(name)
    sheet.addRow([report.company]); sheet.addRow([report.title + " — PRELIMINAR"])
    sheet.addRow([`Pagos PA del ${report.criteria.from} al ${report.criteria.to} · Sucursal: ${report.criteria.branch} · Agente: ${report.criteria.agent}`])
    sheet.addRow(["Costos, utilidad, LM y comisión pendientes del procedimiento faltante. Las celdas vacías no significan cero."])
    sheet.addRow(["Fechas de FAX.AFECHA; pagos y devoluciones sin IVA. Se conservan signos. Detalle y criterios en las demás hojas."])
    sheet.addRow(headers)
    for (let row = 1; row <= 5; row++) { sheet.mergeCells(row, 1, row, headers.length); sheet.getRow(row).height = row === 4 ? 36 : 25; sheet.getRow(row).alignment = { wrapText: true, vertical: "middle" } }
    sheet.getRow(2).font = { bold: true, color: { argb: "FFB45309" } }
    sheet.getRow(6).font = { bold: true }; sheet.getRow(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1F6BA" } }
    sheet.views = [{ state: "frozen", ySplit: 6 }]; sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: headers.length } }
    sheet.columns.forEach(column => { column.width = 19 }); sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:6" }
    return sheet
  }
  const detail = create("Comisiones", collectionHeaders)
  for (const row of report.invoices) detail.addRow([row.agentName, row.customerName, new Date(row.date + "T00:00:00Z"), new Date(row.lastPaymentDate + "T00:00:00Z"), row.number, row.days,
    row.subtotalAmount, row.returnAmount, row.totalAmount, row.paymentAmount, null, null, null, null, row.freightAmount, row.newCustomer, null, null])
  detail.getColumn(1).width = 32; detail.getColumn(2).width = 50
  for (const col of [3, 4]) detail.getColumn(col).numFmt = "dd/mm/yyyy"
  for (const col of [7, 8, 9, 10, 11, 12, 13, 15, 18]) detail.getColumn(col).numFmt = money
  const last = detail.rowCount, total = detail.addRow(["TOTAL"])
  for (const [col, result] of [[7, report.totals.subtotal], [8, report.totals.returns], [9, report.totals.total], [10, report.totals.payment], [15, report.totals.freight]] as const) {
    if (result !== null) { const letter = detail.getColumn(col).letter; total.getCell(col).value = { formula: last >= 7 ? `ROUND(SUM(${letter}7:${letter}${last}),2)` : "0", result } }
  }
  total.font = { bold: true, color: { argb: "FFB91C1C" } }
  const summary = create("Resumen agentes", ["Código", "Agente", "Facturas", "Pagos PA", "Subtotal", "Devoluciones", "Total", "Pago", "Fletes"])
  report.agents.forEach(row => summary.addRow([row.code, row.name, row.invoices, row.payments, row.subtotal, row.returns, row.total, row.payment, row.freight]))
  summary.getColumn(2).width = 40; for (let col = 5; col <= 9; col++) summary.getColumn(col).numFmt = money
  const invoiceMap = new Map(report.invoices.map(row => [row.id, row]))
  const movements = create("Movimientos FAX", ["ASEQ", "DSEQ", "Factura", "Fecha", "Tipo", "ACANT con IVA", "% IVA", "Importe sin IVA", "Referencia", "Importe exacto sin IVA (texto)"])
  report.movements.forEach(row => movements.addRow([row.id, row.invoiceId, invoiceMap.get(row.invoiceId)?.number, new Date(row.date + "T00:00:00Z"), row.type,
    Number(row.amount), Number(row.vatRate), row.withoutVat === null ? null : Number(row.withoutVat), row.reference, row.withoutVat]))
  movements.getColumn(4).numFmt = "dd/mm/yyyy"; movements.getColumn(6).numFmt = money; movements.getColumn(8).numFmt = "0.00000000"; movements.getColumn(10).width = 33
  const products = create("Partidas origen", ["AISEQ", "DSEQ", "Factura", "ISEQ", "Código", "Descripción", "IFAMB", "AICANT", "AICANTF", "AIPRECIO", "AICOSTO unitario de origen", "AIMES"])
  report.products.forEach(row => products.addRow([row.id, row.invoiceId, invoiceMap.get(row.invoiceId)?.number, row.productId, row.code, row.description,
    row.family, Number(row.quantity), Number(row.billedQuantity), Number(row.price), Number(row.unitCost), row.applied]))
  products.getColumn(6).width = 65; for (const col of [8, 9]) products.getColumn(col).numFmt = "0.000"; for (const col of [10, 11]) products.getColumn(col).numFmt = "0.00000"
  const criteria = book.addWorksheet("Criterios"); report.notes.forEach(note => criteria.addRow([note])); criteria.getColumn(1).width = 145
  criteria.eachRow(row => { row.alignment = { wrapText: true, vertical: "top" }; row.height = 42 })
  return book
}
