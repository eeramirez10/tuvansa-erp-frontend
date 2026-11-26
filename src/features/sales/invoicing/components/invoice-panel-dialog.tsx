import { zodResolver } from "@hookform/resolvers/zod"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import { z } from "zod"

import { paths } from "@/app/router/paths"
import { clientKeys } from "@/features/accounts-receivable/clients/logic"
import { movementKeys } from "@/features/inventories/movements/logic"
import { productKeys } from "@/features/inventories/products/logic"
import { invoiceKeys, invoicePanelQueryOptions, isLocalRemission } from "@/features/sales/invoicing/logic"
import type { Invoice, InvoicePanel, InvoicePanelDefinition, InvoiceTransferInput, StampingSimulation, TicketConversion, TicketConversionInput, TicketConversionResult } from "@/features/sales/invoicing/model"
import { confirmInvoiceTransfer, convertTicketToInvoice, editInvoiceLinePieces, getInvoiceTransferPreview, simulateInvoiceStamping } from "@/features/sales/invoicing/services/invoice-service"
import { orderKeys } from "@/features/sales/orders/logic"
import { getApiErrorMessage } from "@/shared/api/api-error"
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
  lineId?: number
  onOpenChange: (open: boolean) => void
}

const decimal = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const stockQuantity = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 })
const unitCost = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
const simulationDate = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Mexico_City",
})
const text = (value: unknown) => value === null || value === undefined ? "" : String(value)
const number = (value: unknown) => decimal.format(Number(value ?? 0))
const date = (value: unknown) => {
  const raw = text(value)
  if (!raw) return ""
  const [year, month, day] = raw.slice(0, 10).split("-")
  return year && month && day ? `${day}/${month}/${year}` : raw
}
const validPolicyId = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0
const piecesLimit = 24_000
const editPiecesSchema = z.object({ value: z.string().max(piecesLimit, "El valor excede el límite de 24 000 caracteres.") })

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
              {columns.map((column) => {
                const value = column.format ? column.format(row[column.key]) : text(row[column.key])
                return (
                  <TableCell className={`whitespace-nowrap px-1 py-0.5 ${column.numeric ? "text-right tabular-nums" : ""}`} key={column.key}>
                    {column.key === "policyNumber" && value && validPolicyId(row.policyId)
                      ? <Link className="text-primary underline" to={paths.accountingPolicy(row.policyId)}>{value}</Link>
                      : value}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 && <div className="grid h-20 place-items-center text-muted-foreground">Sin información.</div>}
    </ErpDataTableViewport>
  )
}

function Auxiliary({ data }: { data: InvoicePanel }) {
  const showPolicy = data.source === "postgres" && data.items.some(({ policyId }) => validPolicyId(policyId))
  return (
    <div className="grid gap-1">
      <DataTable
        columns={[
          { label: "Fecha", key: "date", format: date },
          { label: "T.M.", key: "movementType" },
          { label: "Referencia", key: "reference" },
          ...(showPolicy ? [{ label: "Póliza", key: "policyNumber" }] : []),
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
          { label: "Pzas.", key: "pieces", numeric: true },
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
        ...(data.items.some(row => row.layerId) ? [{ label: "Capa", key: "layerId", numeric: true }] : []),
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

function SealSimulation({ invoice, result }: { invoice: Invoice; result: StampingSimulation | null }) {
  return (
    <div className="grid gap-2">
      <Alert>
        <HugeiconsIcon icon={InformationCircleIcon} />
        <AlertTitle>Simulación · Sin validez fiscal</AlertTitle>
        <AlertDescription>
          {result ? "Prueba de timbrado guardada en el ERP." : "Ensayo local para una factura de ingreso CFDI 4.0."}
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Field label="Remisión de origen" value={invoice.number} />
        <Field label="Tipo de factura previsto" value="FE · Ingreso" />
        <Field label="IVA (MXN)" value={number(invoice.totals.tax)} />
        <Field label="Total (MXN)" value={number(invoice.totals.total)} />
      </div>
      {result && (
        <div className="grid grid-cols-2 gap-1.5">
          <Field label="Referencia de prueba" value={result.reference} />
          <Field label="Fecha de simulación" value={simulationDate.format(new Date(result.simulatedAt))} />
        </div>
      )}
    </div>
  )
}

function TicketInvoicePreview({ preview, result, unavailable, reason }: {
  preview: TicketConversion
  result: TicketConversionResult | null
  unavailable: boolean
  reason?: string
}) {
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Field label="Remisión de origen" value={result?.sourceNumber ?? preview.sourceNumber} />
        <Field label="Tipo de factura" value={preview.targetType} />
        <Field label={`Total (${preview.currency})`} value={number(preview.total)} />
        <Field label={`Saldo (${preview.currency})`} value={number(preview.balance)} />
      </div>
      {result ? (
        <Alert role="status">
          <AlertTitle>Factura registrada</AlertTitle>
          <AlertDescription className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            <Field label="Folio de factura" value={result.number} />
            <Field label="Fecha de emisión" value={date(result.issuedAt)} />
            <Field label="Estado fiscal" value="Pendiente de timbrar" />
          </AlertDescription>
        </Alert>
      ) : unavailable && (
        <Alert>
          <HugeiconsIcon icon={InformationCircleIcon} />
          <AlertTitle>Conversión no disponible</AlertTitle>
          <AlertDescription>{reason || "Esta remisión no está habilitada para convertir a factura."}</AlertDescription>
        </Alert>
      )}
      {!result && !unavailable && <p className="text-xs text-muted-foreground">
        Al confirmar se asigna un folio web y la factura queda pendiente de timbrar.
      </p>}
    </div>
  )
}

function EditPieces({ invoiceId, item, readOnly, reason, onClose }: {
  invoiceId: number
  item: Record<string, unknown>
  readOnly: boolean
  reason?: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm({ resolver: zodResolver(editPiecesSchema), defaultValues: { value: text(item.pieces) } })
  const [expectedVersion] = useState(() => text(item.version))
  const request = useRef<{ value: string; key: string } | null>(null)
  const save = useMutation({
    mutationFn: (edit: { value: string; requestKey: string }) =>
      editInvoiceLinePieces(invoiceId, Number(item.id), { expectedVersion, ...edit }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) })
      onClose()
    },
  })

  return (
    <form className="grid gap-1.5" onSubmit={(event) => {
      void form.handleSubmit(({ value }) => {
        if (readOnly || save.isPending || !expectedVersion) return
        if (request.current?.value !== value) request.current = { value, key: crypto.randomUUID() }
        save.mutate({ value, requestKey: request.current.key })
      })(event)
    }}>
      <Field label="Producto" value={item.productCode} />
      <label className="grid gap-0.5">
        <span>Valor</span>
        <Input {...form.register("value")} aria-invalid={Boolean(form.formState.errors.value)} disabled={save.isPending} maxLength={piecesLimit} readOnly={readOnly} />
      </label>
      {form.formState.errors.value && <p className="text-destructive" role="alert">{form.formState.errors.value.message}</p>}
      {(reason || save.isError) && (
        <Alert variant={save.isError ? "destructive" : "default"}>
          <HugeiconsIcon icon={InformationCircleIcon} />
          <AlertDescription>{save.isError ? getApiErrorMessage(save.error) : reason}</AlertDescription>
        </Alert>
      )}
      <footer className="flex justify-end gap-1">
        <Button disabled={readOnly || save.isPending || !expectedVersion} size="sm" type="submit">{save.isPending ? "Guardando…" : "OK"}</Button>
        <Button disabled={save.isPending} onClick={onClose} size="sm" type="button" variant="outline">Cancelar</Button>
      </footer>
    </form>
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
    case "pieces": return <Pieces data={data} />
    case "transfer": return (
      <DataTable columns={[
        { label: "Código", key: "productCode" }, { label: "Descripción", key: "description" },
        { label: "Cantidad", key: "quantity", format: number, numeric: true }, { label: "Sucursal", key: "branch" },
      ]} rows={data.items} />
    )
    default: return <GenericSummary data={data} />
  }
}

function InvoiceTransferDialog({ invoice, onOpenChange }: Props) {
  const [warehouse, setWarehouse] = useState("")
  const queryClient = useQueryClient()
  const request = useRef<{ revision: string; key: string } | null>(null)
  const submitting = useRef(false)
  const query = useQuery({
    queryKey: [...invoiceKeys.panel(invoice.id, "transfer"), "preview", warehouse],
    queryFn: ({ signal }) => getInvoiceTransferPreview(invoice.id, warehouse, signal),
    placeholderData: keepPreviousData,
    refetchOnMount: "always", refetchOnWindowFocus: false, retry: false,
  })
  const save = useMutation({
    mutationFn: (input: InvoiceTransferInput) => confirmInvoiceTransfer(invoice.id, input),
    onSuccess: () => {
      for (const queryKey of [invoiceKeys.all, clientKeys.all, movementKeys.all, productKeys.all, orderKeys.all]) {
        void queryClient.invalidateQueries({ queryKey })
      }
    },
    onError: () => { void query.refetch() },
    onSettled: () => { submitting.current = false },
  })
  const preview = query.data
  const receipt = save.data ?? preview?.receipt ?? invoice.transfer
  const loading = query.isPending || (query.isFetching && !query.isFetchedAfterMount && !preview)
  const allowed = Boolean(preview?.revision && !preview.reason && !receipt && !query.isFetching && !query.isError)

  function confirm() {
    const revision = preview?.revision
    if (!revision || !allowed || submitting.current) return
    if (request.current?.revision !== revision) request.current = { revision, key: crypto.randomUUID() }
    submitting.current = true
    save.mutate({ warehouse, revision, requestKey: request.current.key, confirmed: true })
  }

  return (
    <ErpDataDialog
      className="sm:max-w-[62rem]"
      defaultWidth={736}
      description={`Traspaso de la remisión ${invoice.number}`}
      onOpenChange={(open) => { if (open || !submitting.current) onOpenChange(open) }}
      title="Traspaso"
      tone="sales"
    >
      <ErpDataDialogBody className="grid gap-2">
        {loading && <div className="grid min-h-24 place-items-center"><Spinner /></div>}
        {query.isError && !receipt && <Alert variant="destructive">
          <AlertTitle>No fue posible cargar el traspaso</AlertTitle>
          <AlertDescription>{getApiErrorMessage(query.error)}</AlertDescription>
        </Alert>}
        {(preview || receipt) && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="Almacén de origen" value={receipt?.from ?? preview?.from} />
            {receipt ? <Field label="Almacén de destino" value={receipt.to} /> : (
              <label className="grid min-w-0 gap-0.5">
                <span className="text-[8px]">Almacén de destino</span>
                <select
                  className="h-5 min-w-0 rounded-md border bg-background px-1 text-[9px]"
                  disabled={save.isPending || !preview?.warehouses.length}
                  onChange={(event) => { save.reset(); setWarehouse(event.currentTarget.value) }}
                  value={warehouse}
                >
                  <option value="">Selecciona un almacén</option>
                  {preview?.warehouses.map((item) => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}
                </select>
              </label>
            )}
            <Field label="Fecha" value={date(receipt?.date ?? preview?.date)} />
            <Field label="Abono a CxC (MXN)" value={number(receipt?.amount ?? preview?.amount)} />
          </div>
        )}
        {receipt && <Alert role="status">
          <AlertTitle>Traspaso registrado</AlertTitle>
          <AlertDescription>Entrada de inventario {receipt.number}</AlertDescription>
        </Alert>}
        {!receipt && preview?.reason && <Alert><AlertDescription>{preview.reason}</AlertDescription></Alert>}
        {preview && <DataTable height="h-48" minWidth="min-w-[500px]" columns={[
          { label: "Código", key: "productCode" }, { label: "Descripción", key: "description" },
          { label: "Entrada al destino", key: "quantity", format: value => stockQuantity.format(Number(value)), numeric: true },
          { label: "Unidad", key: "unit" }, { label: "Precio", key: "price", format: number, numeric: true },
          { label: "Costo", key: "cost", format: value => value === null ? "" : unitCost.format(Number(value)), numeric: true },
        ]} rows={preview.lines} />}
        {save.isError && !receipt && <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(save.error)}</AlertDescription>
        </Alert>}
        <footer className="flex justify-end gap-1">
          {!receipt && !query.isError && <Button disabled={loading || !allowed || save.isPending}
            onClick={confirm} size="sm">{save.isPending ? "Registrando…" : "Confirmar traspaso"}</Button>}
          <Button disabled={save.isPending} onClick={() => onOpenChange(false)} size="sm" variant="outline">{receipt ? "Cerrar" : "Cancelar"}</Button>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

export function InvoicePanelDialog(props: Props) {
  if (props.panel.key === "transfer" && /^FA\d+$/.test(props.invoice.number)) return <InvoiceTransferDialog {...props} />
  return <InvoiceReadPanelDialog {...props} />
}

function InvoiceReadPanelDialog({ invoice, panel, lineId, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const editPieces = panel.key === "edit-pieces"
  const ticketToInvoice = panel.key === "ticket-to-invoice"
  const freshPreview = editPieces || ticketToInvoice
  const query = useQuery({
    ...invoicePanelQueryOptions(invoice.id, panel.key),
    ...(freshPreview ? { refetchOnMount: "always" as const, refetchOnWindowFocus: false } : {}),
  })
  const stamp = useMutation({
    mutationFn: () => simulateInvoiceStamping(invoice.id),
    onSuccess: (result) => {
      queryClient.setQueryData<InvoicePanel>(invoiceKeys.panel(invoice.id, "seal"), (current) =>
        current ? { ...current, stampingSimulation: { result }, readOnly: true } : current,
      )
    },
  })
  const conversionRequest = useRef<{ version: string; key: string } | null>(null)
  const converting = useRef(false)
  const conversion = useMutation({
    mutationFn: (input: TicketConversionInput) => convertTicketToInvoice(invoice.id, input),
    onSuccess: (result) => {
      queryClient.setQueryData<InvoicePanel>(invoiceKeys.panel(invoice.id, "ticket-to-invoice"), (current) =>
        current?.ticketConversion ? { ...current, readOnly: true, ticketConversion: { ...current.ticketConversion, result } } : current,
      )
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
      void queryClient.invalidateQueries({ queryKey: clientKeys.all })
      void queryClient.invalidateQueries({ queryKey: orderKeys.all })
      void queryClient.invalidateQueries({ queryKey: movementKeys.all })
      for (const productId of new Set(invoice.lines.map((line) => line.productId))) {
        void queryClient.invalidateQueries({ queryKey: productKeys.panel(productId, "ledger") })
      }
      void queryClient.invalidateQueries({ queryKey: ["sales", "reports"] })
      void queryClient.invalidateQueries({ queryKey: ["sales", "collection-commissions"] })
    },
    onError: () => { void query.refetch() },
    onSettled: () => { converting.current = false },
  })
  const simulation = panel.key === "seal" && isLocalRemission(invoice) ? query.data?.stampingSimulation : undefined
  const loading = query.isPending || (freshPreview && !query.isFetchedAfterMount && !query.isError)
  const pieceLine = editPieces && !loading && !query.isError ? query.data?.items.find((item) => item.id === lineId) : undefined
  const ticket = ticketToInvoice ? query.data?.ticketConversion : undefined
  const conversionResult = conversion.data ?? ticket?.result ?? null
  const conversionAvailable = query.data?.available && query.data.readOnly === false && !query.data.reason && Boolean(ticket?.version)

  function confirmConversion() {
    const version = ticket?.version
    if (!version || !conversionAvailable || conversionResult || query.isFetching || query.isError || converting.current) return
    if (conversionRequest.current?.version !== version) conversionRequest.current = { version, key: crypto.randomUUID() }
    converting.current = true
    conversion.mutate({ expectedVersion: version, requestKey: conversionRequest.current.key })
  }

  function close() {
    if (!converting.current) onOpenChange(false)
  }

  return (
    <ErpDataDialog
      className="sm:max-w-[62rem]"
      defaultWidth={editPieces ? 370 : 736}
      description={`${panel.label} de la factura ${invoice.number}`}
      onOpenChange={(open) => { if (open || !converting.current) onOpenChange(open) }}
      title={editPieces ? "Cambio pzas" : panel.label}
      tone="sales"
    >
      <ErpDataDialogBody className="grid gap-1.5">
        {loading && <div className={`grid place-items-center ${editPieces ? "min-h-24" : "min-h-64"}`}><Spinner /></div>}
        {query.isError && !conversionResult && (
          <Alert variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertTitle>No fue posible cargar la ventana</AlertTitle>
            <AlertDescription>Revise la conexión con la API.</AlertDescription>
            {ticketToInvoice && <Button className="w-fit" onClick={() => void query.refetch()} size="xs" variant="outline">Reintentar</Button>}
          </Alert>
        )}
        {pieceLine && query.data
          ? <EditPieces invoiceId={invoice.id} item={pieceLine} onClose={() => onOpenChange(false)} readOnly={query.data.readOnly !== false} reason={query.data.reason} />
          : simulation
          ? <SealSimulation invoice={invoice} result={simulation.result} />
          : ticket && (!loading || conversionResult)
          ? <TicketInvoicePreview preview={ticket} result={conversionResult} unavailable={!conversionAvailable} reason={query.data?.reason} />
          : !loading && query.data && <PanelContent data={query.data} invoice={invoice} />}
        {conversion.isError && !conversionResult && (
          <Alert variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertTitle>No fue posible convertir la remisión</AlertTitle>
            <AlertDescription>{getApiErrorMessage(conversion.error)}</AlertDescription>
          </Alert>
        )}
        {stamp.isError && (
          <Alert variant="destructive">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertTitle>No fue posible simular el timbrado</AlertTitle>
            <AlertDescription>{getApiErrorMessage(stamp.error)}</AlertDescription>
          </Alert>
        )}
        {!pieceLine && <footer className="flex justify-end gap-1">
          {ticket && !conversionResult
            ? <Button disabled={loading || !conversionAvailable || query.isFetching || query.isError || conversion.isPending}
              onClick={confirmConversion} size="sm">{conversion.isPending ? "Convirtiendo…" : "Confirmar"}</Button>
            : simulation && !simulation.result
            ? <Button disabled={query.isFetching || query.isError || stamp.isPending} onClick={() => stamp.mutate()} size="sm">{stamp.isPending ? "Simulando…" : "Simular timbrado"}</Button>
            : <Button onClick={close} size="sm">{simulation || conversionResult ? "Cerrar" : "OK"}</Button>}
          {!simulation?.result && !conversionResult && <Button disabled={stamp.isPending || conversion.isPending} onClick={close} size="sm" variant="outline">Cancelar</Button>}
        </footer>}
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
