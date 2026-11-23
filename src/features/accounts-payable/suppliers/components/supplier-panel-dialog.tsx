import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { SupplierPaymentDialog } from "@/features/accounts-payable/suppliers/components/supplier-payment-dialog"
import {
  supplierBalanceReceiptId, supplierCalendarDate, supplierClassificationsQueryOptions, supplierDateLabel, supplierPanelQueryOptions,
} from "@/features/accounts-payable/suppliers/logic"
import type { Supplier, SupplierPanelColumn, SupplierPanelDefinition } from "@/features/accounts-payable/suppliers/model"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody, ErpDataMetric, ErpDataTableViewport } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/utils/cn"

type Props = {
  supplier: Supplier
  panel: SupplierPanelDefinition
  onOpenChange: (open: boolean) => void
}

const numberFormatter = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 4 })
const moneyFormatter = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const metricLabels: Record<string, string> = {
  amount: "Tot 'X'",
  originalAmount: "Tot '-'",
  negativeAmount: "Negativo",
}

function valueText(value: unknown, column?: SupplierPanelColumn) {
  if (value === null || value === undefined || value === "") return ""
  if (column?.format === "money") return moneyFormatter.format(Number(value) || 0)
  if (column?.format === "number") return numberFormatter.format(Number(value) || 0)
  if (column?.format === "boolean") return value ? "Sí" : "No"
  if (column?.format === "date") return supplierDateLabel(value)
  return String(value)
}

function LoadingOrError({ loading, error }: { loading: boolean; error: unknown }) {
  if (loading) return <div className="grid h-52 place-items-center text-muted-foreground">Consultando…</div>
  if (error) return <div className="grid h-52 place-items-center text-destructive">No fue posible cargar la consulta.</div>
  return null
}

function PanelTable({ columns, rows, height = "21rem", selection }: {
  columns: readonly SupplierPanelColumn[]
  rows: Array<Record<string, unknown>>
  height?: string
  selection?: { index: number; onSelect: (key: string) => void }
}) {
  const minimumWidth = columns.reduce((total, column) => total + Number.parseFloat(column.width ?? "7"), 0)
  return (
    <ErpDataTableViewport axes="xy" style={{ height }}>
      <table className="table-fixed border-collapse text-[9px]/none" style={{ minWidth: `${Math.max(minimumWidth, 42)}rem`, width: "100%" }}>
        <colgroup>{columns.map((column, index) => <col key={`${column.key}-${index}`} style={{ width: column.width ?? "7rem" }} />)}</colgroup>
        <thead className="sticky top-0 z-10 bg-background"><tr className="h-5 border-b">{columns.map((column, index) => <th className="border-r px-1 text-left font-normal" key={`${column.key}-${index}`}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const rowKey = String(row.id ?? rowIndex)
            const selected = rowIndex === (selection?.index ?? 0)
            return (
              <tr className={cn("h-4 border-b border-dotted", selection && "cursor-pointer",
                selected && "bg-module-payable text-module-payable-foreground")} key={rowKey}
                onClick={selection ? () => selection.onSelect(rowKey) : undefined}>
                {columns.map((column, columnIndex) => {
                  const value = valueText(row[column.key], column)
                  return <td className={cn("truncate border-r px-1", (column.format === "money" || column.format === "number") && "text-right tabular-nums")}
                    key={`${column.key}-${columnIndex}`}>
                    {selection && column.key === "document" ? (
                      <Button aria-pressed={selected} className="block h-full w-full truncate rounded-none border-0 p-0 text-left font-normal leading-none hover:bg-transparent hover:text-inherit"
                        size="xs" type="button" variant="ghost">
                        {value}
                      </Button>
                    ) : value}
                  </td>
                })}
              </tr>
            )
          })}
          {rows.length === 0 && <tr><td className="h-48 text-center text-muted-foreground" colSpan={columns.length}>Sin datos para este proveedor</td></tr>}
        </tbody>
      </table>
    </ErpDataTableViewport>
  )
}

function DisabledButtons({ labels }: { labels: readonly string[] }) {
  return <div className="flex flex-wrap gap-1">{labels.map((label) => <Button disabled key={label} size="xs" variant="outline">{label}</Button>)}</div>
}

function DetailField({ label, value, className }: { label: string; value: unknown; className?: string }) {
  return <label className={cn("grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-1", className)}><span className="text-right">{label}</span><Input className="h-5 px-1 text-[9px]" readOnly value={valueText(value)} /></label>
}

function ClassificationsDialog({ supplier, panel, onOpenChange }: Props) {
  const [position, setPosition] = useState(1)
  const query = useQuery(supplierClassificationsQueryOptions(supplier.id, position))
  const data = query.data?.data
  return (
    <ErpDataDialog className="sm:max-w-[64rem]" description="Clasificaciones del proveedor." onOpenChange={onOpenChange} title={panel.title} tone="payable">
      <ErpDataDialogBody className="grid min-h-[31rem] grid-cols-[11rem_minmax(0,1fr)_minmax(0,1.3fr)] gap-2">
        <div className="flex flex-col gap-1 pt-6">
          {(data?.classifications ?? Array.from({ length: 9 }, (_, index) => ({ position: index + 1, label: "", code: "", description: "" }))).map((item) => <Button className={cn("justify-start", item.position === position && "bg-module-payable text-module-payable-foreground")} key={item.position} onClick={() => setPosition(item.position)} size="xs" variant="outline">{item.label || " "}</Button>)}
          <Button className="mt-3" disabled size="xs" variant="outline">Guardar todos</Button>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="grid h-5 grid-cols-[4rem_1fr] border bg-background"><span className="border-r px-1">Fam</span><span className="px-1">Descripción</span></div>
          <ErpDataTableViewport axes="y" className="flex-1"><table className="w-full table-fixed text-[9px]"><tbody>{(data?.options ?? []).map((option) => <tr className="h-4 border-b border-dotted" key={option.id}><td className="w-16 px-1">{option.code}</td><td className="truncate px-1">{option.description}</td></tr>)}</tbody></table></ErpDataTableViewport>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="grid h-5 place-items-center border bg-background font-bold">SELECCIONADOS</div>
          <div className="grid h-5 grid-cols-[5.5rem_4rem_1fr] border bg-background"><span className="border-r px-1">Fam</span><span className="border-r px-1">Cod.</span><span className="px-1">Descripción</span></div>
          <ErpDataTableViewport axes="y" className="flex-1"><table className="w-full table-fixed text-[9px]"><tbody>{(data?.classifications ?? []).map((item) => <tr className="h-4 border-b border-dotted" key={item.position}><td className="w-[5.5rem] px-1">{item.label}</td><td className="w-16 px-1">{item.code}</td><td className="truncate px-1">{item.description}</td></tr>)}</tbody></table></ErpDataTableViewport>
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}

function VariousView({ detail }: { detail: Record<string, unknown> }) {
  const fields: Array<[string, string]> = [
    ["branch", "Sucursal"], ["bankAccount", "Número de cuenta"], ["bankCode", "Clave de banco"],
    ["cieReference", "REF CIE"], ["internetPassword", "Password internet"], ["multiCompany", "Multicia"],
    ["deliveryDays", "Tiempo de entrega"], ["purchaseFrequencyDays", "Frecuencia de compras (Días)"],
    ["tolerancePercent", "% Tolerancia O.C."], ["vatWithholdingPercent", "% Retención I.V.A."],
    ["incomeTaxWithholdingPercent", "% Retención I.S.R."], ["thirdPartyType", "Tipo de Tercero"],
    ["operationType", "Tipo de Operación"], ["countryCode", "Código País"],
  ]
  return <div className="grid gap-1 sm:grid-cols-2">{fields.map(([key, label]) => <DetailField key={key} label={label} value={detail[key]} />)}<div className="col-span-full mt-1 grid grid-cols-8 gap-1">{Array.from({ length: 8 }, (_, index) => <Input className="h-5 text-right text-[9px]" key={index} readOnly value={valueText(detail[`minimum${index + 1}`])} />)}</div><DisabledButtons labels={["Cambio"]} /></div>
}

const panelButtons: Record<string, readonly string[]> = {
  balance: ["Aux. doc.", "Productos", "Agrupar", "Gastos", "Coment", "Documenta", "PESOS", "Docto.", "Contrarecibo", "Relación de 'X'", "Referencia"],
  movements: ["Filtrar documentos saldados", "Ref pago"],
  invoices: ["Aux. doc.", "Productos", "Gastos", "Coment", "Relación de 'X'"],
  "ordered-products": ["Filtrar pedidos surtidos", "Asigna con lector", "Baja", "Filtrar almacén"],
  "quoted-products": ["Filtrar pedidos surtidos"],
  "purchased-products-detail": ["Último"],
  "work-in-progress": ["Salida maquila", "Filtra recibidos"],
  events: ["Nuevo", "Cambiar", "Eliminar"],
  contacts: ["Alta", "Baja", "Cambio", "Eventos", "REDRAW"],
}

function AnnualChart({ rows }: { rows: Array<Record<string, unknown>> }) {
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
  const values = months.map((month) => rows.reduce((sum, row) => sum + (Number(row[month]) || 0), 0))
  const maximum = Math.max(...values.map(Math.abs), 1)
  return <div className="h-40 bg-black p-3 text-[8px] text-yellow-300"><p className="mb-2 text-center font-bold text-orange-500">Meses</p><div className="flex h-24 items-end gap-2 border-b border-blue-500">{values.map((value, index) => <div className="flex flex-1 flex-col items-center justify-end" key={index}><div className="w-full bg-blue-700" style={{ height: `${Math.max(1, Math.abs(value) / maximum * 80)}px` }} /><span className="mt-1">UM{index + 1}</span></div>)}</div></div>
}

function GeneralPanelDialog(props: Props) {
  const [selectedRow, setSelectedRow] = useState<string>()
  const [paymentReceipt, setPaymentReceipt] = useState<{ id: number; number: string; date?: string } | null>(null)
  const query = useQuery(supplierPanelQueryOptions(props.supplier.id, props.panel))
  const payload = query.data?.data
  const detail = payload?.detail ?? {}
  const rows = payload?.items ?? []
  const tableHeight = props.panel.key === "events" || props.panel.key === "contacts" ? "13rem" : "21rem"
  const totals = Object.entries(payload?.summary ?? {})
  const balancePanel = props.panel.key === "balance"
  const selectedIndex = Math.max(0, rows.findIndex((row, index) => String(row.id ?? index) === selectedRow))
  const selectedBalance = balancePanel ? rows[selectedIndex] : undefined
  const receiptId = supplierBalanceReceiptId(selectedBalance)

  return (
    <>
    <ErpDataDialog className="sm:max-w-[68rem]" description={`${props.panel.title} del proveedor.`}
      onOpenChange={(open) => { if (open || !paymentReceipt) props.onOpenChange(open) }} title={props.panel.title} tone="payable">
      <ErpDataDialogBody>
        <LoadingOrError error={query.error} loading={query.isLoading} />
        {!query.isLoading && !query.error && (
          <>
            {props.panel.key === "various" ? <VariousView detail={detail} /> : props.panel.columns.length > 0 ? (
              <PanelTable columns={props.panel.columns} height={tableHeight} rows={rows}
                selection={balancePanel ? { index: selectedIndex, onSelect: setSelectedRow } : undefined} />
            ) : <div className="grid min-h-36 place-items-center"><div className="grid w-80 gap-1">{Object.entries(detail).map(([key, value]) => <DetailField key={key} label={key} value={value} />)}</div></div>}
            {props.panel.key === "events" && <div className="mt-1 grid gap-1"><Input className="h-20 text-[9px]" readOnly value={valueText(rows[0]?.description)} /><DisabledButtons labels={panelButtons.events ?? []} /></div>}
            {props.panel.key === "contacts" && <div className="mt-1 grid grid-cols-2 gap-1"><DetailField label="Teléfono" value={rows[0]?.phone1} /><DetailField label="Tel 2" value={rows[0]?.phone2} /><DetailField label="Mail" value={rows[0]?.email} /><DetailField label="Cumpleaños" value={rows[0]?.birthday} /><DisabledButtons labels={panelButtons.contacts ?? []} /></div>}
            {props.panel.key === "annual-purchases-summary" && <AnnualChart rows={rows} />}
            {payload?.unavailableReason && <p className="mt-1 text-muted-foreground">{payload.unavailableReason}</p>}
            <div className="mt-1 flex items-end justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <DisabledButtons labels={panelButtons[props.panel.key] ?? []} />
                {balancePanel && <Button disabled={receiptId === null || Boolean(paymentReceipt) || query.isFetching}
                  onClick={() => {
                    if (receiptId === null) return
                    setPaymentReceipt({ id: receiptId, number: valueText(selectedBalance?.document),
                      date: supplierCalendarDate(selectedBalance?.date) })
                  }} size="xs" type="button" variant="outline">Paga</Button>}
              </div>
              <div className="flex gap-1">{totals.map(([key, value]) => <ErpDataMetric key={key} label={metricLabels[key] ?? key} value={moneyFormatter.format(Number(value) || 0)} />)}</div>
            </div>
          </>
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
    {paymentReceipt && <DesktopWindowIdentity id={`suppliers:${props.supplier.id}:payments:${paymentReceipt.id}`}>
      <SupplierPaymentDialog documentNumber={paymentReceipt.number} onClose={() => setPaymentReceipt(null)}
        receiptDate={paymentReceipt.date} receiptId={paymentReceipt.id} supplierId={props.supplier.id} />
    </DesktopWindowIdentity>}
    </>
  )
}

export function SupplierPanelDialog(props: Props) {
  if (props.panel.key === "classifications") return <ClassificationsDialog {...props} />
  return <GeneralPanelDialog {...props} />
}
