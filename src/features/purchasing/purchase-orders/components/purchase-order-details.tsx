import { useId, useState } from "react"
import { displayPurchaseOrderDate, purchaseOrderKindLabel } from "@/features/purchasing/purchase-orders/logic"
import type { PurchaseOrder, PurchaseOrderLine } from "@/features/purchasing/purchase-orders/model"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const money = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const quantities = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const price = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 4, maximumFractionDigits: 4 })
const value = (input: unknown) => input === null || input === undefined ? "" : String(input)

const lineColumns = [
  { label: "Producto", key: "productCode" }, { label: "Descripción", key: "description" },
  { label: "Pedido", key: "ordered" }, { label: "Surtido", key: "fulfilled" },
  { label: "Resta", key: null }, { label: "U.M.", key: null },
  { label: "Cls", key: null }, { label: "Suc", key: "branch" },
  { label: "Precio", key: "price" }, { label: "Descto", key: "price" },
  { label: "Moneda", key: null }, { label: "Confirmado", key: "assigned" },
  { label: "Obs.", key: "observations" },
] as const satisfies ReadonlyArray<{ label: string; key: keyof PurchaseOrderLine | null }>

type Sort = { label: string; key: NonNullable<typeof lineColumns[number]["key"]>; ascending: boolean }

function ReadonlyField({ label, fieldValue, className = "" }: { label: string; fieldValue: unknown; className?: string }) {
  const id = useId()
  return (
    <div className={`grid min-w-0 gap-0.5 ${className}`}>
      <Label className="truncate text-[9px]/none" htmlFor={id}>{label}</Label>
      <Input className="h-4 min-w-0 px-1 text-[9px]" id={id} readOnly value={value(fieldValue)} />
    </div>
  )
}

export function PurchaseOrderDetails({ purchaseOrder, selectedLineIds, onToggleLine }: {
  purchaseOrder: PurchaseOrder
  selectedLineIds: readonly number[]
  onToggleLine: (id: number) => void
}) {
  const [sort, setSort] = useState<Sort | null>(null)
  const lines = sort === null ? purchaseOrder.lines : purchaseOrder.lines.toSorted((left, right) => {
    const a = left[sort.key]
    const b = right[sort.key]
    const order = typeof a === "number" && typeof b === "number" ? a - b : value(a).localeCompare(value(b), "es-MX")
    return (sort.ascending ? order : -order) ||
      (sort.key === "fulfilled" ? left.productCode.localeCompare(right.productCode, "es-MX") : 0)
  })
  const [discount1, discount2, discount3] = purchaseOrder.discountPercentages

  return (
    <div className="flex min-w-0 flex-col gap-2 [font-family:Tahoma,'Segoe_UI',sans-serif]">
      <Card size="sm">
        <CardHeader className="border-b bg-module-reception/15 py-1">
          <CardTitle className="text-module-reception-foreground">Orden de compra</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-2 gap-y-1 py-1 md:grid-cols-12">
          <ReadonlyField className="md:col-span-2" label="Pedido" fieldValue={purchaseOrder.number} />
          <ReadonlyField className="md:col-span-3" label="Pedido prv" fieldValue={purchaseOrder.supplierOrderNumber} />
          <ReadonlyField className="md:col-span-2 md:col-start-11" label="Tipo" fieldValue={purchaseOrderKindLabel[purchaseOrder.documentKind]} />
          <ReadonlyField className="md:col-span-2" label="Proveedor" fieldValue={purchaseOrder.supplier.code} />
          <ReadonlyField className="md:col-span-5" label="Nombre" fieldValue={purchaseOrder.supplier.name} />
          <ReadonlyField className="md:col-span-2" label="Sucursal" fieldValue={purchaseOrder.branch} />
          <ReadonlyField className="md:col-span-3" label="Depto" fieldValue={purchaseOrder.department} />
          <ReadonlyField className="md:col-span-2" label="Fecha" fieldValue={displayPurchaseOrderDate(purchaseOrder.dates.orderedAt)} />
          <ReadonlyField className="md:col-span-2" label="Desde" fieldValue={displayPurchaseOrderDate(purchaseOrder.dates.from)} />
          <ReadonlyField className="md:col-span-2" label="Vence" fieldValue={displayPurchaseOrderDate(purchaseOrder.dates.dueAt)} />
          <ReadonlyField label="Almacén" fieldValue={purchaseOrder.warehouse} />
          <ReadonlyField label="Status" fieldValue={purchaseOrder.classifications[0]} />
          <ReadonlyField label="Autorización" fieldValue={purchaseOrder.classifications[8]?.slice(1)} />
          <ReadonlyField label="Surtido" fieldValue={money.format(purchaseOrder.received.quantity)} />
          <ReadonlyField label="Pzas. surtidas" fieldValue={quantities.format(purchaseOrder.received.pieces)} />
          <div className="grid min-w-0 gap-0.5">
            <Label className="text-[9px]/none" htmlFor="purchase-order-initial">Inicial</Label>
            <div className="flex h-4 items-center px-1"><Checkbox checked={purchaseOrder.initial} disabled id="purchase-order-initial" /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0" size="sm">
        <CardContent className="p-0">
          <div className="h-[19rem] w-full overflow-hidden border-y">
            <Table className="min-w-[1060px] text-[9px]" containerClassName="h-full overflow-scroll [scrollbar-width:auto]">
              <TableHeader className="sticky top-0 z-[1] bg-muted"><TableRow>
                {lineColumns.map(({ label, key }) => (
                  <TableHead aria-sort={sort?.label === label ? (sort.ascending ? "ascending" : "descending") : undefined}
                    className="h-5 whitespace-nowrap px-1 text-[9px]" key={label}>
                    {key === null ? <span className="px-1">{label}</span> :
                      <Button className="h-5 px-1 text-[9px]" size="xs" variant="ghost"
                        onClick={() => setSort((current) => ({ label, key, ascending: current?.label !== label || !current.ascending }))}>
                        {label}{sort?.label === label && <span aria-hidden>{sort.ascending ? "↑" : "↓"}</span>}
                      </Button>}
                  </TableHead>
                ))}
              </TableRow></TableHeader>
              <TableBody>
                {lines.map((line) => {
                  const factor = line.factor || 1
                  return (
                  <TableRow data-state={selectedLineIds.includes(line.id) ? "selected" : undefined} key={line.id}>
                    <TableCell className="px-1 py-0.5 font-mono">
                      <Button aria-label={`Marcar partida ${line.productCode} (${line.id}) para Etiquetas`}
                        aria-pressed={selectedLineIds.includes(line.id)} className="h-auto p-0 font-mono"
                        onClick={() => onToggleLine(line.id)} size="xs" type="button" variant="ghost">
                        {line.productCode}
                      </Button>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate px-1 py-0.5">{line.description}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{money.format(line.ordered / factor)}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{money.format(line.fulfilled / factor)}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{money.format(line.remaining / factor)}</TableCell>
                    <TableCell className="px-1 py-0.5">{line.unit}</TableCell>
                    <TableCell className="px-1 py-0.5">{line.classCode}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{line.branch}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{price.format(line.price * factor)}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{line.discount ? price.format(line.discount) : ""}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{line.currencyName}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{line.assigned ? quantities.format(line.assigned) : ""}</TableCell>
                    <TableCell className="px-1 py-0.5">{line.observations}</TableCell>
                  </TableRow>
                  )
                })}
                {lines.length === 0 && <TableRow><TableCell className="px-2 py-1 text-muted-foreground" colSpan={lineColumns.length}>Sin partidas</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-2 md:grid-cols-[12rem_minmax(0,1fr)]">
        <Card size="sm">
          <CardHeader className="border-b bg-module-reception/15 py-1"><CardTitle>Totales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-1 py-1">
            <ReadonlyField className="col-span-3" label="Asignado" fieldValue={quantities.format(purchaseOrder.totals.assigned)} />
            <ReadonlyField label="Pedido" fieldValue={quantities.format(purchaseOrder.totals.ordered)} />
            <ReadonlyField label="Surtido" fieldValue={quantities.format(purchaseOrder.totals.fulfilled)} />
            <ReadonlyField label="Resta" fieldValue={quantities.format(purchaseOrder.totals.remaining)} />
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="border-b bg-module-reception/15 py-1"><CardTitle>Totales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-4 gap-1 py-1 lg:grid-cols-8">
            <ReadonlyField label="Dto. 1 %" fieldValue={money.format(discount1)} />
            <ReadonlyField label="Dto. 2 %" fieldValue={money.format(discount2)} />
            <ReadonlyField label="Dto. 3 %" fieldValue={money.format(discount3)} />
            <ReadonlyField className="lg:col-start-6" label="Concepto otros" fieldValue={purchaseOrder.otherLabel} />
            <ReadonlyField label="% IVA" fieldValue={purchaseOrder.taxPercentage} />
            <div className="col-span-full" />
            <ReadonlyField label="Subtotal" fieldValue={money.format(purchaseOrder.totals.subtotal)} />
            <ReadonlyField label="Descuento" fieldValue={money.format(purchaseOrder.totals.discount)} />
            <ReadonlyField label="IEPS" fieldValue={money.format(purchaseOrder.totals.exciseTax)} />
            <ReadonlyField label="Flete" fieldValue={money.format(purchaseOrder.totals.freight)} />
            <ReadonlyField label="Seguro" fieldValue={money.format(purchaseOrder.totals.insurance)} />
            <ReadonlyField label="Otros" fieldValue={money.format(purchaseOrder.totals.other)} />
            <ReadonlyField label="IVA" fieldValue={money.format(purchaseOrder.totals.tax)} />
            <ReadonlyField label="Total" fieldValue={money.format(purchaseOrder.totals.total)} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
