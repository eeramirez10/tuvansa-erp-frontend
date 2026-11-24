import { Link } from "react-router"
import { paths } from "@/app/router/paths"
import type { PurchaseReception } from "@/features/purchasing/purchase-receptions/model"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const number = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const text = (input: unknown) => input === null || input === undefined ? "" : String(input)

function Field({ label, fieldValue, className = "", numeric = false }: { label: string; fieldValue: unknown; className?: string; numeric?: boolean }) {
  const id = `purchase-reception-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  return (
    <div className={`grid min-w-0 gap-0.5 ${className}`}>
      <Label className="truncate text-[9px]/none" htmlFor={id}>{label}</Label>
      <Input className={`h-4 min-w-0 px-1 text-[9px] ${numeric ? "text-right tabular-nums" : ""}`} id={id} readOnly value={text(fieldValue)} />
    </div>
  )
}

function CancellationControl({ reception, expense, onOpen }: { reception: PurchaseReception; expense?: boolean; onOpen: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {reception.cancelled && <span className="font-medium" role="status">{expense ? "GA cancelado" : "Recepción cancelada"}</span>}
      {reception.cancellation?.policyNumber && (
        <Link className="underline underline-offset-2" to={paths.accountingPolicy(reception.cancellation.id)}>
          Póliza {reception.cancellation.policyNumber}
        </Link>
      )}
      <Button onClick={onOpen} size="xs" type="button" variant="outline">
        {reception.cancelled ? "Ver cancelación" : expense ? "Cancelar GA" : "Cancelar recepción"}
      </Button>
    </div>
  )
}

export function PurchaseReceptionDetails({ reception, onCancel, selectedLineId, onSelectLine }: {
  reception: PurchaseReception
  onCancel?: () => void
  selectedLineId?: number
  onSelectLine?: (lineId: number) => void
}) {
  const hasLayers = reception.lines.some(({ lotId }) => lotId > 0)
  const expenseTaxes = reception.totals.expenseTaxes
  if (expenseTaxes) {
    return (
      <div className="grid min-w-0 gap-2">
        <Card size="sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b bg-module-reception/15 py-1">
            <CardTitle>Gastos múltiples</CardTitle>
            {onCancel && <CancellationControl expense onOpen={onCancel} reception={reception} />}
          </CardHeader>
          <CardContent className="grid grid-cols-12 gap-2 py-1">
            <Field className="col-span-3" label="Documento" fieldValue={reception.number} />
            <Field className="col-span-3" label="Referencia" fieldValue={reception.supplierReference} />
            <Field className="col-span-3" label="Fecha" fieldValue={reception.dates.receivedAt} />
            <Field className="col-span-3" label="Vence" fieldValue={reception.dates.dueAt} />
            <Field className="col-span-3" label="Proveedor" fieldValue={reception.supplier.code} />
            <Field className="col-span-9" label="Nombre" fieldValue={reception.supplier.name} />
          </CardContent>
        </Card>
        <Card className="min-w-0" size="sm">
          <CardContent className="p-0">
            <div className="h-[19rem] w-full overflow-hidden">
              <Table className="min-w-[720px]" containerClassName="h-full overflow-auto">
                <TableHeader className="sticky top-0 bg-muted"><TableRow>
                  {["Código", "Gasto", "Importe", "I.V.A.", "Ret. I.V.A.", "Ret. I.S.R.", "C.C."].map((label) => <TableHead key={label}>{label}</TableHead>)}
                </TableRow></TableHeader>
                <TableBody>{reception.lines.map((line) => <TableRow key={line.id}>
                  <TableCell className="font-mono">{line.productCode}</TableCell>
                  <TableCell>{line.description}</TableCell>
                  <TableCell className="text-right tabular-nums">{number.format(line.amount)}</TableCell>
                  <TableCell className="text-right tabular-nums">{number.format(line.expenseTaxes?.vat ?? 0)}</TableCell>
                  <TableCell className="text-right tabular-nums">{number.format(line.expenseTaxes?.vatWithholding ?? 0)}</TableCell>
                  <TableCell className="text-right tabular-nums">{number.format(line.expenseTaxes?.incomeWithholding ?? 0)}</TableCell>
                  <TableCell>{line.costCenter}</TableCell>
                </TableRow>)}</TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="border-b bg-module-reception/15 py-1"><CardTitle>Totales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 py-1 md:grid-cols-6">
            <Field label="Importe" fieldValue={number.format(reception.totals.subtotal)} numeric />
            <Field label="I.V.A." fieldValue={number.format(reception.totals.tax)} numeric />
            <Field label="Ret. I.V.A." fieldValue={number.format(expenseTaxes.vatWithholding)} numeric />
            <Field label="Ret. I.S.R." fieldValue={number.format(expenseTaxes.incomeWithholding)} numeric />
            <Field label="Total" fieldValue={number.format(reception.totals.total)} numeric />
            <Field label="Saldo" fieldValue={number.format(reception.totals.balance)} numeric />
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="flex min-w-0 flex-col gap-2 [font-family:Tahoma,'Segoe_UI',sans-serif]">
      <Card size="sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b bg-module-reception/15 py-1">
          <CardTitle className="text-module-reception-foreground">Recepción</CardTitle>
          {onCancel && <CancellationControl onOpen={onCancel} reception={reception} />}
        </CardHeader>
        <CardContent className="grid grid-cols-12 gap-x-2 gap-y-1 py-1">
          <Field className="col-span-2" label="Documento" fieldValue={reception.number} />
          <Field className="col-span-2" label="Pedido" fieldValue={reception.orderNumber} />
          <Field className="col-span-2" label="Referencia" fieldValue={reception.supplierReference} />
          {reception.pedimento ? <>
            <Field className="col-span-3" label="No. Pedimento" fieldValue={reception.pedimento.number} />
            <div className="col-span-3" />
          </> : <div className="col-span-6" />}
          <Field className="col-span-2" label="Proveedor" fieldValue={reception.supplier.code} />
          <Field className="col-span-5" label="Nombre" fieldValue={reception.supplier.name} />
          <Field className="col-span-2" label="Departamento" fieldValue={reception.department} />
          <div className="col-span-3" />
          <Field className="col-span-2" label="Fecha" fieldValue={reception.dates.receivedAt} />
          <Field className="col-span-2" label="Vence" fieldValue={reception.dates.dueAt} />
          <Field className="col-span-1" label="Retraso" fieldValue={reception.delayDays} numeric />
          <Field className="col-span-2" label="Almacén" fieldValue={reception.warehouse} />
          <Field className="col-span-2" label="Sucursal" fieldValue={reception.branch} />
        </CardContent>
      </Card>

      <Card className="min-w-0" size="sm">
        <CardContent className="p-0">
          <div className="h-[19rem] w-full overflow-hidden border-y">
            <Table className="min-w-[880px] text-[9px]" containerClassName="h-full overflow-scroll [scrollbar-width:auto]">
              <TableHeader className="sticky top-0 z-[1] bg-muted"><TableRow>
                {["Producto", "Descripción", "Cantidad", "U.M.", "Precio", "Dto", "Importe", "Pzas.", "C.C.", "Sucursal"].map((column) => (
                  <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column}>{column}</TableHead>
                ))}
                {hasLayers && <TableHead className="h-5 px-1 text-[9px]">Capa</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {reception.lines.map((line) => (
                  <TableRow className={onSelectLine ? "cursor-pointer" : undefined} data-state={line.id === selectedLineId ? "selected" : undefined}
                    key={line.id} onClick={onSelectLine ? () => onSelectLine(line.id) : undefined}>
                    <TableCell className="px-1 py-0.5 font-mono">
                      {onSelectLine ? <Button aria-label={`Seleccionar partida ${line.productCode}`} aria-pressed={line.id === selectedLineId}
                        className="h-4 px-0 font-mono text-[9px]" size="xs" type="button" variant="ghost">{line.productCode}</Button>
                        : line.productCode}
                    </TableCell>
                    <TableCell className="max-w-[310px] truncate px-1 py-0.5">{line.description}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{number.format(line.quantity)}</TableCell>
                    <TableCell className="px-1 py-0.5">{line.unit}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{number.format(line.price)}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{number.format(line.discount)}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{number.format(line.amount)}</TableCell>
                    <TableCell className="px-1 py-0.5">{line.pieces}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{line.costCenter}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{line.branch}</TableCell>
                    {hasLayers && <TableCell className="whitespace-nowrap px-1 py-0.5">{line.lotId || ""}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-[12rem_minmax(0,1fr)] gap-2">
        <Card size="sm">
          <CardHeader className="border-b bg-module-reception/15 py-1"><CardTitle>Totales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-1 py-1">
            <Field className="col-span-3" label="Unidades" fieldValue={number.format(reception.totals.units)} numeric />
            {reception.discountPercentages.map((discount, index) => (
              <Field key={index} label={index === 0 ? "% Dtos" : ""} fieldValue={number.format(discount)} numeric />
            ))}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="border-b bg-module-reception/15 py-1"><CardTitle>Importes</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-6 gap-1 py-1">
            <Field className="col-span-2" label="Subtotal" fieldValue={number.format(reception.totals.subtotal)} numeric />
            <Field label="Descuentos" fieldValue={number.format(reception.totals.discount)} numeric />
            <Field label="Fletes" fieldValue={number.format(reception.totals.freight)} numeric />
            <Field label="Seguros" fieldValue={number.format(reception.totals.insurance)} numeric />
            <Field label={reception.totals.otherLabel || "Otros"} fieldValue={number.format(reception.totals.other)} numeric />
            <Field label="IEPS" fieldValue={number.format(reception.totals.exciseTax)} numeric />
            <Field label={`IVA ${number.format(reception.totals.taxPercentage)}%`} fieldValue={number.format(reception.totals.tax)} numeric />
            <Field label="Ret iva" fieldValue={number.format(reception.totals.withholdingTax)} numeric />
            <Field label="Total" fieldValue={number.format(reception.totals.total)} numeric />
            <Field className="col-span-2" label="Saldo" fieldValue={number.format(reception.totals.balance)} numeric />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
