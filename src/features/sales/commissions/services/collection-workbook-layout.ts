import type ExcelJS from "exceljs"
import type { CollectionCommissions, CollectionInvoice, CollectionTotals } from "@/features/sales/commissions/model"
import { collectionDocumentLabel } from "@/features/sales/commissions/document-label"

export const collectionExcelMoney = '"$"#,##0.00;[Red]-"$"#,##0.00;"$"0.00'
export const invoiceHeaders = ["Cliente", "Fecha documento", "Fecha pago / ajuste", "Factura", "Días", "Subtotal", "Devoluciones", "Notas de crédito", "Total", "Pago / ajuste", "Costo", "Costo real", "Utilidad", "%%", "Cliente nuevo", "1% de lo pagado"]
export function newCustomerBonusTotal(invoices: CollectionInvoice[]) {
  const groups = new Map<string, number>()
  for (const invoice of invoices) {
    if (invoice.customerStatus !== "Nuevo") continue
    if (invoice.customerBonus === null) return null
    groups.set(invoice.agentCode, (groups.get(invoice.agentCode) ?? 0) + Math.round(invoice.customerBonus * 10_000))
  }
  // Keep document precision, round once per agent, then sum the rounded amounts.
  return [...groups.values()].reduce((total, value) => total + Math.sign(value) * Math.round(Math.abs(value) / 100), 0) / 100
}
export function orderedInvoices(report: CollectionCommissions, code: string) {
  return report.invoices.filter(r => r.agentCode === code)
    .sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number) || a.eventDate.localeCompare(b.eventDate) || a.rowKey.localeCompare(b.rowKey))
}
export function excelFormula(sheet: ExcelJS.Worksheet, address: string, formula: string, result: number | null) {
  sheet.getCell(address).value = { formula, result: result ?? "" }
}
export function createCollectionSheet(book: ExcelJS.Workbook, report: CollectionCommissions, name: string, headers: string[]) {
  const sheet = book.addWorksheet(name)
  sheet.addRow([report.company])
  sheet.addRow([name])
  const scoped = report.criteria.customerId !== undefined || report.criteria.agent !== "all"
  const agent = report.criteria.agent === "all" ? "Todos" : `${report.criteria.agent} · ${report.agents.find(a => a.code === report.criteria.agent)?.name ?? "Sin movimientos"}`
  const customer = report.criteria.customerId === undefined ? "Todos" : report.invoices[0] ? `${report.invoices[0].customerCode} · ${report.invoices[0].customerName}` : `ID ${report.criteria.customerId}`
  sheet.addRow([`Sucursal: ${report.branchName} · Movimientos del ${report.criteria.from} al ${report.criteria.to}${scoped ? `\nAgente: ${agent} · Cliente: ${customer}` : ""}`])
  sheet.addRow(["Cobros PA y ajustes por fecha del auxiliar. Cancelaciones, devoluciones D y notas C disminuyen en negativo; REVISAR señala conciliación. Importes sin IVA."])
  sheet.addRow([report.settlement.ready ? "Liquidación calculada con los parámetros seleccionados." : "PENDIENTE: confirma modalidad del 1% y planes en Liquidación y ajustes. Importes no disponibles: celdas vacías."])
  sheet.addRow(headers)
  for (let r = 1; r <= 5; r++) {
    sheet.mergeCells(r, 1, r, headers.length)
    sheet.getRow(r).height = r >= 4 ? 30 : 24
    sheet.getRow(r).alignment = { wrapText: true, vertical: "middle" }
  }
  if (scoped) sheet.getRow(3).height = 42
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
  for (let col = 6; col <= 13; col++) sheet.getColumn(col + offset).numFmt = collectionExcelMoney
  sheet.getColumn(14 + offset).numFmt = "0.00%"
  sheet.getColumn(16 + offset).numFmt = collectionExcelMoney
  if (headers.includes("Cliente nuevo")) {
    sheet.getCell(6, 15 + offset).note = 'Sólo muestra "nuevo" para la marca actual Nuevo. Las demás clasificaciones quedan vacías.'
    sheet.getCell(6, 16 + offset).note = "1% del pago sin IVA sólo de clientes Nuevos. Cuatro decimales por documento; subtotales redondeados por agente. La liquidación conserva también el incentivo de clientes recuperados."
    sheet.getCell(6, 8 + offset).note = "Notas C sin IVA, con signo negativo. Sus cancelaciones compensan en positivo. Se asignan al vendedor de la última factura vigente del mismo cliente y compañía al cierre; catálogo del cliente como alternativa. La nota del folio conserva el agente original."
  }
  sheet.views = [{ state: "frozen", ySplit: 6 }]
  sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: headers.length } }
  sheet.pageSetup = { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:6" }
  return sheet
}
export function addInvoiceRow(sheet: ExcelJS.Worksheet, row: CollectionInvoice, includeAgent = false) {
  const line = sheet.addRow([...(includeAgent ? [row.agentName] : []), row.customerName,
    new Date(row.date + "T00:00:00Z"), new Date(row.lastPaymentDate + "T00:00:00Z"), collectionDocumentLabel(row), row.days,
    row.subtotalAmount, row.returnAmount, row.creditNoteAmount, row.totalAmount, row.displayPaymentAmount, row.cost, row.realCost, row.profit,
    row.margin === null ? null : row.margin / 100,
    row.customerStatus === "Nuevo" ? "nuevo" : null,
    row.customerStatus === "Nuevo" ? row.customerBonus : null])
  line.getCell(16 + (includeAgent ? 1 : 0)).numFmt = '"$"#,##0.0000;[Red]-"$"#,##0.0000;"$"0.0000'
  if (row.canceled || row.reviewRequired) {
    const folio = line.getCell(4 + (includeAgent ? 1 : 0))
    folio.font = { bold: true, color: { argb: "FFB91C1C" } }
    folio.alignment = { wrapText: true, vertical: "middle" }
    folio.note = row.reviewRequired ? `Movimiento ${row.sourceMovementId}, ${row.eventDate}. Factura relacionada: ${row.relatedInvoiceNumber ?? "sin identificar"}. Agente original: ${row.originalAgentCode} (${row.originalAgentName}). Agente del reporte: ${row.agentCode} (${row.agentName}). ${row.reviewReasons.join(" ")}`
      : "Estado actual: cancelada. Este renglón conserva el pago en su fecha original; la disminución se registra por separado en la fecha del movimiento K."
    line.height = row.reviewRequired ? 45 : 30
    if (row.reviewRequired) line.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7ED" } }
  }
}
export function addInvoiceTotals(sheet: ExcelJS.Worksheet, row: number, totals: CollectionTotals, offset: number, range: (col: string) => string, newCustomerBonus: number | null) {
  for (const [col, result] of [[6, totals.subtotal], [7, totals.returns], [8, totals.creditNotes], [9, totals.total], [10, totals.displayPayment], [11, totals.cost], [12, totals.realCost], [13, totals.profit], [16, newCustomerBonus]] as const) {
    const column = sheet.getColumn(col + offset).letter
    const refs = range(column)
    excelFormula(sheet, `${column}${row}`, result === null ? '""' : refs ? `ROUND(SUM(${refs}),2)` : "0", result)
  }
  sheet.getRow(row).font = { bold: true }
  sheet.getRow(row).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
}
