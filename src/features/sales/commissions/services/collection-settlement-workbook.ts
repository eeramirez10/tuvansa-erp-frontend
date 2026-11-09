import type ExcelJS from "exceljs"
import type { CollectionCommissions } from "@/features/sales/commissions/model"
import { addInvoiceRow, addInvoiceTotals, collectionExcelMoney, createCollectionSheet, excelFormula, invoiceHeaders, orderedInvoices } from "@/features/sales/commissions/services/collection-workbook-layout"

const summaryHeaders = ["Nombre", "Cobranza", "Costo", "Utilidad bruta", "% utilidad bruta", "Flete entrega", "Gratificaciones", "Utilidad neta", "% utilidad neta", "% según tabla", "% comisión", "$ comisión", "", "Vendedor 1", "Vendedor 2", "Cotizador 1", "Cotizador 2", "Cotizador 3", "Totales"]
const labels = ["NOMBRE", "COBRANZA", "COSTO", "UTILIDAD BRUTA", "% UTILIDAD ANTES DE GRATIFICACIONES Y FLETES", "FLETE ENTREGA", "GRATIFICIONES", "UTILIDAD NETA", "% UTILIDAD NETA", "% COMISION DE ACUERDO A TABLA DE VENDEDOR", "% COMISION", "$ COMISION", "PRODUCTO DE LENTO MOVIMIENTO", "CLIENTES NUEVOS"]
const quote = (name: string) => `'${name.replace(/'/g, "''")}'!`
const completeSum = (refs: string[]) => refs.length ? `IF(COUNT(${refs.join(",")})=${refs.length},ROUND(SUM(${refs.join(",")}),2),"")` : "0"

/** Recreates only the requested summary and thirteen-column salesperson sheets. */
export function addCollectionSettlementWorkbook(book: ExcelJS.Workbook, report: CollectionCommissions) {
  const date = new Date(report.criteria.from + "T00:00:00Z")
  const shortMonth = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" }).format(date).replace(".", "")
  const month = shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1, 3)
  const branch = report.criteria.branch === "01" ? "Mex" : report.criteria.branch === "all" ? "Todas" : report.criteria.branch
  const summary = createCollectionSheet(book, report, `Comisiones ${month} ${report.criteria.from.slice(2, 4)} ${branch}`, summaryHeaders)
  summary.getColumn(1).width = 40
  summary.getRow(6).height = 65
  summary.columns.forEach(c => { c.numFmt = "General" })
  for (const col of [2, 3, 4, 6, 7, 8, 12, 14, 15, 16, 17, 18, 19]) summary.getColumn(col).numFmt = collectionExcelMoney
  for (const col of [5, 9, 10, 11]) summary.getColumn(col).numFmt = "0.00%"
  const normalRows: number[] = [], commissionRows: number[] = []

  for (const agent of report.settlement.agents) {
    const name = `${agent.code || "Sin código"} ${agent.name}`.replace(/[\\/*?:[\]]/g, " ").slice(0, 31)
    const sheet = createCollectionSheet(book, report, name, invoiceHeaders)
    const docs = orderedInvoices(report, agent.code)
    docs.forEach(doc => addInvoiceRow(sheet, doc))
    const last = sheet.rowCount
    const total = sheet.addRow(["TOTAL"])
    const source = report.agents.find(a => a.code === agent.code)!
    addInvoiceTotals(sheet, total.number, source, 0, col => `${col}7:${col}${last}`)
    const start = total.number + 4, cell = (offset: number) => `D${start + offset}`
    for (let i = 0; i < labels.length; i++) {
      const r = start + i
      sheet.mergeCells(r, 1, r, 3)
      sheet.mergeCells(r, 4, r, 6)
      const left = sheet.getCell(r, 1), right = sheet.getCell(r, 4)
      left.value = labels[i]
      left.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF99CCFF" } }
      left.font = { name: "Arial Narrow", size: 12, bold: true }
      right.font = { name: "Arial Narrow", size: 14 }
      for (const c of [left, right]) {
        c.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
        c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
        c.numFmt = collectionExcelMoney
      }
      sheet.getRow(r).height = 26
    }
    sheet.getCell(start, 4).value = agent.name
    sheet.getCell(start, 4).numFmt = "General"
    const sameMonth = report.criteria.from.slice(0, 7) === report.criteria.to.slice(0, 7)
    const monthName = new Intl.DateTimeFormat("es-MX", { month: "long", timeZone: "UTC" }).format(date).toUpperCase()
    sheet.getCell(start + 1, 1).value = sameMonth ? `COBRANZA DEL MES DE ${monthName} ${report.criteria.from.slice(0, 4)}` : `COBRANZA DEL ${report.criteria.from} AL ${report.criteria.to}`

    // These are the server's decimal-accurate snapshot amounts, including signed
    // offsets and the selected bonus mode. No hidden helper columns are needed.
    sheet.getCell(cell(1)).value = agent.payment
    sheet.getCell(cell(2)).value = agent.cost
    if (agent.config.costOverride !== null) sheet.getCell(cell(2)).note = "Costo manual aplicado en Liquidación y ajustes; el detalle conserva el costo de origen."
    excelFormula(sheet, cell(3), `IF(COUNT(${cell(1)},${cell(2)})=2,ROUND(${cell(1)}-${cell(2)},2),"")`, agent.grossProfit)
    excelFormula(sheet, cell(4), `IF(AND(ISNUMBER(${cell(3)}),${cell(1)}<>0),${cell(3)}/${cell(1)},"")`, agent.grossMargin === null ? null : agent.grossMargin / 100)
    sheet.getCell(cell(5)).value = agent.freight
    sheet.getCell(cell(6)).value = agent.gratuities
    excelFormula(sheet, cell(7), `IF(COUNT(${cell(3)},${cell(5)},${cell(6)})=3,ROUND(${cell(3)}-${cell(5)}-${cell(6)},2),"")`, agent.netProfit)
    excelFormula(sheet, cell(8), `IF(AND(ISNUMBER(${cell(7)}),${cell(1)}<>0),${cell(7)}/${cell(1)},"")`, agent.netMargin === null ? null : agent.netMargin / 100)
    const tierRate = report.settlement.salaryTiers.reduce((expression, tier) => `IF(${cell(1)}>=${tier.from},${tier.rate / 100},${expression})`, "0")
    const rate = agent.config.plan === "fixed" ? String(agent.config.fixedRate / 100) : agent.config.plan === "salary" && sameMonth
      ? `IF(COUNT(${cell(1)},${cell(7)})=2,IF(AND(${cell(1)}>0,${cell(7)}*100>${cell(1)}*${report.settlement.minimumNetMargin}),${tierRate},0),"")` : '""'
    excelFormula(sheet, cell(9), rate, agent.rate === null ? null : agent.rate / 100)
    excelFormula(sheet, cell(10), `IF(ISNUMBER(${cell(9)}),${cell(9)},"")`, agent.rate === null ? null : agent.rate / 100)
    excelFormula(sheet, cell(11), report.settlement.bonusMode === "unconfirmed" ? '""' : `IF(COUNT(${cell(7)},${cell(10)})=2,ROUND(${cell(7)}*${cell(10)},2),"")`, agent.regularCommission)
    sheet.getCell(cell(12)).value = agent.lmBonus
    sheet.getCell(cell(13)).value = agent.customerBonus
    for (const offset of [4, 8, 9, 10]) sheet.getCell(cell(offset)).numFmt = "0.00%"
    sheet.getCell(cell(1)).note = "Cobranza de cálculo: invierte el signo PA. Los contramovimientos compensan; Pago en el detalle se presenta positivo."
    sheet.getCell(cell(13)).note = "Incluye clientes Nuevos y Viejo_Reactivado, según la marca actual del ERP. 1% sobre lo pagado sin IVA, redondeado por agente."
    if (agent.pending.length) sheet.getCell(cell(11)).note = agent.pending.join("\n")
    sheet.pageSetup.printArea = `A1:M${start + 13}`

    // Exactly three rows per salesperson, with no additional group header.
    const r = summary.addRow([agent.name]).number
    const bonusRow = summary.addRow(["CLIENTES NUEVOS / RECUPERADOS"]).number
    const lmRow = summary.addRow(["PRODUCTO DE LENTO MOVIMIENTO"]).number
    normalRows.push(r); commissionRows.push(r, bonusRow, lmRow)
    summary.getRow(r).font = { bold: true }
    for (const row of [r, bonusRow, lmRow]) { summary.getRow(row).height = 32; summary.getRow(row).alignment = { wrapText: true, vertical: "middle" } }
    const q = quote(name)
    for (const [col, offset, cached] of [[2, 1, agent.payment], [3, 2, agent.cost], [4, 3, agent.grossProfit], [5, 4, agent.grossMargin === null ? null : agent.grossMargin / 100], [6, 5, agent.freight], [7, 6, agent.gratuities], [8, 7, agent.netProfit], [9, 8, agent.netMargin === null ? null : agent.netMargin / 100], [10, 9, agent.rate === null ? null : agent.rate / 100], [11, 10, agent.rate === null ? null : agent.rate / 100], [12, 11, agent.regularCommission]] as const) {
      excelFormula(summary, `${summary.getColumn(col).letter}${r}`, `IF(ISNUMBER(${q}${cell(offset)}),${q}${cell(offset)},"")`, cached)
    }
    summary.getCell(bonusRow, 2).value = agent.customerBonusBase
    summary.getCell(bonusRow, 10).value = 0.01
    summary.getCell(bonusRow, 11).value = 0.01
    summary.getCell(lmRow, 10).value = 0.01
    summary.getCell(lmRow, 11).value = 0.01
    for (const [row, offset, cached] of [[bonusRow, 13, agent.customerBonus], [lmRow, 12, agent.lmBonus]] as const) excelFormula(summary, `L${row}`, `IF(ISNUMBER(${q}${cell(offset)}),${q}${cell(offset)},"")`, cached)
    for (const [row, cached] of [[r, agent.regularCommission], [bonusRow, agent.customerBonus], [lmRow, agent.lmBonus]] as const) {
      excelFormula(summary, `N${row}`, `IF(ISNUMBER(L${row}),L${row},"")`, cached)
      for (const col of [15, 16, 17, 18]) summary.getCell(row, col).value = 0
      excelFormula(summary, `S${row}`, `IF(COUNT(N${row}:R${row})=5,SUM(N${row}:R${row}),"")`, cached)
    }
  }
  const end = summary.addRow(["TOTAL COMISIONES"]).number
  summary.getRow(end).font = { bold: true }
  for (const [col, result] of [[2, report.settlement.totals.payment], [3, report.settlement.totals.cost], [4, report.settlement.totals.grossProfit], [6, report.settlement.totals.freight], [7, report.settlement.totals.gratuities], [8, report.settlement.totals.netProfit]] as const) {
    const letter = summary.getColumn(col).letter
    excelFormula(summary, `${letter}${end}`, completeSum(normalRows.map(r => `${letter}${r}`)), result)
  }
  for (const col of [12, 14, 15, 16, 17, 18, 19]) {
    const letter = summary.getColumn(col).letter
    excelFormula(summary, `${letter}${end}`, completeSum(commissionRows.map(r => `${letter}${r}`)), [12, 14, 19].includes(col) ? report.settlement.totals.totalCommission : 0)
  }
  summary.pageSetup.printArea = `A1:S${end}`
}
