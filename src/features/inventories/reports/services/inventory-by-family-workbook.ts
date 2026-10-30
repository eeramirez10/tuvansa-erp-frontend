import ExcelJS, { type PaperSize } from "exceljs"
import type { InventoryByFamily, InventoryMeasure } from "@/features/inventories/reports/model"
import { inventoryMatrix, inventoryMeasureLabel } from "@/features/inventories/reports/logic"

const numberFormat = "#,##0.000;[Red]-#,##0.000;0.000"
export function createInventoryByFamilyWorkbook(report: InventoryByFamily, measure: InventoryMeasure = "historical") {
  const matrix = inventoryMatrix(report, measure)
  const amountFormat = measure !== "meters" ? '"$"#,##0.00;[Red]-"$"#,##0.00;"$"0.00' : numberFormat
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "TUVANSA ERP"
  workbook.created = new Date(report.generatedAt)
  workbook.calcProperties.fullCalcOnLoad = true
  const cover = (name: string, headers: string[]) => {
    const sheet = workbook.addWorksheet(name)
    sheet.addRow([report.company]); sheet.addRow([report.title + " al " + report.criteria.asOf + " · " + inventoryMeasureLabel(measure)])
    sheet.addRow([report.warehouseName + " · Almacenes: " + report.includedWarehouses.map(w => w.code).join(", ")])
    sheet.addRow([report.provisional ? report.notes[0] : "Historial fechado"])
    sheet.addRow([measure === "historical" ? `Entradas × su costo − salidas × su costo (AICOSTO). Revaluaciones aparte. Movimientos con costo cero o ausente: ${report.historical.zeroCostMovements} fechados / ${report.historical.undatedZeroCostMovements} sin fecha. Requiere conciliación.` : measure === "value" ? "Cantidad en UM original × costo promedio ACTUAL ILISTA4. No confirma el costo histórico del corte. Partidas sin costo válido: " + report.valuation.unpricedProducts : "Equivalencia estimada: 1 TR / PZ = 6.40 m; M = 1 m; FT = 0.3048 m. Sin equivalencia: excluidos de metros."])
    sheet.addRow(headers)
    sheet.views = [{ state: "frozen", ySplit: 6 }]
    sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: headers.length } }
    sheet.pageSetup = { paperSize: 1 as PaperSize, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:6" }
    sheet.getRow(6).font = { name: "Arial Narrow", size: 10, bold: true }
    sheet.getRow(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1F6BA" } }
    sheet.getRow(4).font = { bold: true, color: { argb: report.provisional ? "FF92400E" : "FF166534" } }
    for (let row = 1; row <= 5; row++) { sheet.mergeCells(row, 1, row, headers.length); sheet.getRow(row).alignment = { wrapText: true, vertical: "middle" }; sheet.getRow(row).height = row === 4 ? 44 : row === 5 ? 32 : 24 }
    return sheet
  }
  const year = report.criteria.asOf.slice(0, 4)
  const summary = cover("Familias", ["N.º", "PRODUCTO / FAMILIA", ...report.meterColumns.flatMap(column => [column.name.replace(/^SUC[.]?\s*/i, "") + " " + year, "%"]), (measure !== "meters" ? "TOTAL VALOR " : "TOTAL METROS ") + year, "%"])
  const end = 6 + report.groups.length
  const totalRow = end + 1
  const totalColumn = 3 + report.meterColumns.length * 2
  matrix.rows.forEach((group, index) => {
    const row = summary.getRow(index + 7)
    row.getCell(1).value = index + 1; row.getCell(2).value = group.name
    const amountRefs: string[] = []
    group.cells.forEach((value, column) => {
      const amount = row.getCell(3 + column * 2)
      amount.value = value.amount; amount.numFmt = amountFormat
      amountRefs.push(amount.address)
      row.getCell(4 + column * 2).value = { formula: `IFERROR(${amount.address}/${summary.getCell(totalRow, 3 + column * 2).address},"")`, result: value.percentage === null ? "" : value.percentage / 100 }
      row.getCell(4 + column * 2).numFmt = "0.00%"
    })
      row.getCell(totalColumn).value = { formula: amountRefs.length ? `ROUND(SUM(${amountRefs.join(",")}),${measure !== "meters" ? 2 : 7})` : "0", result: group.amount }
    row.getCell(totalColumn).numFmt = amountFormat
    row.getCell(totalColumn + 1).value = { formula: `IFERROR(${row.getCell(totalColumn).address}/${summary.getCell(totalRow, totalColumn).address},"")`, result: group.percentage === null ? "" : group.percentage / 100 }
    row.getCell(totalColumn + 1).numFmt = "0.00%"
  })
  summary.getCell(totalRow, 2).value = "TOTAL INVENTARIO POR FAMILIA"
  for (let column = 3; column <= totalColumn + 1; column++) {
    const cell = summary.getCell(totalRow, column)
    const letter = summary.getColumn(column).letter
    if (column % 2 === 1) {
      const amount = column === totalColumn ? matrix.total : matrix.totals[(column - 3) / 2]!.amount
      cell.value = { formula: report.groups.length ? `ROUND(SUM(${letter}7:${letter}${end}),${measure !== "meters" ? 2 : 7})` : "0", result: amount }
      cell.numFmt = amountFormat
    } else {
      const previous = summary.getCell(totalRow, column - 1)
      const amount = column === totalColumn + 1 ? matrix.total : matrix.totals[(column - 4) / 2]!.amount
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
  const detail = cover("Productos", ["IFAMB", "Familia", "Código", "Descripción", "Almacén", "UM", "Entradas reportadas UM", "Salidas reportadas UM", "Saldo reportado UM", "Sin fecha UM (±)", "Mov. sin fecha", "Primer movimiento", "Último movimiento", "ISEQ", "m/UM", "Metros estimados", "Sin fecha m (±)", "Saldo fechado UM", "Costo promedio ACTUAL", "Valor fechado", "Valor pendiente", "Valor reportado"])
  const pending = cover("Pendientes de conciliar", ["ISEQ", "Código", "Descripción", "Almacén", "UM", "Movimientos sin fecha", "Entradas sin fecha", "Salidas sin fecha", "Cantidad sin fecha", "Costo promedio ACTUAL", "Valor pendiente ILISTA4 actual", "Incluido en escenario", "Estado de fecha", "Valor pendiente AICOSTO", "Revaluación sin fecha aparte", "Mov. sin fecha costo cero/ausente"])
  const historical = cover("Costos históricos", ["ISEQ", "Código", "Descripción", "Almacén", "UM", "Entradas fechadas $", "Salidas fechadas $", "Valor fechado $", "Valor sin fecha $", "Valor reportado $", "Revaluación fechada aparte $", "Revaluación sin fecha aparte $", "Mov. fechados costo cero/ausente", "Mov. sin fecha costo cero/ausente", "Primer movimiento", "Último movimiento"])
  for (const group of report.groups) for (const row of group.products) {
    detail.addRow([row.family, row.familyName, row.code, row.description, row.warehouse, row.unit, row.incoming, row.outgoing, row.quantity, row.undatedQuantity, row.undatedMovements, row.firstDate, row.lastDate, row.productId, row.metersPerUnit, row.meters?.quantity ?? null, row.meters?.undatedQuantity ?? null, row.datedQuantity, row.averageCost ?? null, row.valuation.dated, row.valuation.unlinked, row.valuation.reported])
    if (row.undatedMovements) pending.addRow([row.productId, row.code, row.description, row.warehouse, row.unit, row.undatedMovements, row.undatedIncoming ?? null, row.undatedOutgoing ?? null, row.undatedQuantity, row.averageCost ?? null, row.valuation.unlinked, report.criteria.includeUndated ? "Sí: estimación" : "No", "Sin fecha verificable", row.historical.unlinked, row.historical.undatedRevaluation, row.historical.undatedZeroCostMovements])
    historical.addRow([row.productId, row.code, row.description, row.warehouse, row.unit, row.historical.incoming, row.historical.outgoing, row.historical.dated, row.historical.unlinked, row.historical.reported, row.historical.revaluation, row.historical.undatedRevaluation, row.historical.zeroCostMovements, row.historical.undatedZeroCostMovements, row.firstDate, row.lastDate])
  }
  const notes = workbook.addWorksheet("Criterios")
  report.notes.forEach(note => notes.addRow([note]))
  notes.getColumn(1).width = 120
  notes.eachRow(row => { row.alignment = { wrapText: true, vertical: "top" }; row.height = 42 })
  for (const sheet of [raw, totals, detail, pending, historical]) {
    sheet.columns.forEach((column, index) => { column.width = index === 1 ? 30 : sheet === detail && index === 3 ? 60 : 19 })
    sheet.eachRow((row, index) => {
      if (index < 7) return
      row.eachCell(cell => { if (typeof cell.value === "number") cell.numFmt = numberFormat })
    })
  }
  detail.getColumn(11).numFmt = "0"; detail.getColumn(14).numFmt = "0"; detail.getColumn(15).numFmt = "0.0000"
  detail.getColumn(19).numFmt = "0.0000"
  for (const column of [20, 21, 22]) detail.getColumn(column).numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00'
  pending.getColumn(1).numFmt = "0"; pending.getColumn(6).numFmt = "0"; pending.getColumn(10).numFmt = "0.0000"; pending.getColumn(11).numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00'
  for (const column of [14, 15]) pending.getColumn(column).numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00'
  pending.getColumn(16).numFmt = "0"
  for (const column of [6, 7, 8, 9, 10, 11, 12]) historical.getColumn(column).numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00'
  for (const column of [1, 13, 14]) historical.getColumn(column).numFmt = "0"
  raw.getColumn(8).numFmt = "0"; totals.getColumn(6).numFmt = "0"
  return workbook
}
