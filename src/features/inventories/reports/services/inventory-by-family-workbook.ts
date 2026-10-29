import ExcelJS, { type PaperSize } from "exceljs"
import type { InventoryByFamily } from "@/features/inventories/reports/model"

export function createInventoryByFamilyWorkbook(report: InventoryByFamily) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "TUVANSA ERP"
  workbook.created = new Date(report.generatedAt)
  const cover = (name: string, headers: string[]) => {
    const sheet = workbook.addWorksheet(name)
    sheet.addRow([report.company]); sheet.addRow([report.title + " al " + report.criteria.asOf])
    sheet.addRow([report.criteria.warehouse + " · " + report.warehouseName])
    sheet.addRow([report.provisional ? "PROVISIONAL · " + report.undatedMovements + " movimientos sin fecha verificable" : "Historial fechado"])
    sheet.addRow([]); sheet.addRow(headers)
    sheet.views = [{ state: "frozen", ySplit: 6 }]
    sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: headers.length } }
    sheet.pageSetup = { paperSize: 1 as PaperSize, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:6" }
    sheet.getRow(6).font = { bold: true, color: { argb: "FFFFFFFF" } }
    sheet.getRow(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF03699E" } }
    sheet.getRow(4).font = { bold: true, color: { argb: report.provisional ? "FF92400E" : "FF166534" } }
    return sheet
  }
  const summary = cover("Familias", ["Familia IFAMB", "Descripción", "UM", "Entradas", "Salidas", "Existencia fechada", "Sin fecha (±)", "Mov. sin fecha"])
  for (const group of report.groups) for (const row of group.totals) summary.addRow([group.code, group.name, row.unit, row.incoming, row.outgoing, row.quantity, row.undatedQuantity, row.undatedMovements])
  const totals = cover("Totales por unidad", ["UM", "Entradas", "Salidas", "Existencia fechada", "Sin fecha (±)", "Mov. sin fecha"])
  for (const row of report.totals) totals.addRow([row.unit, row.incoming, row.outgoing, row.quantity, row.undatedQuantity, row.undatedMovements])
  const detail = cover("Productos", ["Familia IFAMB", "Familia", "Código", "Descripción", "Almacén", "UM", "Entradas", "Salidas", "Existencia fechada", "Sin fecha (±)", "Mov. sin fecha", "Primer movimiento", "Último movimiento", "ISEQ"])
  for (const group of report.groups) for (const row of group.products) detail.addRow([row.family, row.familyName, row.code, row.description, row.warehouse, row.unit, row.incoming, row.outgoing, row.quantity, row.undatedQuantity, row.undatedMovements, row.firstDate, row.lastDate, row.productId])
  const notes = workbook.addWorksheet("Criterios")
  report.notes.forEach(note => notes.addRow([note]))
  notes.getColumn(1).width = 120
  notes.eachRow(row => { row.alignment = { wrapText: true, vertical: "top" }; row.height = 42 })
  for (const sheet of [summary, totals, detail]) {
    sheet.columns.forEach((column, index) => { column.width = index === 1 ? 30 : sheet === detail && index === 3 ? 60 : 19 })
    sheet.eachRow((row, index) => {
      if (index < 7) return
      row.eachCell(cell => { if (typeof cell.value === "number") cell.numFmt = "#,##0.000;[Red]-#,##0.000;0.000" })
    })
  }
  // Keep identifiers as text. Counts and ISEQ are integers, quantities have three decimals.
  detail.getColumn(11).numFmt = "0"; detail.getColumn(14).numFmt = "0"
  summary.getColumn(8).numFmt = "0"; totals.getColumn(6).numFmt = "0"
  return workbook
}
