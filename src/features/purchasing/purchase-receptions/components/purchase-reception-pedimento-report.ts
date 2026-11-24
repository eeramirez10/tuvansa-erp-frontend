import type { PurchaseReceptionPedimentoReport } from "@/features/purchasing/purchase-receptions/model"

const expenseLabels: Record<PurchaseReceptionPedimentoReport["expenses"][number]["slot"], string> = {
  FLETE1: "Flete a frontera",
  FLETE2: "Flete a bodega",
  AGENTE1: "Broker - US",
  AGENTE2: "Agente aduanal",
  DTA: "DTA",
  OTROS: "Varios",
  PASIVOS: "Otros ya en pasivos",
}

const numberFormat = (digits: number) => new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: digits, maximumFractionDigits: digits,
})
const money = numberFormat(2)
const quantity = numberFormat(3)
const whole = numberFormat(0)
const percentage = numberFormat(4)
const exchange = numberFormat(8)

const text = (value: string | null | undefined) => (value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;")

export function buildPurchaseReceptionPedimentoReport(data: PurchaseReceptionPedimentoReport) {
  const { number, pedimento } = data
  const { expensePercentage, expenses, vat } = data.totals
  const expensesRows = data.expenses.map((row) => `
    <tr><td>${text(row.supplierCode)}</td><th scope="row">${expenseLabels[row.slot]}</th>
      <td class="number">${money.format(row.amount)}</td><td class="number">${row.vat === null ? "" : money.format(row.vat)}</td></tr>`).join("")
  const lines = data.lines.map((row) => `
    <tr><th scope="row">${text(row.code)}</th><td class="number">${money.format(row.tariffPercent)}</td>
      <td class="number">${money.format(row.convertedPrice)}</td><td class="number">${money.format(row.grossPrice)}</td>
      <td class="number">${quantity.format(row.quantity)}</td><td class="number">${whole.format(row.piecesPerBox)}</td>
      <td class="number">${quantity.format(row.unitVolume)}</td><td class="number">${money.format(row.receivedVolume)}</td>
      <td class="number">${money.format(row.proration)}</td><td class="number">${money.format(row.amount)}</td></tr>`).join("")
  const date = pedimento?.date?.split("-").reverse().join("/")

  return `<!doctype html>
<html lang="es-MX">
<head>
<meta charset="utf-8">
<title>Reporte pedimento · ${text(number)}</title>
<style>
  @page { size: letter; margin: 12mm; }
  body { color: #171717; background: #fff; font: 9pt/1.4 Arial, sans-serif; margin: 0; }
  h1 { position: absolute; clip-path: inset(50%); width: 1px; height: 1px; overflow: hidden; }
  .header { display: grid; grid-template-columns: minmax(11rem, 1fr) minmax(20rem, 1.8fr); gap: 16pt; align-items: start; }
  dl { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 2pt 8pt; margin: 1.5pt 0 0; }
  dt { text-align: right; }
  dd { margin: 0; overflow-wrap: anywhere; }
  table { border-collapse: collapse; width: 100%; }
  th, td { padding: 1pt 4pt; text-align: left; }
  .number { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .expenses tbody th { font-weight: normal; }
  .expenses tfoot th, .expenses tfoot td, .lines thead th { background: #e8e8e8; font-weight: bold; border-block: 1px solid #666; print-color-adjust: exact; }
  .expense-percent { margin: 2pt 4pt 0; text-align: right; font-variant-numeric: tabular-nums; }
  .lines { margin-top: 12pt; }
  .lines tbody th { font-weight: normal; }
  .lines tbody tr { border-bottom: 1px solid #ddd; }
  .lines thead { display: table-header-group; }
  tr { break-inside: avoid; }
  @media screen { body { max-width: 190mm; min-width: 40rem; padding: 10mm; margin: 0 auto; } }
</style>
</head>
<body>
<h1>Reporte pedimento</h1>
<div class="header">
  <dl>
    <dt>DOCUMENTO</dt><dd>${text(number)}</dd>
    <dt>PEDIMENTO</dt><dd>${text(pedimento?.number)}</dd>
    <dt>FECHA</dt><dd>${text(date)}</dd>
    <dt>ADUANA</dt><dd>${text(pedimento?.customsOffice)}</dd>
    <dt>T.C.</dt><dd>${exchange.format(data.exchangeRate)}</dd>
  </dl>
  <div>
    <table class="expenses" aria-label="Gastos de importación">
      <thead><tr><th scope="col">PROVEEDOR</th><th scope="col">GASTO</th>
        <th scope="col" class="number">IMPORTE</th><th scope="col" class="number">IVA</th></tr></thead>
      <tbody>${expensesRows}</tbody>
      <tfoot><tr><th></th><th scope="row">Total</th><td class="number">${money.format(expenses)}</td><td class="number">${money.format(vat)}</td></tr></tfoot>
    </table>
    <p class="expense-percent">${percentage.format(expensePercentage)} %</p>
  </div>
</div>
<table class="lines" aria-label="Partidas de la recepción">
  <thead><tr><th scope="col">Código</th><th scope="col" class="number">% Imptos</th>
    <th scope="col" class="number">Precio<br>PESOS</th><th scope="col" class="number">Precio<br>Pesos</th>
    <th scope="col" class="number">Cantidad</th><th scope="col" class="number">Pzas por<br>caja</th>
    <th scope="col" class="number">Volumen<br>unitario</th><th scope="col" class="number">Volumen<br>recibido</th>
    <th scope="col" class="number">Prorrateo</th><th scope="col" class="number">Importe<br>PESOS</th></tr></thead>
  <tbody>${lines}</tbody>
</table>
</body>
</html>`
}
