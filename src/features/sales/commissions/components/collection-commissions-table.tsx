import type { CollectionCommissions } from "@/features/sales/commissions/model"
import { collectionDate, collectionHeaders, collectionMoney } from "@/features/sales/commissions/logic"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

export function CollectionCommissionsTable({ report, summary, page }: { report: CollectionCommissions; summary: boolean; page: number }) {
  if (summary) return <Table aria-label="Resumen de cobranza por agente" className="min-w-[1050px]">
    <TableHeader><TableRow>{["Agente", "Facturas", "Pagos PA", "Subtotal", "Devoluciones", "Total", "Pago sin IVA", "Fletes"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
    <TableBody>{report.agents.slice((page - 1) * 100, page * 100).map(row => <TableRow key={row.code}>
      <TableCell>{row.name}</TableCell><TableCell>{row.invoices}</TableCell><TableCell>{row.payments}</TableCell>
      {[row.subtotal, row.returns, row.total, row.payment, row.freight].map((amount, i) => <TableCell key={i} className="text-right">{collectionMoney(amount)}</TableCell>)}
    </TableRow>)}</TableBody>
  </Table>
  return <Table aria-label="Detalle de comisiones por cobranza" className="min-w-[2400px]">
    <TableHeader><TableRow>{collectionHeaders.map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
    <TableBody>{report.invoices.slice((page - 1) * 100, page * 100).map(row => <TableRow key={row.id}>
      <TableCell>{row.agentName}</TableCell><TableCell title={row.customerCode}>{row.customerName}</TableCell><TableCell>{collectionDate(row.date)}</TableCell>
      <TableCell title={`Primer pago: ${collectionDate(row.firstPaymentDate)} · ${row.paymentCount} pagos PA`}>{collectionDate(row.lastPaymentDate)}</TableCell><TableCell>{row.number}</TableCell><TableCell>{row.days}</TableCell>
      {[row.subtotalAmount, row.returnAmount, row.totalAmount, row.paymentAmount].map((amount, i) => <TableCell key={i} className="text-right" title={i === 3 && row.paymentCapped ? "Pago limitado al subtotal según el procedimiento" : undefined}>{collectionMoney(amount)}</TableCell>)}
      {["cost", "realCost", "profit", "margin"].map(key => <TableCell key={key} className="text-muted-foreground">Pendiente</TableCell>)}
      <TableCell className="text-right">{collectionMoney(row.freightAmount)}</TableCell><TableCell>{row.newCustomer}</TableCell><TableCell className="text-muted-foreground">Pendiente</TableCell><TableCell className="text-muted-foreground">Pendiente</TableCell>
    </TableRow>)}</TableBody>
  </Table>
}
