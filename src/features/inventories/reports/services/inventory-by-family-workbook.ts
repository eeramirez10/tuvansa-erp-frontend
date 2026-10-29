import ExcelJS, { type PaperSize } from "exceljs"
import type { InventoryByFamily } from "@/features/inventories/reports/model"

const numberFormat = "#,##0.000;[Red]-#,##0.000;0.000"
export function createInventoryByFamilyWorkbook(report: InventoryByFamily) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "TUVANSA ERP"
  workbook.created = new Date(report.generatedAt)
  workbook.calcProperties.fullCalcOnLoad = true
  const cover = (name: string, headers: string[]) => {
    const sheet = workbook.addWorksheet(name)
    sheet.addRow([report.company]); sheet.addRow([report.title + " al " + report.criteria.asOf + " · Metros estimados"])
    sheet.addRow([report.criteria.warehouse + " · " + report.warehouseName])
    sheet.addRow([report.provisional ? "PROVISIONAL · " + report.undatedMovements + " movimientos sin fecha verificable" : "Historial fechado"])
    sheet.addRow(["Equivalencia estimada: 1 TR / PZ = 6.40 m; M = 1 m; FT = 0.3048 m. Unidades sin equivalencia excluidas de metros."])
    sheet.addRow(headers)
    sheet.views = [{ state: "frozen", ySplit: 6 }]
    sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: headers.length } }
    sheet.pageSetup = { paperSize: 1 as PaperSize, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:6" }
    sheet.getRow(6).font = { name: "Arial Narrow", size: 10, bold: true }
    sheet.getRow(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1F6BA" } }
    sheet.getRow(4).font = { bold: true, color: { argb: report.provisional ? "FF92400E" : "FF166534" } }
    return sheet
  }
  const year = report.criteria.asOf.slice(0, 4)
  const summary = cover("Familias", ["N.º", "PRODUCTO / FAMILIA", ...report.meterColumns.flatMap(column => [column.name.replace(/^SUC[.]?\s*/i, "") + " " + year, "%"]), "TOTAL INVENTARIO " + year, "%"])
  const end = 6 + report.groups.length
  const totalRow = end + 1
  const totalColumn = 3 + report.meterColumns.length * 2
  report.groups.forEach((group, index) => {
    const row = summary.getRow(index + 7)
    row.getCell(1).value = index + 1; row.getCell(2).value = group.name
    const amountRefs: string[] = []
    group.byWarehouse.forEach((value, column) => {
      const amount = row.getCell(3 + column * 2)
      amount.value = value.quantity; amount.numFmt = numberFormat
      amountRefs.push(amount.address)
      row.getCell(4 + column * 2).value = { formula: `IFERROR(${amount.address}/${summary.getCell(totalRow, 3 + column * 2).address},"")`, result: value.percentage === null ? "" : value.percentage / 100 }
      row.getCell(4 + column * 2).numFmt = "0.00%"
    })
    row.getCell(totalColumn).value = { formula: amountRefs.length ? `ROUND(SUM(${amountRefs.join(",")}),7)` : "0", result: group.meters.quantity }
    row.getCell(totalColumn).numFmt = numberFormat
    row.getCell(totalColumn + 1).value = { formula: `IFERROR(${row.getCell(totalColumn).address}/${summary.getCell(totalRow, totalColumn).address},"")`, result: group.percentage === null ? "" : group.percentage / 100 }
    row.getCell(totalColumn + 1).numFmt = "0.00%"
  })
  summary.getCell(totalRow, 2).value = "TOTAL INVENTARIO POR FAMILIA"
  for (let column = 3; column <= totalColumn + 1; column++) {
    const cell = summary.getCell(totalRow, column)
    const letter = summary.getColumn(column).letter
    if (column % 2 === 1) {
      const amount = column === totalColumn ? report.meters.quantity : report.meterTotals[(column - 3) / 2]!.quantity
      cell.value = { formula: report.groups.length ? `ROUND(SUM(${letter}7:${letter}${end}),7)` : "0", result: amount }
      cell.numFmt = numberFormat
    } else {
      const previous = summary.getCell(totalRow, column - 1)
      const amount = column === totalColumn + 1 ? report.meters.quantity : report.meterTotals[(column - 4) / 2]!.quantity
      cell.value = { formula: `IF(${previous.address}=0,"",1)`, result: amount === 0 ? "" : 1 }; cell.numFmt = "0.00%"
    }
  }
  summary.autoFilter = { from: { row: 6, column: 1 }, to: { row: Math.max(6, end), column: totalColumn + 1 } }
  summary.views = [{ state: "frozen", ySplit: 6, xSplit: 2 }]
  summary.eachRow((row, index) => {
    if (index < 6) return
    row.height = index === totalRow ? 30 : 19
    row.eachCell({ includeEmpty: true }, (cell, column) => {
      cell.border = { left: { style: "thin" }, right: { style: "thin" }, top: { style: "thin" }, bottom: { style: index === totalRow ? "double" : "thin" } }
      cell.font = { name: "Arial Narrow", size: 11, bold: index === 6 || index === totalRow, ...(index === totalRow ? { color: { argb: "FFB91C1C" } } : {}) }
      cell.alignment = { vertical: "middle", horizontal: column <= 2 ? "left" : "right", wrapText: index === 6 || index === totalRow }
      if (index > 6 && column > 2 && index !== totalRow) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7EB" } }
    })
  })
  summary.getColumn(1).width = 5; summary.getColumn(2).width = 39
  for (let column = 3; column <= totalColumn + 1; column++) summary.getColumn(column).width = column % 2 === 1 ? 22 : 11
  const raw = cover("Unidades originales", ["IFAMB", "Familia", "UM", "Entradas UM", "Salidas UM", "Existencia UM", "Sin fecha UM (±)", "Mov. sin fecha"])
  for (const group of report.groups) for (const row of group.totals) raw.addRow([group.code, group.name, row.unit, row.incoming, row.outgoing, row.quantity, row.undatedQuantity, row.undatedMovements])
  const totals = cover("Totales por unidad", ["UM", "Entradas UM", "Salidas UM", "Existencia UM", "Sin fecha UM (±)", "Mov. sin fecha"])
  for (const row of report.totals) totals.addRow([row.unit, row.incoming, row.outgoing, row.quantity, row.undatedQuantity, row.undatedMovements])
  const detail = cover("Productos", ["IFAMB", "Familia", "Código", "Descripción", "Almacén", "UM", "Entradas UM", "Salidas UM", "Existencia UM", "Sin fecha UM (±)", "Mov. sin fecha", "Primer movimiento", "Último movimiento", "ISEQ", "m/UM", "Metros estimados", "Sin fecha m (±)"])
  for (const group of report.groups) for (const row of group.products) detail.addRow([row.family, row.familyName, row.code, row.description, row.warehouse, row.unit, row.incoming, row.outgoing, row.quantity, row.undatedQuantity, row.undatedMovements, row.firstDate, row.lastDate, row.productId, row.metersPerUnit, row.meters?.quantity ?? null, row.meters?.undatedQuantity ?? null])
  const notes = workbook.addWorksheet("Criterios")
  report.notes.forEach(note => notes.addRow([note]))
  notes.getColumn(1).width = 120
  notes.eachRow(row => { row.alignment = { wrapText: true, vertical: "top" }; row.height = 42 })
  for (const sheet of [raw, totals, detail]) {
    sheet.columns.forEach((column, index) => { column.width = index === 1 ? 30 : sheet === detail && index === 3 ? 60 : 19 })
    sheet.eachRow((row, index) => {
      if (index < 7) return
      row.eachCell(cell => { if (typeof cell.value === "number") cell.numFmt = numberFormat })
    })
  }
  detail.getColumn(11).numFmt = "0"; detail.getColumn(14).numFmt = "0"; detail.getColumn(15).numFmt = "0.0000"
  raw.getColumn(8).numFmt = "0"; totals.getColumn(6).numFmt = "0"
  return workbook
}
