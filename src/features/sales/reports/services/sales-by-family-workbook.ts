import ExcelJS, { type PaperSize } from "exceljs"
import type { SalesByFamily, SalesMeasure } from "@/features/sales/reports/model"
import { salesMatrix } from "@/features/sales/reports/logic"
const moneyFormat = '"$"#,##0.00;[Red]-"$"#,##0.00;"$"0.00'
const quantityFormat = "#,##0.000;[Red]-#,##0.000;0.000"
export function createSalesByFamilyWorkbook(report: SalesByFamily, measure: SalesMeasure) {
  const matrix = salesMatrix(report, measure), amountFormat = measure === "amount" ? moneyFormat : quantityFormat
  const book = new ExcelJS.Workbook(); book.creator = "TUVANSA ERP"; book.created = new Date(report.generatedAt); book.calcProperties.fullCalcOnLoad = true
  const cover = (name: string, headers: string[]) => {
    const sheet = book.addWorksheet(name)
    sheet.addRow([report.company]); sheet.addRow([`Ventas brutas por familia del ${report.criteria.from} al ${report.criteria.to}`])
    sheet.addRow([`Sucursal: ${report.criteria.branch === "all" ? "Todas" : report.columns[0]?.name} · Tipo de producto: 1 · Familia IFAMB`])
    sheet.addRow([measure === "amount" ? "Facturas: MID(DNUM,1,1)='F' AND DSTATUSCFD=3 AND DESFACT=1. Importe AICANTF × AIPRECIO, conservando signos y ceros; sin IVA ni cargos de encabezado. No revierte descuentos." : "Facturas con folio F y estado CFD 3. Metros estimados: TR/PZ × 6.40, M/MT/MTR × 1 y FT × 0.3048. No convierte importes."])
    sheet.addRow([`Movimientos: ${report.movements} · Sin precio: ${report.missingPrices} · Productos/sucursales sin equivalencia a metros: ${report.unconvertedProducts}`])
    sheet.addRow(headers)
    for (let row = 1; row <= 5; row++) { sheet.mergeCells(row, 1, row, headers.length); sheet.getRow(row).alignment = { wrapText: true, vertical: "middle" }; sheet.getRow(row).height = row === 4 ? 40 : 24 }
    sheet.getRow(6).font = { name: "Arial Narrow", size: 10, bold: true }; sheet.getRow(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1F6BA" } }
    sheet.views = [{ state: "frozen", ySplit: 6 }]; sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: headers.length } }
    sheet.pageSetup = { paperSize: 1 as PaperSize, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:6" }
    return sheet
  }
  const summary = cover("Familias", ["N.º", "PRODUCTO / FAMILIA", ...report.columns.flatMap(column => [column.name.replace(/^SUC[.]?\s*/i, ""), "%"]), measure === "amount" ? "TOTAL VENTAS BRUTAS" : "TOTAL METROS", "%"])
  const last = 6 + matrix.rows.length, totalRow = last + 1, totalColumn = 3 + report.columns.length * 2
  matrix.rows.forEach((group, index) => {
    const row = summary.getRow(index + 7); row.getCell(1).value = index + 1; row.getCell(2).value = group.name
    const refs: string[] = []
    group.cells.forEach((cell, column) => {
      const value = row.getCell(3 + column * 2); value.value = cell.amount; value.numFmt = amountFormat; refs.push(value.address)
      row.getCell(4 + column * 2).value = { formula: `IFERROR(${value.address}/${summary.getCell(totalRow, 3 + column * 2).address},"")`, result: cell.percentage === null ? "" : cell.percentage / 100 }; row.getCell(4 + column * 2).numFmt = "0.00%"
    })
    row.getCell(totalColumn).value = { formula: `ROUND(SUM(${refs.join(",")}),${measure === "amount" ? 2 : 7})`, result: group.amount }; row.getCell(totalColumn).numFmt = amountFormat
    row.getCell(totalColumn + 1).value = { formula: `IFERROR(${row.getCell(totalColumn).address}/${summary.getCell(totalRow, totalColumn).address},"")`, result: group.percentage === null ? "" : group.percentage / 100 }; row.getCell(totalColumn + 1).numFmt = "0.00%"
  })
  summary.getCell(totalRow, 2).value = "TOTAL VENTAS BRUTAS POR FAMILIA"
  for (let col = 3; col <= totalColumn + 1; col++) {
    const cell = summary.getCell(totalRow, col), letter = summary.getColumn(col).letter
    if (col % 2 === 1) { cell.value = { formula: matrix.rows.length ? `ROUND(SUM(${letter}7:${letter}${last}),${measure === "amount" ? 2 : 7})` : "0", result: col === totalColumn ? matrix.total : matrix.totals[(col - 3) / 2]!.amount }; cell.numFmt = amountFormat }
    else { const amount = col === totalColumn + 1 ? matrix.total : matrix.totals[(col - 4) / 2]!.amount; cell.value = { formula: `IF(${summary.getCell(totalRow, col - 1).address}=0,"",1)`, result: amount === 0 ? "" : 1 }; cell.numFmt = "0.00%" }
  }
  summary.getColumn(1).width = 5; summary.getColumn(2).width = 39
  for (let col = 3; col <= totalColumn + 1; col++) summary.getColumn(col).width = col % 2 === 1 ? 22 : 11
  summary.autoFilter = { from: { row: 6, column: 1 }, to: { row: Math.max(6, last), column: totalColumn + 1 } }; summary.views = [{ state: "frozen", ySplit: 6, xSplit: 2 }]
  summary.eachRow((row, index) => { if (index < 6) return; row.height = index === totalRow ? 30 : 22; row.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.border = { top: { style: "thin" }, bottom: { style: index === totalRow ? "double" : "thin" }, left: { style: "thin" }, right: { style: "thin" } }
    cell.font = { name: "Arial Narrow", size: 11, bold: index === 6 || index === totalRow, ...(index === totalRow ? { color: { argb: "FFB91C1C" } } : {}) }; cell.alignment = { vertical: "middle", horizontal: col <= 2 ? "left" : "right", wrapText: true }
    if (index > 6 && index !== totalRow && col > 2) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F7EB" } }
  }) })
  const products = cover("Productos", ["IFAMB", "Familia", "ISEQ", "Código", "Descripción", "Sucursal", "UM", "Cantidad vendida UM", "m/UM", "Metros estimados", "Ventas brutas $", "Movimientos", "Tipos", "Primera fecha", "Última fecha", "Sin precio", "Bruto exacto SQL (texto)"])
  const units = new Map<string, { quantity: number; amount: number }>()
  for (const group of report.groups) for (const p of group.products) {
    products.addRow([p.family, p.familyName, p.productId, p.code, p.description, p.branch, p.unit, p.units, p.metersPerUnit, p.meters, p.amount, p.movements, p.movementTypes, p.firstDate, p.lastDate, p.missingPrices, p.gross])
    const total = units.get(p.unit) ?? { quantity: 0, amount: 0 }; total.quantity = (Math.round(total.quantity * 1000) + Math.round(p.units * 1000)) / 1000; total.amount = (Math.round(total.amount * 100) + Math.round(p.amount * 100)) / 100; units.set(p.unit, total)
  }
  products.columns.forEach((column, index) => { column.width = index === 4 ? 65 : index === 1 ? 32 : 20 })
  products.getColumn(8).numFmt = quantityFormat; products.getColumn(9).numFmt = "0.0000"; products.getColumn(10).numFmt = quantityFormat
  products.getColumn(11).numFmt = moneyFormat
  const unitSheet = cover("Unidades originales", ["UM", "Cantidad vendida UM", "Ventas brutas registradas"])
  for (const [unit, total] of [...units].sort(([a], [b]) => a.localeCompare(b))) unitSheet.addRow([unit, total.quantity, total.amount])
  unitSheet.columns.forEach(column => { column.width = 34 }); unitSheet.getColumn(2).numFmt = quantityFormat; unitSheet.getColumn(3).numFmt = moneyFormat
  const notes = book.addWorksheet("Criterios"); report.notes.forEach(note => notes.addRow([note])); notes.getColumn(1).width = 130; notes.eachRow(row => { row.alignment = { wrapText: true, vertical: "top" }; row.height = 42 })
  return book
}
