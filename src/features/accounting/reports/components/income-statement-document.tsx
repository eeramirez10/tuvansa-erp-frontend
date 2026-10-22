import type { IncomeStatement } from "@/features/accounting/reports/model"
import "@/features/accounting/reports/income-statement.css"

const amount = new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})
const numeric = (value: number | null) => value === null || value === 0 ? "" : amount.format(value)
const date = (value: string) => value.split("-").reverse().join("/")

export function IncomeStatementDocument({ report }: {report:IncomeStatement}) {
  const generated = new Date(report.generatedAt).toLocaleString("es-MX",{hour12:false})
  return <article className="income-statement-document" aria-label="Reporte Estado de resultados">
    <header className="income-statement-company">
      <span>{report.companyName}</span><span>{report.companyLegalName}</span><small>Fecha {generated}</small>
    </header>
    <div className="income-statement-caption"><strong>{report.title}</strong><span>{date(report.asOf)}</span></div>
    <div className="income-statement-range">CUENTAS 4 AL 8999999999999</div>
    <table className="income-statement-table">
      <colgroup><col style={{width:"65%"}}/><col style={{width:"16%"}}/><col style={{width:"19%"}}/></colgroup>
      <thead><tr><th aria-label="Concepto"></th><th>MES</th><th>ACUMULADO</th></tr></thead>
      <tbody>{report.rows.map(row => <tr className={"income-row income-row-"+row.kind} key={row.key}>
        <td style={{paddingLeft:row.kind==="section-total" ? "18pt" : row.kind==="result" ? "54pt" : String(row.depth*25)+"pt"}}>{row.label}</td>
        <td className="income-amount">{numeric(row.month)}</td><td className="income-amount">{numeric(row.accumulated)}</td>
      </tr>)}</tbody>
    </table>
  </article>
}
