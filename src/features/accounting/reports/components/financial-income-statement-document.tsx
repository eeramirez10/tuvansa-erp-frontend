import type { IncomeStatement } from "@/features/accounting/reports/model"
import "@/features/accounting/reports/financial-income-statement.css"

const amounts = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
const percentages = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 })
const amount = (value: number | null) => value === null ? "N/D" : value === 0 ? "-" : value < 0 ? "(-" + amounts.format(Math.abs(value)) + ")" : amounts.format(value)
const percentage = (value: number | null) => value === null ? "" : percentages.format(value)

export function FinancialIncomeStatementDocument({ report }: { report: IncomeStatement }) {
  if (!report.financial) return null
  const financial = report.financial
  const period = new Date(report.asOf + "T00:00:00Z").toLocaleDateString("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).replace(" de ", " ").toUpperCase()
  return <article className="financial-statement-document" aria-label="Reporte Estado de resultados gerencial">
    <header className="financial-statement-heading">
      <h2>{report.companyName}</h2>
      <p>ESTADO DE RESULTADOS AL MES DE {period}</p>
    </header>
    <table className="financial-statement-table">
      <colgroup><col className="financial-concept-column"/><col className="financial-amount-column"/><col className="financial-percent-column"/><col className="financial-amount-column"/><col className="financial-percent-column"/></colgroup>
      <thead>
        <tr><td></td><th className="financial-scope" colSpan={4}>{financial.scopeLabel}</th></tr>
        <tr><th className="financial-concept" scope="col" rowSpan={2}>CONCEPTO</th><th colSpan={2} scope="colgroup">{period}</th><th colSpan={2} scope="colgroup">ACUMULADO A {period}</th></tr>
        <tr><th scope="col">IMPORTE</th><th scope="col">%</th><th scope="col">IMPORTE</th><th scope="col">%</th></tr>
      </thead>
      <tbody>{financial.rows.map(row => row.kind === "spacer" ?
        <tr key={row.key} className="financial-spacer" aria-hidden="true"><td colSpan={5}></td></tr> :
        <tr className={"financial-row financial-row-" + row.kind} key={row.key} data-row={row.key}>
          <th scope="row">{row.label}</th>
          <td className={"financial-number" + (row.month !== null && row.month < 0 ? " financial-negative" : "")}>{amount(row.month)}</td>
          <td className="financial-number financial-percentage">{percentage(row.monthPercent)}</td>
          <td className={"financial-number" + (row.accumulated !== null && row.accumulated < 0 ? " financial-negative" : "")}>{amount(row.accumulated)}</td>
          <td className="financial-number financial-percentage">{percentage(row.accumulatedPercent)}</td>
        </tr>
      )}</tbody>
    </table>
    <footer className="financial-statement-notes">
      {financial.notices.map(notice => <p key={notice}>{notice}</p>)}
      <p>Importes presentados sin decimales; cálculos con centavos. Generado el {new Date(report.generatedAt).toLocaleString("es-MX", { timeZone: "America/Mexico_City", hour12: false })}.</p>
    </footer>
  </article>
}
