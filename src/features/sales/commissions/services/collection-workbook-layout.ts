import type ExcelJS from "exceljs"
import type { CollectionCommissions, CollectionInvoice, CollectionTotals } from "@/features/sales/commissions/model"

export const collectionExcelMoney = '"$"#,##0.00;[Red]-"$"#,##0.00;"$"0.00'
export const invoiceHeaders = ["Cliente", "Fecha documento", "Fecha pago", "Factura", "Días", "Subtotal", "Devoluciones", "Total", "Pago", "Costo", "Costo real", "Utilidad", "%%"]
export function orderedInvoices(report: CollectionCommissions, code: string) {
  return report.invoices.filter(r => r.agentCode === code)
    .sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number) || a.id - b.id)
}
export function excelFormula(sheet: ExcelJS.Worksheet, address: string, formula: string, result: number | null) {
  sheet.getCell(address).value = { formula, result: result ?? "" }
}
export function createCollectionSheet(book: ExcelJS.Workbook, report: CollectionCommissions, name: string, headers: string[]) {
  const sheet = book.addWorksheet(name)
  sheet.addRow([report.company])
  sheet.addRow([name])
  sheet.addRow([`Sucursal: ${report.branchName} · Pagos del ${report.criteria.from} al ${report.criteria.to}`])
  sheet.addRow(["Facturas ordenadas por fecha del documento. Pago sin IVA en positivo. Costo real proporcional al pago original."])
  sheet.addRow([report.settlement.ready ? "Liquidación calculada con los parámetros seleccionados." : "PENDIENTE: confirma modalidad del 1% y planes en Liquidación y ajustes. Importes no disponibles: celdas vacías."])
  sheet.addRow(headers)
  for (let r = 1; r <= 5; r++) {
    sheet.mergeCells(r, 1, r, headers.length)
    sheet.getRow(r).height = r >= 4 ? 30 : 24
    sheet.getRow(r).alignment = { wrapText: true, vertical: "middle" }
  }
  sheet.getRow(2).font = { bold: true, size: 14 }
  sheet.getRow(6).font = { bold: true }
  sheet.getRow(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1F6BA" } }
  sheet.getRow(6).alignment = { wrapText: true, vertical: "middle", horizontal: "center" }
  sheet.getRow(6).height = 38
  const offset = headers[0] === "Agente" ? 1 : 0
  sheet.columns.forEach(col => { col.width = 18 })
  if (offset) sheet.getColumn(1).width = 32
  sheet.getColumn(1 + offset).width = 48
  for (const col of [2, 3]) { sheet.getColumn(col + offset).width = 16; sheet.getColumn(col + offset).numFmt = "dd/mm/yyyy" }
  sheet.getColumn(4 + offset).width = 18
  sheet.getColumn(5 + offset).width = 8
  for (let col = 6; col <= 12; col++) sheet.getColumn(col + offset).numFmt = collectionExcelMoney
  sheet.getColumn(13 + offset).numFmt = "0.00%"
  sheet.views = [{ state: "frozen", ySplit: 6 }]
  sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: headers.length } }
  sheet.pageSetup = { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:6" }
  return sheet
}
export function addInvoiceRow(sheet: ExcelJS.Worksheet, row: CollectionInvoice, includeAgent = false) {
  sheet.addRow([...(includeAgent ? [row.agentName] : []), row.customerName,
    new Date(row.date + "T00:00:00Z"), new Date(row.lastPaymentDate + "T00:00:00Z"), row.number, row.days,
    row.subtotalAmount, row.returnAmount, row.totalAmount, row.displayPaymentAmount, row.cost, row.realCost, row.profit,
    row.margin === null ? null : row.margin / 100])
}
export function addInvoiceTotals(sheet: ExcelJS.Worksheet, row: number, totals: CollectionTotals, offset: number, range: (col: string) => string) {
  for (const [col, result] of [[6, totals.subtotal], [7, totals.returns], [8, totals.total], [9, totals.displayPayment], [10, totals.cost], [11, totals.realCost], [12, totals.profit]] as const) {
    const column = sheet.getColumn(col + offset).letter
    const refs = range(column)
    excelFormula(sheet, `${column}${row}`, result === null ? '""' : refs ? `ROUND(SUM(${refs}),2)` : "0", result)
  }
  sheet.getRow(row).font = { bold: true }
  sheet.getRow(row).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
}
