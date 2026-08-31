import type { PurchaseOrder } from "@/features/purchasing/purchase-orders/model"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const value = (input: unknown) => input === null || input === undefined ? "" : String(input)

function ReadonlyField({ label, fieldValue, className = "" }: { label: string; fieldValue: unknown; className?: string }) {
  const id = `purchase-order-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  return (
    <div className={`grid min-w-0 gap-0.5 ${className}`}>
      <Label className="truncate text-[9px]/none" htmlFor={id}>{label}</Label>
      <Input className="h-4 min-w-0 px-1 text-[9px]" id={id} readOnly value={value(fieldValue)} />
    </div>
  )
}

export function PurchaseOrderDetails({ purchaseOrder }: { purchaseOrder: PurchaseOrder }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 [font-family:Tahoma,'Segoe_UI',sans-serif]">
      <Card size="sm">
        <CardHeader className="border-b bg-module-reception/15 py-1">
          <CardTitle className="text-module-reception-foreground">Orden de compra</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-2 gap-y-1 py-1 md:grid-cols-12">
          <ReadonlyField className="md:col-span-2" label="Pedido" fieldValue={purchaseOrder.number} />
          <ReadonlyField className="md:col-span-3" label="Pedido prv" fieldValue={purchaseOrder.supplierOrderNumber} />
          <ReadonlyField className="md:col-span-2" label="Sucursal" fieldValue={purchaseOrder.branch} />
          <ReadonlyField className="md:col-span-2" label="Depto" fieldValue={purchaseOrder.department} />
          <ReadonlyField className="md:col-span-2" label="Status" fieldValue={purchaseOrder.status} />
          <ReadonlyField className="md:col-span-1" label="Tipo" fieldValue={purchaseOrder.documentKind === "quote" ? "COTIZ" : "PEDIDO"} />
          <ReadonlyField className="md:col-span-2" label="Proveedor" fieldValue={purchaseOrder.supplier.code} />
          <ReadonlyField className="md:col-span-6" label="Nombre" fieldValue={purchaseOrder.supplier.name} />
          <ReadonlyField className="md:col-span-2" label="Almacén" fieldValue={purchaseOrder.warehouse} />
          <div className="grid min-w-0 gap-0.5 md:col-span-2">
            <Label className="text-[9px]/none" htmlFor="purchase-order-initial">Inicial</Label>
            <div className="flex h-4 items-center px-1"><Checkbox checked={purchaseOrder.initial} disabled id="purchase-order-initial" /></div>
          </div>
          <ReadonlyField className="md:col-span-2" label="Fecha" fieldValue={purchaseOrder.dates.orderedAt} />
          <ReadonlyField className="md:col-span-2" label="Desde" fieldValue={purchaseOrder.dates.from} />
          <ReadonlyField className="md:col-span-2" label="Vence" fieldValue={purchaseOrder.dates.dueAt} />
          <ReadonlyField className="md:col-span-2" label="Clasif. 1" fieldValue={purchaseOrder.classifications[0]} />
          <ReadonlyField className="md:col-span-2" label="Clasif. 8" fieldValue={purchaseOrder.classifications[7]} />
          <ReadonlyField className="md:col-span-2" label="Clasif. 9" fieldValue={purchaseOrder.classifications[8]} />
        </CardContent>
      </Card>

      <Card className="min-w-0" size="sm">
        <CardContent className="p-0">
          <div className="h-[19rem] w-full overflow-hidden border-y">
            <Table className="min-w-[1060px] text-[9px]" containerClassName="h-full overflow-scroll [scrollbar-width:auto]">
              <TableHeader className="sticky top-0 z-[1] bg-muted"><TableRow>
                {[
                  "Producto", "Descripción", "Pedido", "Surtido", "Resta", "U.M.", "Cls",
                  "Suc", "Precio", "Descto", "Moneda", "Confirmado", "Obs.",
                ].map((column) => <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column}>{column}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>
                {purchaseOrder.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="px-1 py-0.5 font-mono">{line.productCode}</TableCell>
                    <TableCell className="max-w-[280px] truncate px-1 py-0.5">{line.description}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{money.format(line.ordered)}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{money.format(line.fulfilled)}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{money.format(line.remaining)}</TableCell>
                    <TableCell className="px-1 py-0.5">{line.unit}</TableCell>
                    <TableCell className="px-1 py-0.5">{line.classCode}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{line.branch}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{money.format(line.price)}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{money.format(line.discount)}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{line.currencyId}</TableCell>
                    <TableCell className="px-1 py-0.5">{line.confirmed ? "Sí" : ""}</TableCell>
                    <TableCell className="px-1 py-0.5">{line.observations}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-2 md:grid-cols-[12rem_minmax(0,1fr)]">
        <Card size="sm">
          <CardHeader className="border-b bg-module-reception/15 py-1"><CardTitle>Totales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-1 py-1">
            <ReadonlyField className="col-span-3" label="Asignado" fieldValue={money.format(purchaseOrder.totals.assigned)} />
            <ReadonlyField label="Pedido" fieldValue={money.format(purchaseOrder.totals.ordered)} />
            <ReadonlyField label="Surtido" fieldValue={money.format(purchaseOrder.totals.fulfilled)} />
            <ReadonlyField label="Resta" fieldValue={money.format(purchaseOrder.totals.remaining)} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="border-b bg-module-reception/15 py-1"><CardTitle>Totales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-1 py-1 lg:grid-cols-8">
            <ReadonlyField label="Subtotal" fieldValue={money.format(purchaseOrder.totals.subtotal)} />
            <ReadonlyField label="Descuento" fieldValue={money.format(purchaseOrder.totals.discount)} />
            <ReadonlyField label="IEPS" fieldValue={money.format(purchaseOrder.totals.exciseTax)} />
            <ReadonlyField label="Flete" fieldValue={money.format(purchaseOrder.totals.freight)} />
            <ReadonlyField label="Seguro" fieldValue={money.format(purchaseOrder.totals.insurance)} />
            <ReadonlyField label="Otros" fieldValue={money.format(purchaseOrder.totals.other)} />
            <ReadonlyField label={`IVA ${purchaseOrder.taxPercentage}%`} fieldValue={money.format(purchaseOrder.totals.tax)} />
            <ReadonlyField label="Total" fieldValue={money.format(purchaseOrder.totals.total)} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
