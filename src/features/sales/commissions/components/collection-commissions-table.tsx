import type { CollectionCommissions } from "@/features/sales/commissions/model"
import { Fragment } from "react"
import { collectionBonusMoney, collectionCustomerLabel, collectionDate, collectionHeaders, collectionMoney } from "@/features/sales/commissions/logic"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import { collectionAdjustmentLabel } from "@/features/sales/commissions/document-label"

export function CollectionCommissionsTable({ report, summary, page }: { report: CollectionCommissions; summary: boolean; page: number }) {
  if (summary) return <Table aria-label="Resumen de cobranza por agente" className="min-w-[1050px]">
    <TableHeader><TableRow>{["Agente", "Facturas", "Pagos PA", "Subtotal", "Devoluciones", "Total", "Pago sin IVA", "Costo", "Costo real", "Utilidad", "Fletes", "LM", "LM_VALOR", "Base clientes 1%", "Bono clientes"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
    <TableBody>{report.agents.slice((page - 1) * 100, page * 100).map(row => <TableRow key={row.code}>
      <TableCell>{row.code} · {row.name}</TableCell><TableCell>{row.invoices}</TableCell><TableCell>{row.payments}</TableCell>
      {[row.subtotal, row.returns, row.total, row.displayPayment, row.cost, row.realCost, row.profit, row.freight].map((amount, i) => <TableCell key={i} className="text-right">{collectionMoney(amount)}</TableCell>)}
      <TableCell>{row.lm ?? "No disponible"}</TableCell><TableCell>{collectionMoney(row.lmAmount)}</TableCell>
      <TableCell>{collectionMoney(row.customerBonusBase)}</TableCell><TableCell>{collectionMoney(row.customerBonus)}</TableCell>
    </TableRow>)}</TableBody>
  </Table>
  return <Table aria-label="Detalle de comisiones por cobranza" className="min-w-[2800px]">
    <TableHeader><TableRow>{collectionHeaders.map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
    <TableBody>{report.invoices.slice((page - 1) * 100, page * 100).map((row, index) => {
      const position = (page - 1) * 100 + index, agent = report.agents.find(a => a.code === row.agentCode)!
      return <Fragment key={row.rowKey}>
      {(index === 0 || report.invoices[position - 1]?.agentCode !== row.agentCode) && <TableRow className="bg-muted"><TableCell colSpan={21} className="font-semibold">Agente {row.agentCode || "Sin código"} · {row.agentName} · {agent.invoices} documentos</TableCell></TableRow>}
      <TableRow className={row.reviewRequired ? "bg-amber-50/70 dark:bg-amber-950/20" : undefined}>
      <TableCell>{row.agentName}</TableCell><TableCell title={row.customerCode}>{row.customerName}</TableCell><TableCell>{collectionDate(row.date)}</TableCell>
      <TableCell title={row.reviewRequired ? `Fecha del ajuste en el auxiliar · ASEQ ${row.sourceMovementId}` : `Primer pago: ${collectionDate(row.firstPaymentDate)} · ${row.paymentCount} pagos PA`}>{collectionDate(row.lastPaymentDate)}</TableCell>
      <TableCell><span className="flex items-center gap-1">{row.number}{collectionAdjustmentLabel(row) && <Badge variant="destructive">{collectionAdjustmentLabel(row)}</Badge>}{row.reviewRequired && <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300" title={row.reviewReasons.join(" ")}>REVISAR</Badge>}</span>{row.relatedInvoiceNumber && row.relatedInvoiceNumber !== row.number && <span className="block text-[9px] text-muted-foreground">Factura: {row.relatedInvoiceNumber}</span>}</TableCell><TableCell>{row.days}</TableCell>
      {[row.subtotalAmount, row.returnAmount, row.totalAmount, row.displayPaymentAmount].map((amount, i) => <TableCell key={i} className="text-right" title={i === 3 && row.paymentCapped ? "Pago limitado al subtotal según el procedimiento" : undefined}>{collectionMoney(amount)}</TableCell>)}
      {[row.cost, row.realCost, row.profit].map((amount, i) => <TableCell key={i} className="text-right">{collectionMoney(amount)}</TableCell>)}
      <TableCell className="text-right">{row.margin === null ? "No disponible" : `${row.margin.toFixed(2)}%`}</TableCell>
      <TableCell className="text-right">{collectionMoney(row.freightAmount)}</TableCell><TableCell title={row.customerStatusRaw}>{collectionCustomerLabel(row.customerStatus)}</TableCell><TableCell>{row.lm ?? "No disponible"}</TableCell><TableCell className="text-right">{collectionMoney(row.lmAmount)}</TableCell>
      <TableCell className="text-right">{collectionMoney(row.customerBonusBase)}</TableCell><TableCell>{row.customerBonusRate === null ? "Pendiente" : `${row.customerBonusRate}%`}</TableCell><TableCell className="text-right">{collectionBonusMoney(row.customerBonus)}</TableCell>
    </TableRow>
    {report.invoices[position + 1]?.agentCode !== row.agentCode && <TableRow className="bg-muted font-semibold">
      <TableCell colSpan={6}>Subtotal agente {row.agentCode} · {agent.invoices} documentos</TableCell>
      {[agent.subtotal, agent.returns, agent.total, agent.displayPayment, agent.cost, agent.realCost, agent.profit].map((amount, i) => <TableCell key={i} className="text-right">{collectionMoney(amount)}</TableCell>)}
      <TableCell /><TableCell className="text-right">{collectionMoney(agent.freight)}</TableCell><TableCell /><TableCell>{agent.lm ?? "No disponible"}</TableCell><TableCell className="text-right">{collectionMoney(agent.lmAmount)}</TableCell>
      <TableCell className="text-right">{collectionMoney(agent.customerBonusBase)}</TableCell><TableCell /><TableCell className="text-right">{collectionMoney(agent.customerBonus)}</TableCell>
    </TableRow>}
    </Fragment>})}</TableBody>
  </Table>
}
