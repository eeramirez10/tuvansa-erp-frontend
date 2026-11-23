import type { AccountingPolicy } from "@/features/accounting/policies/model"
import { printPurchaseOrderDocument as printHtmlDocument } from "@/features/purchasing/purchase-orders/components/purchase-order-print"
import { bankMoney } from "@/features/treasury/banking/logic"

function escapeHtml(value: string | number | null) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function printBankPolicy(policy: AccountingPolicy) {
  const title = `Póliza ${policy.number}`
  const rows = policy.movements.map((movement) => `<tr>
    <td>${escapeHtml(movement.accountCode)}</td>
    <td>${escapeHtml(movement.accountName)}</td>
    <td>${escapeHtml(movement.reference)}</td>
    <td>${escapeHtml(movement.costCenter)}</td>
    <td class="amount">${bankMoney(movement.debit)}</td>
    <td class="amount">${bankMoney(movement.credit)}</td>
  </tr>`).join("")
  return printHtmlDocument(`<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: letter; margin: 14mm }
    body { color: #111; font: 10pt Arial, sans-serif; margin: 0 }
    h1 { font-size: 17pt; margin: 0 0 .8em }
    dl { display: grid; gap: .35em .8em; grid-template-columns: max-content 1fr; margin: 0 0 1em }
    dt, th { font-weight: 700 }
    dd { margin: 0; overflow-wrap: anywhere; white-space: pre-wrap }
    table { border-collapse: collapse; width: 100% }
    thead { display: table-header-group }
    tr { break-inside: avoid }
    td, th { border-bottom: 1px solid #aaa; padding: .35em; text-align: left }
    .amount { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap }
    .totals { display: flex; justify-content: flex-end; gap: 1.4em; margin-top: 1em; break-inside: avoid }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <dl>
    <dt>Fecha</dt><dd>${escapeHtml(policy.date)}</dd>
    <dt>Estado</dt><dd>${policy.applied ? "Aplicada" : "Sin aplicar"}</dd>
    <dt>Origen</dt><dd>${escapeHtml(policy.origin)}</dd>
    ${policy.cheque ? `<dt>Cheque</dt><dd>${escapeHtml(policy.cheque)}</dd>` : ""}
    <dt>Beneficiario</dt><dd>${escapeHtml(policy.beneficiary)}</dd>
    <dt>Concepto</dt><dd>${escapeHtml(policy.concept)}</dd>
    ${policy.amountInWords ? `<dt>Importe con letra</dt><dd>${escapeHtml(policy.amountInWords)}</dd>` : ""}
  </dl>
  <table aria-label="Movimientos de la póliza">
    <thead><tr><th scope="col">Cuenta</th><th scope="col">Nombre</th><th scope="col">Referencia</th>
      <th scope="col">C.C.</th><th scope="col" class="amount">Cargos</th><th scope="col" class="amount">Abonos</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <span><strong>Cargos</strong> ${bankMoney(policy.totals.debit)}</span>
    <span><strong>Abonos</strong> ${bankMoney(policy.totals.credit)}</span>
    <span><strong>Diferencia</strong> ${bankMoney(policy.totals.difference)}</span>
  </div>
</body>
</html>`, title)
}
