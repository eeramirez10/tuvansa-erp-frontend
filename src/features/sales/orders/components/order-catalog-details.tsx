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
  const assignedQuantity = order.lines.reduce((total,line) => total + line.assigned, 0)
  const assignedAmount = order.lines.reduce((total,line) => total + line.assigned * line.price, 0)
  const assignedPercentage = order.totals.ordered > 0 ? assignedQuantity / order.totals.ordered * 100 : 0
  return (
    <div className="flex min-w-0 flex-col gap-2 [font-family:Tahoma,'Segoe_UI',sans-serif]">
      <Card className="gap-0 py-0" size="sm">
        <CardHeader className="border-b bg-module-sales/10 py-1">
          <CardTitle className="text-module-sales">Pedido</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 px-2 py-1">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-4 lg:grid-cols-[0.75fr_1.25fr_1.25fr_0.6fr_0.55fr_0.62fr_0.66fr_1fr]">
            <ReadonlyField stacked label="Pedido" fieldValue={order.number} />
            <ReadonlyField stacked label="Pedido cliente" fieldValue={order.customerOrderNumber} />
            <ReadonlyField stacked label="Carrito" fieldValue="" />
            <ReadonlyField stacked label="Status." fieldValue={order.status} />
            <ReadonlyField stacked label="Surtido" fieldValue={money.format(order.fulfilledAmount)} />
            <ReadonlyField stacked label="Anticipo" fieldValue="" />
            <ReadonlyField stacked label="Canal" fieldValue="" />
            <ReadonlyField stacked label="Sucursal" fieldValue="" />
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-4 lg:grid-cols-[0.75fr_1.25fr_1.25fr_0.6fr_0.55fr_0.62fr_0.66fr_1fr]">
            <ReadonlyField stacked label="Cliente" fieldValue={order.customer.code} />
            <ReadonlyField stacked className="sm:col-span-3 lg:col-span-2" label="Nombre" fieldValue={order.customer.name} />
            <ReadonlyField stacked label="Sucursal" fieldValue={order.branch} />
            <ReadonlyField stacked label="Depto" fieldValue={order.department} />
            <div aria-hidden="true" className="hidden lg:block" />
            <div className="flex min-w-0 flex-col items-stretch gap-0.5">
              <Label className="text-[9px]/none" htmlFor="order-initial">Inicial</Label>
              <div className="flex h-4 items-center px-1">
                <Checkbox checked={order.initial} disabled id="order-initial" />
              </div>
            </div>
            <ReadonlyField stacked label="O.K." fieldValue={order.authorization} />
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-4 lg:grid-cols-[0.75fr_0.62fr_0.62fr_1.9fr_0.55fr_0.62fr_0.66fr_1fr]">
            <ReadonlyField stacked label="Fecha" fieldValue={order.dates.orderedAt} />
            <ReadonlyField stacked label="Desde" fieldValue={order.dates.from} />
            <ReadonlyField stacked label="Vence" fieldValue={order.dates.dueAt} />
            <ReadonlyField stacked label="Agt." fieldValue={order.attention} />
            <ReadonlyField stacked label="Plazo" fieldValue={order.termsDays} />
            <div aria-hidden="true" className="hidden lg:block" />
            <div aria-hidden="true" className="hidden lg:block" />
            <ReadonlyField stacked label="Almacén" fieldValue={order.warehouse} />
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0" size="sm">
        <CardContent className="p-0">
          <div className="h-[15.5rem] w-full overflow-hidden border-y">
            <Table
              className="min-w-[1180px] text-[9px]"
              containerClassName="h-full overflow-scroll [scrollbar-width:auto]"
            >
              <colgroup>
                {[100,210,60,60,55,32,60,30,60,30,50,64,55,55,80,55,55].map((width, index) => (
                  <col key={index} style={{ width }} />
                ))}
              </colgroup>
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

      <div className="grid gap-2 md:grid-cols-[31%_minmax(0,1fr)]">
        <Card size="sm">
          <CardHeader className="border-b bg-module-sales/10 py-1"><CardTitle>Totales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-1 py-1">
            <ReadonlyField stacked label="Asignado Cnt." fieldValue={money.format(assignedQuantity)} />
            <ReadonlyField stacked label="%" fieldValue={money.format(assignedPercentage)} />
            <ReadonlyField stacked label="Asignado $" fieldValue={money.format(assignedAmount)} />
            <ReadonlyField stacked label="Pedido" fieldValue={money.format(order.totals.ordered)} />
            <ReadonlyField stacked label="Surtido" fieldValue={money.format(order.totals.fulfilled)} />
            <ReadonlyField stacked label="Resta" fieldValue={money.format(order.totals.remaining)} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="border-b bg-module-sales/10 py-1"><CardTitle>Importes</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-1 py-1 lg:grid-cols-7">
            <ReadonlyField stacked label="Importe" fieldValue={money.format(order.totals.subtotal)} />
            <ReadonlyField stacked label="Descuento" fieldValue={money.format(order.totals.discount)} />
            <ReadonlyField stacked label="Flete" fieldValue={money.format(order.totals.freight)} />
            <ReadonlyField stacked label="Seguros" fieldValue={money.format(order.totals.insurance)} />
            <ReadonlyField stacked label="Otros" fieldValue={money.format(order.totals.other)} />
            <ReadonlyField stacked label="IVA" fieldValue={money.format(order.totals.tax)} />
            <ReadonlyField stacked label="Total" fieldValue={money.format(order.totals.total)} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
