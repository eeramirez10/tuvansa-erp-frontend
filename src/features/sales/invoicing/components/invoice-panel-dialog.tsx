import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQuery } from "@tanstack/react-query"

import { invoicePanelQueryOptions } from "@/features/sales/invoicing/logic"
import type { Invoice, InvoicePanel, InvoicePanelDefinition } from "@/features/sales/invoicing/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  ErpDataDialog,
  ErpDataDialogBody,
  ErpDataMetric,
  ErpDataTableViewport,
} from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

type Props = {
  invoice: Invoice
  panel: InvoicePanelDefinition
  onOpenChange: (open: boolean) => void
}

const decimal = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const text = (value: unknown) => value === null || value === undefined ? "" : String(value)
const number = (value: unknown) => decimal.format(Number(value ?? 0))
const date = (value: unknown) => {
  const raw = text(value)
  if (!raw) return ""
  const [year, month, day] = raw.slice(0, 10).split("-")
  return year && month && day ? `${day}/${month}/${year}` : raw
}

function Field({ label, value, className = "" }: { label: string; value: unknown; className?: string }) {
  return (
    <label className={`grid min-w-0 gap-0.5 ${className}`}>
      <span className="truncate text-[8px]">{label}</span>
      <Input className="h-5 min-w-0 px-1 text-[9px]" readOnly value={text(value)} />
    </label>
  )
}

function DataTable({
  columns,
  rows,
  height = "h-64",
  minWidth = "min-w-[700px]",
}: {
  columns: Array<{ label: string; key: string; format?: (value: unknown) => string; numeric?: boolean }>
  rows: Array<Record<string, unknown>>
  height?: string
  minWidth?: string
}) {
  return (
    <ErpDataTableViewport axes="xy" className={height}>
      <Table className={`${minWidth} text-[9px]`} containerClassName="overflow-visible">
        <TableHeader className="sticky top-0 z-[1] bg-muted">
          <TableRow>
            {columns.map((column) => (
              <TableHead className="h-5 whitespace-nowrap px-1 text-[9px]" key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={text(row.id ?? row.lineId ?? rowIndex)}>
              {columns.map((column) => (
                <TableCell
                  className={`whitespace-nowrap px-1 py-0.5 ${column.numeric ? "text-right tabular-nums" : ""}`}
                  key={column.key}
                >
                  {column.format ? column.format(row[column.key]) : text(row[column.key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && <div className="grid h-20 place-items-center text-muted-foreground">Sin información.</div>}
    </ErpDataTableViewport>
  )
}

function Auxiliary({ data }: { data: InvoicePanel }) {
  return (
    <div className="grid gap-1">
      <DataTable
        columns={[
          { label: "Fecha", key: "date", format: date },
          { label: "T.M.", key: "movementType" },
          { label: "Referencia", key: "reference" },
          { label: "Cargos", key: "charges", format: number, numeric: true },
          { label: "Abonos", key: "credits", format: number, numeric: true },
        ]}
        rows={data.items}
      />
      <div className="flex justify-end gap-1">
        <ErpDataMetric label="Cargos" value={number(data.summary?.charges)} />
        <ErpDataMetric label="Abonos" value={number(data.summary?.credits)} />
        <ErpDataMetric label="Saldo" value={number(data.summary?.balance)} />
      </div>
    </div>
  )
}

function Pieces({ data }: { data: InvoicePanel }) {
  return (
    <div className="grid gap-1">
      <DataTable
        columns={[
          { label: "Código", key: "productCode" },
          { label: "Número", key: "serialNumber" },
          { label: "Pzas", key: "pieces", format: number, numeric: true },
          { label: "Cantidad", key: "quantity", format: number, numeric: true },
          { label: "Alm", key: "warehouse" },
          { label: "Pedido", key: "orderNumber" },
          { label: "Refer", key: "reference" },
          { label: "Alta", key: "createdAt", format: date },
          { label: "Recepción", key: "receipt" },
        ]}
        minWidth="min-w-[880px]"
        rows={data.items}
      />
      <div className="flex justify-end gap-1">
        <ErpDataMetric label="Empaques" value={text(data.summary?.packageCount ?? 0)} />
        <ErpDataMetric label="Piezas" value={number(data.summary?.pieces)} />
        <ErpDataMetric label="Cantidad" value={number(data.summary?.quantity)} />
      </div>
    </div>
  )
}

function Boxes({ data, invoice }: { data: InvoicePanel; invoice: Invoice }) {
  return (
    <div className="grid gap-1.5">
      <div className="grid grid-cols-[8rem_1fr_auto] items-end gap-1">
        <Field label="Documento" value={invoice.number} />
        <Field label="Información" value="" />
        <Button disabled size="sm">Generar</Button>
      </div>
      <Card size="sm">
        <CardHeader className="border-b bg-module-sales/10 py-1"><CardTitle>Resumen por Tipo de Empaque</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-1 py-1">
          <ErpDataMetric label="Empaques" value={text(data.summary?.packageCount ?? 0)} />
          <ErpDataMetric label="Piezas" value={number(data.summary?.pieces)} />
          <ErpDataMetric label="Cantidad" value={number(data.summary?.quantity)} />
        </CardContent>
      </Card>
      <div className="grid min-w-0 gap-1 lg:grid-cols-[10rem_minmax(0,1fr)]">
        <Card size="sm">
          <CardHeader className="border-b py-1"><CardTitle>Acciones</CardTitle></CardHeader>
          <CardContent className="grid gap-0.5 py-1">
            {["Agregar", "Modificar", "Eliminar", "Imprimir"].map((label) => <Button disabled key={label} size="xs" variant="outline">{label}</Button>)}
          </CardContent>
        </Card>
        <div className="grid min-w-0 gap-1">
          <Label className="text-[9px]">Lista de Empaques</Label>
          <Pieces data={data} />
        </div>
      </div>
    </div>
  )
}

function Classifications({ data }: { data: InvoicePanel }) {
  const current = data.items.find((item) => item.kind === "current") ?? {}
  const options = data.items.filter((item) => item.kind === "option")
  return (
    <div className="grid min-w-0 gap-1.5 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <Card size="sm">
        <CardHeader className="border-b bg-module-sales/10 py-1"><CardTitle>Clasificación actual</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-1 py-1">
          {Array.from({ length: 10 }, (_, index) => (
            <Field key={index} label={`Clasificador ${index}`} value={current[`classifier${index}`]} />
          ))}
        </CardContent>
      </Card>
      <DataTable
        columns={[
          { label: "Clasificador", key: "classifier" },
          { label: "Código", key: "code" },
          { label: "Descripción", key: "description" },
          { label: "Código compuesto", key: "compositeCode" },
        ]}
        rows={options}
      />
    </div>
  )
}

function Comments({ data, invoice }: { data: InvoicePanel; invoice: Invoice }) {
  const item = data.items[0] ?? {}
  const summary = data.summary ?? {}
  return (
    <div className="grid gap-1.5">
      <div className="grid grid-cols-12 gap-1">
        <Field className="col-span-2" label="Factura" value={invoice.number} />
        <Field className="col-span-2" label="Pedido" value={summary.orderNumber} />
        <Field className="col-span-2" label="Pedido cliente" value={summary.customerOrderNumber} />
        <Field className="col-span-2" label="Cliente" value={summary.customerCode} />
        <Field className="col-span-4" label="Nombre" value={summary.customerName} />
        <Field className="col-span-2" label="Depto." value={summary.department} />
        <Field className="col-span-1" label="Ruta" value={summary.route} />
        <Field className="col-span-2" label="Talón" value={summary.deliveryNote} />
        <Field className="col-span-2" label="Fecha talón" value={date(summary.deliveryNoteAt)} />
        <Field className="col-span-2" label="Folio" value={summary.folio} />
        <Field className="col-span-1" label="Cajas" value={item.boxes} />
        <Field className="col-span-1" label="Volumen" value={summary.volume} />
        <Field className="col-span-1" label="Peso" value={summary.weight} />
        <Field className="col-span-1" label="Alm." value={summary.warehouse} />
      </div>
      <Card size="sm">
        <CardHeader className="border-b bg-module-sales/10 py-1"><CardTitle>Comentarios</CardTitle></CardHeader>
        <CardContent className="grid gap-1 py-1">
          {[1, 2, 3, 4, 5].map((index) => <Field key={index} label={`Comentario ${index}`} value={item[`comment${index}`]} />)}
          <Field label="Cantidad con letra" value={item.amountInWords} />
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-1">
        <Field label="Cuenta de pago" value={summary.paymentAccount} />
        <Field label="Método de pago" value={summary.paymentMethod} />
        <Field label="Otros" value={summary.otherText} />
      </div>
    </div>
  )
}

function Ct({ data }: { data: InvoicePanel }) {
  return (
    <div className="grid gap-1">
      <DataTable
        columns={[
          { label: "Código", key: "productCode" },
          { label: "Producto", key: "product" },
          { label: "Pedido", key: "ordered", format: number, numeric: true },
          { label: "Surtido", key: "fulfilled", format: number, numeric: true },
          { label: "U.M.", key: "unit" },
          { label: "Precio", key: "price", format: number, numeric: true },
          { label: "Suc.", key: "branch" },
          { label: "Pzas.", key: "pieces", format: number, numeric: true },
        ]}
        minWidth="min-w-[760px]"
        rows={data.items}
      />
      <div className="flex justify-end gap-1">
        <ErpDataMetric label="Pedido" value={number(data.summary?.ordered)} />
        <ErpDataMetric label="Surtido" value={number(data.summary?.fulfilled)} />
      </div>
    </div>
  )
}

function Lots({ data }: { data: InvoicePanel }) {
  return (
    <DataTable
      columns={[
        { label: "Producto", key: "productCode" },
        { label: "Descripción", key: "description" },
        { label: "Cantidad", key: "quantity", format: number, numeric: true },
        { label: "Lote", key: "lot" },
        { label: "Fecha", key: "date", format: date },
        { label: "Caducidad", key: "expiresAt", format: date },
        { label: "Pedimento", key: "customsEntry" },
        { label: "Aduana", key: "customsOffice" },
        { label: "Número", key: "number" },
        { label: "Alm.", key: "warehouse" },
      ]}
      height="h-72"
      minWidth="min-w-[940px]"
      rows={data.items}
    />
  )
}

function PrintOptions({ data, invoice }: { data: InvoicePanel; invoice: Invoice }) {
  return (
    <div className="grid gap-1.5">
      <div className="grid grid-cols-3 gap-1">
        <Field label="Desde" value={data.summary?.from ?? invoice.number} />
        <Field label="Hasta" value={data.summary?.to ?? invoice.number} />
        <Field label="Copias" value={data.summary?.copies ?? 1} />
      </div>
      <Card size="sm">
        <CardHeader className="border-b bg-module-sales/10 py-1"><CardTitle>Documentos</CardTitle></CardHeader>
        <CardContent className="grid gap-0.5 py-1">
          {data.items.map((item) => (
            <label className="flex h-6 items-center gap-1 border bg-background px-2" key={text(item.value)}>
              <input disabled name="invoice-print" type="radio" />{text(item.label)}
            </label>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end"><Button disabled size="sm">Imprimir</Button></div>
    </div>
  )
}

function GenericSummary({ data }: { data: InvoicePanel }) {
  const entries = Object.entries(data.items[0] ?? data.summary ?? {})
  return (
    <div className="grid gap-1">
      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
          {entries.map(([key, value]) => <Field key={key} label={key} value={value} />)}
        </div>
      )}
      {data.reason && (
        <Alert>
          <HugeiconsIcon icon={InformationCircleIcon} />
          <AlertTitle>Operación de solo lectura</AlertTitle>
          <AlertDescription>{data.reason}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function PanelContent({ data, invoice }: { data: InvoicePanel; invoice: Invoice }) {
  switch (data.key) {
    case "auxiliary": return <Auxiliary data={data} />
    case "boxes": return <Boxes data={data} invoice={invoice} />
    case "classifications": return <Classifications data={data} />
    case "comments": return <Comments data={data} invoice={invoice} />
    case "ct": return <Ct data={data} />
    case "print": return <PrintOptions data={data} invoice={invoice} />
    case "lots": return <Lots data={data} />
    case "pieces":
    case "edit-pieces": return <Pieces data={data} />
    case "transfer": return (
      <DataTable columns={[
        { label: "Código", key: "productCode" }, { label: "Descripción", key: "description" },
        { label: "Cantidad", key: "quantity", format: number, numeric: true }, { label: "Sucursal", key: "branch" },
      ]} rows={data.items} />
    )
    default: return <GenericSummary data={data} />
  }
}

export function InvoicePanelDialog({ invoice, panel, onOpenChange }: Props) {
  const query = useQuery(invoicePanelQueryOptions(invoice.id, panel.key))
  return (
    <ErpDataDialog
      className="sm:max-w-[62rem]"
      description={`${panel.label} de la factura ${invoice.number}`}
      onOpenChange={onOpenChange}
      title={panel.label}
      tone="sales"
    >
      <ErpDataDialogBody className="grid gap-1.5">
        {query.isPending && <div className="grid min-h-64 place-items-center"><Spinner /></div>}
        {query.isError && (
          <Alert variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertTitle>No fue posible cargar la ventana</AlertTitle>
            <AlertDescription>Revise la conexión con la API.</AlertDescription>
          </Alert>
        )}
        {query.data && <PanelContent data={query.data} invoice={invoice} />}
        <footer className="flex justify-end gap-1">
          <Button onClick={() => onOpenChange(false)} size="sm">OK</Button>
          <Button onClick={() => onOpenChange(false)} size="sm" variant="outline">Cancelar</Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
