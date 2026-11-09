import ExcelJS from "exceljs"
import type { CollectionCommissions } from "@/features/sales/commissions/model"
import { addCollectionSettlementWorkbook } from "@/features/sales/commissions/services/collection-settlement-workbook"
import { addInvoiceRow, addInvoiceTotals, createCollectionSheet, invoiceHeaders, orderedInvoices } from "@/features/sales/commissions/services/collection-workbook-layout"

export function createCollectionCommissionsWorkbook(report: CollectionCommissions) {
  const book = new ExcelJS.Workbook()
  book.creator = "TUVANSA ERP"
  book.created = new Date(report.generatedAt)
  book.calcProperties.fullCalcOnLoad = true
  const detail = createCollectionSheet(book, report, "Ventas por agente", ["Agente", ...invoiceHeaders])
  const subtotals: number[] = []
  for (const agent of report.agents) {
    const heading = detail.addRow([`Agente ${agent.code} · ${agent.name}`])
    detail.mergeCells(heading.number, 1, heading.number, 14)
    heading.font = { bold: true }
    const first = detail.rowCount + 1
    for (const invoice of orderedInvoices(report, agent.code)) addInvoiceRow(detail, invoice, true)
    const last = detail.rowCount
    const row = detail.addRow([`Subtotal agente ${agent.code}`])
    addInvoiceTotals(detail, row.number, agent, 1, col => `${col}${first}:${col}${last}`)
    subtotals.push(row.number)
  }
  const total = detail.addRow(["TOTAL GENERAL"])
  addInvoiceTotals(detail, total.number, report.totals, 1, col => subtotals.map(r => `${col}${r}`).join(","))
  addCollectionSettlementWorkbook(book, report)
  return book
}
