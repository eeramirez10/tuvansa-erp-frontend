import ExcelJS from "exceljs"
import type { CollectionCommissions } from "@/features/sales/commissions/model"
import { collectionCustomerLabel, collectionHeaders } from "@/features/sales/commissions/logic"
import { addCollectionSettlementWorkbook } from "@/features/sales/commissions/services/collection-settlement-workbook"
const money = '"$"#,##0.00;[Red]-"$"#,##0.00;"$"0.00'
export function createCollectionCommissionsWorkbook(report: CollectionCommissions) {
  const book = new ExcelJS.Workbook(); book.creator = "TUVANSA ERP"; book.created = new Date(report.generatedAt); book.calcProperties.fullCalcOnLoad = true
  addCollectionSettlementWorkbook(book, report)
  const create = (name: string, headers: string[]) => {
    const sheet = book.addWorksheet(name)
    sheet.addRow([report.company]); sheet.addRow([report.title])
    sheet.addRow([`Pagos PA del ${report.criteria.from} al ${report.criteria.to} · Sucursal: ${report.criteria.branch} · Agente: ${report.criteria.agent}`])
    sheet.addRow([report.calculationReady ? "Costo histórico y utilidad sobre cobranza según métodos 211, 213 y 214. Documentos agrupados por agente." : "Hay documentos sin costo calculable. Las celdas vacías no significan cero; consulta los criterios y partidas de origen."])
    sheet.addRow(["Sin facturas con servicios, incluidas mixtas. Pago sin IVA en positivo; Movimientos FAX conserva signos originales. Periodo por FAX.AFECHA."])
    sheet.addRow(headers)
    for (let row = 1; row <= 5; row++) { sheet.mergeCells(row, 1, row, headers.length); sheet.getRow(row).height = row === 4 ? 36 : 25; sheet.getRow(row).alignment = { wrapText: true, vertical: "middle" } }
    sheet.getRow(2).font = { bold: true, color: { argb: "FFB45309" } }
    sheet.getRow(6).font = { bold: true }; sheet.getRow(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC1F6BA" } }
    sheet.views = [{ state: "frozen", ySplit: 6 }]; sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: headers.length } }
    sheet.columns.forEach(column => { column.width = 19 }); sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:6" }
    return sheet
  }
  const detail = create("Comisiones", collectionHeaders)
  const subtotalRows: number[] = []
  const totals = (row: ExcelJS.Row, values: CollectionCommissions["totals"], formula: (letter: string) => string) => {
    for (const [col, result] of [[7, values.subtotal], [8, values.returns], [9, values.total], [10, values.displayPayment], [11, values.cost], [12, values.realCost], [13, values.profit], [15, values.freight], [17, values.lm], [18, values.lmAmount], [19, values.customerBonusBase], [21, values.customerBonus]] as const) {
      if (result !== null) row.getCell(col).value = { formula: `ROUND(${formula(detail.getColumn(col).letter)},2)`, result }
    }
    row.font = { bold: true }; row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
  }
  for (const agent of report.agents) {
    const heading = detail.addRow([`Agente ${agent.code || "Sin código"} · ${agent.name} · ${agent.invoices} documentos`])
    detail.mergeCells(heading.number, 1, heading.number, 21); heading.font = { bold: true }
    const first = detail.rowCount + 1
    for (const row of report.invoices.filter(r => r.agentCode === agent.code)) {
      const line = detail.addRow([row.agentName, row.customerName, new Date(row.date + "T00:00:00Z"), new Date(row.lastPaymentDate + "T00:00:00Z"), row.number, row.days,
        row.subtotalAmount, row.returnAmount, row.totalAmount, row.displayPaymentAmount, row.cost, row.realCost, row.profit, row.margin === null ? null : row.margin / 100, row.freightAmount, collectionCustomerLabel(row.customerStatus), row.lm, row.lmAmount,
        row.customerBonusBase, row.customerBonusRate === null ? null : row.customerBonusRate / 100, row.customerBonus])
      line.outlineLevel = 1
    }
    const last = detail.rowCount, subtotal = detail.addRow([`Subtotal agente ${agent.code}`])
    totals(subtotal, agent, letter => `SUM(${letter}${first}:${letter}${last})`); subtotalRows.push(subtotal.number)
  }
  detail.getColumn(1).width = 32; detail.getColumn(2).width = 50
  for (const col of [3, 4]) detail.getColumn(col).numFmt = "dd/mm/yyyy"
  for (const col of [7, 8, 9, 10, 11, 12, 13, 15, 18, 19, 21]) detail.getColumn(col).numFmt = money
  detail.getColumn(14).numFmt = "0.00%"
  detail.getColumn(20).numFmt = "0.00%"
  detail.eachRow(row => { if (row.getCell(3).value instanceof Date) row.getCell(21).numFmt='"$"#,##0.0000' })
  // Sum only agent subtotal cells: never double-count grouped document rows.
  const total = detail.addRow(["TOTAL"])
  totals(total, report.totals, letter => subtotalRows.length ? `SUM(${subtotalRows.map(row => `${letter}${row}`).join(",")})` : "0")
  total.font = { bold: true, color: { argb: "FFB91C1C" } }
  const summary = create("Resumen agentes", ["Código", "Agente", "Facturas", "Pagos PA", "Subtotal", "Devoluciones", "Total", "Pago", "Costo", "Costo real", "Utilidad", "Fletes", "LM", "LM_VALOR", "Base clientes 1%", "Bono clientes", "Documentos con bono", "Sin clasificar"])
  report.agents.forEach(row => summary.addRow([row.code, row.name, row.invoices, row.payments, row.subtotal, row.returns, row.total, row.displayPayment, row.cost, row.realCost, row.profit, row.freight, row.lm, row.lmAmount, row.customerBonusBase, row.customerBonus, row.customerBonusInvoices, row.unclassifiedInvoices]))
  summary.getColumn(2).width = 40; for (const col of [5,6,7,8,9,10,11,12,14,15,16]) summary.getColumn(col).numFmt = money
  const invoiceMap = new Map(report.invoices.map(row => [row.id, row]))
  const movements = create("Movimientos FAX", ["ASEQ", "DSEQ", "Factura", "Fecha", "Tipo", "ACANT con IVA", "% IVA", "Importe sin IVA", "Referencia", "Importe exacto sin IVA (texto)"])
  report.movements.forEach(row => movements.addRow([row.id, row.invoiceId, invoiceMap.get(row.invoiceId)?.number, new Date(row.date + "T00:00:00Z"), row.type,
    Number(row.amount), Number(row.vatRate), row.withoutVat === null ? null : Number(row.withoutVat), row.reference, row.withoutVat]))
  movements.getColumn(4).numFmt = "dd/mm/yyyy"; movements.getColumn(6).numFmt = money; movements.getColumn(8).numFmt = "0.00000000"; movements.getColumn(10).width = 33
  const products = create("Partidas origen", ["AISEQ", "DSEQ", "Factura", "ISEQ", "Código", "Descripción", "IFAMB", "AICANT", "AICANTF", "AIPRECIO", "AICOSTO unitario de origen", "AIMES", "AITIPMV", "ILUGAR", "Movimiento de costo esperado", "Incluida en costo", "Compañía", "ITIPO"])
  report.products.forEach(row => products.addRow([row.id, row.invoiceId, invoiceMap.get(row.invoiceId)?.number, row.productId, row.code, row.description,
    row.family, Number(row.quantity), Number(row.billedQuantity), Number(row.price), Number(row.unitCost), row.applied, row.movementType, row.location,
    invoiceMap.get(row.invoiceId)?.costMovementType, row.movementType === invoiceMap.get(row.invoiceId)?.costMovementType ? "Sí" : "No", invoiceMap.get(row.invoiceId)?.companyId, row.typeId]))
  products.getColumn(6).width = 65; for (const col of [8, 9]) products.getColumn(col).numFmt = "0.000"; for (const col of [10, 11]) products.getColumn(col).numFmt = "0.00000"
  const criteria = book.addWorksheet("Criterios"); report.notes.forEach(note => criteria.addRow([note])); criteria.getColumn(1).width = 145
  criteria.eachRow(row => { row.alignment = { wrapText: true, vertical: "top" }; row.height = 42 })
  return book
}
