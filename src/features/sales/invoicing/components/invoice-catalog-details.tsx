import { useId } from "react"
import type { Invoice } from "@/features/sales/invoicing/model"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const decimal = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const exchange = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 4, maximumFractionDigits: 8 })
const value = (input: string | number | null) => input === null || input === "" ? "" : String(input)

function displayDate(input: string | null) {
  if (!input) return ""
  const [year, month, day] = input.slice(0, 10).split("-")
  return year && month && day ? `${day}/${month}/${year}` : input
}

function ReadonlyField({
  label,
  fieldValue,
  className = "",
}: {
  label: string
  fieldValue: string | number | null
  className?: string
}) {
  const inputId = useId()
  return (
    <div className={`flex min-w-0 flex-col items-stretch gap-0.5 ${className}`}>
      <Label className="truncate text-[9px]/none" htmlFor={inputId}>{label}</Label>
      <Input className="h-4 min-w-0 px-1 text-[9px]" id={inputId} readOnly value={value(fieldValue)} />
    </div>
  )
}

function Metric({ label, value: fieldValue }: { label: string; value: string | number }) {
  return (
    <ReadonlyField label={label} fieldValue={fieldValue} />
  )
}

export function InvoiceCatalogDetails({ invoice }: { invoice: Invoice }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 [font-family:Tahoma,'Segoe_UI',sans-serif]">
      <Card size="sm">
        <CardHeader className="border-b bg-module-sales/10 py-1">
          <CardTitle className="text-module-sales">Factura</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-2 gap-y-1 py-1 md:grid-cols-12">
          <ReadonlyField className="md:col-span-2" label="Docto" fieldValue={invoice.number} />
          <ReadonlyField className="md:col-span-2" label="Pedido" fieldValue={invoice.orderNumber} />
          <ReadonlyField className="md:col-span-2" label="Pedido cliente" fieldValue={invoice.customerOrderNumber} />
          <ReadonlyField className="md:col-span-1" label="Sucursal" fieldValue={invoice.branch} />
          <ReadonlyField className="md:col-span-1" label="Depto." fieldValue={invoice.department} />
          <ReadonlyField className="md:col-span-1" label="Ruta" fieldValue={invoice.route} />
          <ReadonlyField className="md:col-span-1" label="Moneda" fieldValue={invoice.currency.name} />
          <ReadonlyField className="md:col-span-2" label="Tipo cambio" fieldValue={exchange.format(invoice.currency.exchangeRate)} />

          <ReadonlyField className="md:col-span-2" label="Cliente" fieldValue={invoice.customer.code} />
          <ReadonlyField className="md:col-span-5" label="Nombre" fieldValue={invoice.customer.name} />
          <ReadonlyField className="md:col-span-2" label="CFD" fieldValue={invoice.cfdStatus} />
          <ReadonlyField className="md:col-span-1" label="Folio" fieldValue={invoice.folio} />
          <ReadonlyField className="md:col-span-2" label="Sello Alm." fieldValue={invoice.warehouseSeal} />

          <ReadonlyField className="md:col-span-2" label="Fecha" fieldValue={displayDate(invoice.dates.issuedAt)} />
          <ReadonlyField className="md:col-span-2" label="Vence" fieldValue={displayDate(invoice.dates.dueAt)} />
          <ReadonlyField className="md:col-span-1" label="Retraso" fieldValue={invoice.delayDays} />
          <ReadonlyField className="md:col-span-3" label="Agt" fieldValue={invoice.attention} />
          <ReadonlyField className="md:col-span-1" label="Pzs" fieldValue={invoice.pieces} />
          <ReadonlyField className="md:col-span-1" label="Alm" fieldValue={invoice.warehouse} />
          <ReadonlyField className="md:col-span-2" label="Fecha de pago" fieldValue={displayDate(invoice.dates.paidAt)} />

          <ReadonlyField className="md:col-span-2" label="Talón" fieldValue={invoice.deliveryNote} />
          <ReadonlyField className="md:col-span-2" label="Fecha talón" fieldValue={displayDate(invoice.dates.deliveryNoteAt)} />
          <ReadonlyField className="md:col-span-2" label="Tipo movimiento" fieldValue={invoice.movementType} />
          <ReadonlyField className="md:col-span-2" label="Status" fieldValue={invoice.status} />
          <div className="flex min-w-0 flex-col items-stretch gap-0.5 md:col-span-1">
            <Label className="text-[9px]/none" htmlFor="invoice-initial">Inicial</Label>
            <div className="flex h-4 items-center px-1"><Checkbox checked={invoice.initial} disabled id="invoice-initial" /></div>
          </div>
          <div className="flex min-w-0 flex-col items-stretch gap-0.5 md:col-span-1">
            <Label className="text-[9px]/none" htmlFor="invoice-canceled">Cancelada</Label>
            <div className="flex h-4 items-center px-1"><Checkbox checked={invoice.canceled} disabled id="invoice-canceled" /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0" size="sm">
        <CardContent className="p-0">
          <div className="h-[19rem] w-full overflow-hidden border-y">
            <Table className="min-w-[980px] text-[9px]" containerClassName="h-full overflow-scroll [scrollbar-width:auto]">
              <TableHeader className="sticky top-0 z-[1] bg-muted">
                <TableRow>
                  {['Producto','Descripción','Cantidad','U.M.','Precio','Dto','Importe','Suc','Agt','Pzas.','Pag.'].map((column) => (
                    <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="px-1 py-0.5 font-mono">{line.productCode}</TableCell>
                    <TableCell className="max-w-[300px] truncate px-1 py-0.5">{line.description}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{decimal.format(line.quantity)}</TableCell>
                    <TableCell className="px-1 py-0.5">{line.unit}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{decimal.format(line.price)}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{decimal.format(line.discount)}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{decimal.format(line.amount)}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{line.branch}</TableCell>
                    <TableCell className="px-1 py-0.5">{line.agent}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{line.pieces}</TableCell>
                    <TableCell className="px-1 py-0.5 text-right">{line.page}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="border-b bg-module-sales/10 py-1"><CardTitle>Totales</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-1 py-1 md:grid-cols-6 xl:grid-cols-12">
          {invoice.discountPercentages.map((discount, index) => (
            <Metric key={index} label={`% Dto. ${index + 1}`} value={decimal.format(discount)} />
          ))}
          <Metric label="Cant." value={decimal.format(invoice.totals.quantity)} />
          <Metric label="Subtotal" value={decimal.format(invoice.totals.subtotal)} />
          <Metric label="Descuentos" value={decimal.format(invoice.totals.discount)} />
          <Metric label="Fletes" value={decimal.format(invoice.totals.freight)} />
          <Metric label="Seguros" value={decimal.format(invoice.totals.insurance)} />
          <Metric label="Otros" value={decimal.format(invoice.totals.other)} />
          <Metric label="IEPS" value={decimal.format(invoice.totals.exciseTax)} />
          <Metric label="IVA" value={decimal.format(invoice.totals.tax)} />
          <Metric label="Gran total" value={decimal.format(invoice.totals.total)} />
          <Metric label="Saldo" value={decimal.format(invoice.totals.balance)} />
        </CardContent>
      </Card>
    </div>
  )
}
