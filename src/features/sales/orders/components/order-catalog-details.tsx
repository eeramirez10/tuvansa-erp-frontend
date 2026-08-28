import { useId } from "react"
import type { Order } from "@/features/sales/orders/model"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const value = (input: string | number | null) => input === null || input === "" ? "" : String(input)

function ReadonlyField({ label, fieldValue, className = "", stacked = false }: { label: string; fieldValue: string | number | null; className?: string; stacked?: boolean }) {
  const inputId = useId()

  return (
    <div className={`flex min-w-0 ${stacked ? "flex-col items-stretch gap-0.5" : "items-center gap-1"} ${className}`}>
      <Label className="shrink-0 text-[9px]/none" htmlFor={inputId}>{label}</Label>
      <Input className="h-4 min-w-0 px-1 text-[9px]" id={inputId} readOnly value={value(fieldValue)} />
    </div>
  )
}

export function OrderCatalogDetails({ order }: { order: Order }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 [font-family:Tahoma,'Segoe_UI',sans-serif]">
      <Card size="sm">
        <CardHeader className="border-b bg-module-sales/10 py-1">
          <CardTitle className="text-module-sales">Pedido</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-2 gap-y-1 py-1 md:grid-cols-12">
          <ReadonlyField stacked className="md:col-span-2" label="Pedido" fieldValue={order.number} />
          <ReadonlyField stacked className="md:col-span-3" label="Pedido cliente" fieldValue={order.customerOrderNumber} />
          <ReadonlyField stacked className="md:col-span-2" label="Status" fieldValue={order.status} />
          <ReadonlyField stacked className="md:col-span-2" label="Surtido" fieldValue={money.format(order.fulfilledAmount)} />
          <ReadonlyField stacked className="md:col-span-3" label="Tipo" fieldValue={order.documentKind === "quote" ? "COTIZACIÓN" : "PEDIDO"} />
          <ReadonlyField stacked className="md:col-span-2" label="Cliente" fieldValue={order.customer.code} />
          <ReadonlyField stacked className="md:col-span-6" label="Nombre" fieldValue={order.customer.name} />
          <ReadonlyField stacked className="md:col-span-2" label="Sucursal" fieldValue={order.branch} />
          <ReadonlyField stacked className="md:col-span-2" label="Depto" fieldValue={order.department} />
          <ReadonlyField stacked className="md:col-span-2" label="Fecha" fieldValue={order.dates.orderedAt} />
          <ReadonlyField stacked className="md:col-span-2" label="Desde" fieldValue={order.dates.from} />
          <ReadonlyField stacked className="md:col-span-2" label="Vence" fieldValue={order.dates.dueAt} />
          <ReadonlyField stacked className="md:col-span-3" label="At." fieldValue={order.attention} />
          <ReadonlyField stacked className="md:col-span-1" label="Plazo" fieldValue={order.termsDays} />
          <ReadonlyField stacked className="md:col-span-1" label="O.K." fieldValue={order.authorization} />
          <div className="flex min-w-0 flex-col items-stretch gap-0.5 md:col-span-1">
            <Label className="text-[9px]/none" htmlFor="order-initial">Inicial</Label>
            <div className="flex h-4 items-center px-1">
              <Checkbox checked={order.initial} disabled id="order-initial" />
            </div>
          </div>
          <ReadonlyField stacked className="md:col-span-2" label="Almacén" fieldValue={order.warehouse} />
        </CardContent>
      </Card>

      <Card className="min-w-0" size="sm">
        <CardContent className="p-0">
          <div className="h-[19rem] w-full overflow-scroll border-y [scrollbar-width:auto]">
            <Table className="min-w-[1180px] text-[9px]">
              <TableHeader className="sticky top-0 z-[1] bg-muted">
                <TableRow>
                  {['Producto','Descripción','Pedido','Surtido','Resta','U.M.','Asignado','Suc','Precio','Cls','Moneda','Pzas.','Descto','Publi','SKU','Color','Talla'].map((column) => (
                    <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="px-1 py-0.5 font-mono">{line.productCode}</TableCell>
                    <TableCell className="max-w-[260px] truncate px-1 py-0.5">{line.description}</TableCell>
                    {[line.ordered,line.fulfilled,line.remaining,line.unit,line.assigned,line.branch,money.format(line.price),line.classCode,line.currencyId,line.piecesAssignment,money.format(line.discount),money.format(line.publicPrice),line.sku,line.color,line.size].map((item, index) => (
                      <TableCell className="whitespace-nowrap px-1 py-0.5 text-right" key={index}>{item}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-2 md:grid-cols-[15rem_minmax(0,1fr)]">
        <Card size="sm">
          <CardHeader className="border-b bg-module-sales/10 py-1"><CardTitle>Totales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-1 py-1">
            <ReadonlyField label="Cant." fieldValue={money.format(order.totals.quantity)} className="col-span-3" />
            <ReadonlyField label="Pedido" fieldValue={money.format(order.totals.ordered)} />
            <ReadonlyField label="Surtido" fieldValue={money.format(order.totals.fulfilled)} />
            <ReadonlyField label="Resta" fieldValue={money.format(order.totals.remaining)} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="border-b bg-module-sales/10 py-1"><CardTitle>Importes</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-1 py-1 lg:grid-cols-7">
            <ReadonlyField label="Importe" fieldValue={money.format(order.totals.subtotal)} />
            <ReadonlyField label="Descuento" fieldValue={money.format(order.totals.discount)} />
            <ReadonlyField label="Flete" fieldValue={money.format(order.totals.freight)} />
            <ReadonlyField label="Seguros" fieldValue={money.format(order.totals.insurance)} />
            <ReadonlyField label="Otros" fieldValue={money.format(order.totals.other)} />
            <ReadonlyField label="IVA" fieldValue={money.format(order.totals.tax)} />
            <ReadonlyField label="Total" fieldValue={money.format(order.totals.total)} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
