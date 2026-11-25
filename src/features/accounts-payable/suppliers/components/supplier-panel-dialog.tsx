import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router"
import { paths } from "@/app/router/paths"
import { SupplierClassificationsDialog } from "@/features/accounts-payable/suppliers/components/supplier-classifications-dialog"
import { SupplierActivityDialog } from "@/features/accounts-payable/suppliers/components/supplier-activity-dialog"
import { SupplierGroupingDialog } from "@/features/accounts-payable/suppliers/components/supplier-grouping-dialog"
import { SupplierPaymentDialog } from "@/features/accounts-payable/suppliers/components/supplier-payment-dialog"
import { SupplierPaymentReversalDialog } from "@/features/accounts-payable/suppliers/components/supplier-payment-reversal-dialog"
import { SupplierVariousDialog } from "@/features/accounts-payable/suppliers/components/supplier-various-dialog"
import {
  supplierBalanceReceiptId, supplierCalendarDate, supplierDateLabel,
  supplierGroupingPosition, supplierKeys, supplierPanelQueryOptions, supplierReversiblePayment,
} from "@/features/accounts-payable/suppliers/logic"
import type { Supplier, SupplierGroupingPosition, SupplierPanelColumn, SupplierPanelDefinition } from "@/features/accounts-payable/suppliers/model"
import { purchaseReceptionKeys } from "@/features/purchasing/purchase-receptions/logic"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
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

function panelRowKey(row: Record<string, unknown>, index: number, movements: boolean) {
  return movements ? JSON.stringify([row.id ?? index, row.document, row.movementType]) : String(row.id ?? index)
}

function historicalReceptionCancellationPolicyId(row: Record<string, unknown>) {
  const { movementType, document, receiptId, policyId, policy } = row
  return movementType === "K" && typeof document === "string" && document.startsWith("RA") &&
    typeof receiptId === "number" && Number.isSafeInteger(receiptId) && receiptId > 0 &&
    typeof policyId === "number" && Number.isSafeInteger(policyId) && policyId > 0 &&
    typeof policy === "string" && policy.trim()
    ? policyId
    : null
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

function PanelTable({ columns, rows, height = "21rem", movements = false, selection, grouping }: {
  columns: readonly SupplierPanelColumn[]
  rows: Array<Record<string, unknown>>
  height?: string
  movements?: boolean
  selection?: {
    index: number
    onSelect: (key: string) => void
    allowsRow?: (row: Record<string, unknown>) => boolean
  }
  grouping?: { marked: Set<number>; onMark: (id: number, marked: boolean) => void }
}) {
  const minimumWidth = columns.reduce((total, column) => total + Number.parseFloat(column.width ?? "7"), 0)
  return (
    <ErpDataTableViewport axes="xy" style={{ height }}>
      <table className="table-fixed border-collapse text-[9px]/none" style={{ minWidth: `${Math.max(minimumWidth, 42)}rem`, width: "100%" }}>
        <colgroup>{grouping && <col style={{ width: "2rem" }} />}{columns.map((column, index) => <col key={`${column.key}-${index}`} style={{ width: column.width ?? "7rem" }} />)}</colgroup>
        <thead className="sticky top-0 z-10 bg-background"><tr className="h-5 border-b">{grouping && <th className="border-r text-center font-normal">X</th>}{columns.map((column, index) => <th className="border-r px-1 text-left font-normal" key={`${column.key}-${index}`}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const rowKey = panelRowKey(row, rowIndex, movements)
            const selected = rowIndex === (selection?.index ?? 0)
            const cancellationPolicyId = movements ? historicalReceptionCancellationPolicyId(row) : null
            const position = grouping ? supplierGroupingPosition(row) : null
            const selectRow = selection && (!selection.allowsRow || selection.allowsRow(row))
              ? () => selection.onSelect(rowKey)
              : undefined
            return (
              <tr className={cn("h-4 border-b border-dotted", selectRow && "cursor-pointer",
                selected && "bg-module-payable text-module-payable-foreground")} key={rowKey}
                onClick={selectRow}>
                {grouping && <td className="border-r px-1">{position && (
                  <Checkbox aria-label={`Marcar ${position.document} para agrupar`}
                    checked={grouping.marked.has(position.id)} onClick={(event) => event.stopPropagation()}
                    onCheckedChange={(checked) => grouping.onMark(position.id, checked)} />
                )}</td>}
                {columns.map((column, columnIndex) => {
                  const value = valueText(row[column.key], column)
                  return <td className={cn("truncate border-r px-1", (column.format === "money" || column.format === "number") && "text-right tabular-nums")}
                    key={`${column.key}-${columnIndex}`}>
                    {selectRow && column.key === "document" ? (
                      <Button aria-pressed={selected} className="block h-full w-full truncate rounded-none border-0 p-0 text-left font-normal leading-none hover:bg-transparent hover:text-inherit"
                        size="xs" type="button" variant="ghost">
                        {value}
                      </Button>
                    ) : column.key === "policy" && cancellationPolicyId !== null ? (
                      <Link className="underline underline-offset-2" to={paths.accountingPolicy(cancellationPolicyId)}>{value}</Link>
                    ) : value}
                  </td>
                })}
              </tr>
            )
          })}
          {rows.length === 0 && <tr><td className="h-48 text-center text-muted-foreground" colSpan={columns.length + Number(Boolean(grouping))}>Sin datos para este proveedor</td></tr>}
        </tbody>
      </table>
    </ErpDataTableViewport>
  )
}

function PanelButtons({ labels, group }: { labels: readonly string[]; group?: () => void }) {
  return <div className="flex flex-wrap gap-1">{labels.map((label) => (
    <Button disabled={label !== "Agrupar" || !group} key={label} onClick={label === "Agrupar" ? group : undefined}
      size="xs" type="button" variant="outline">{label}</Button>
  ))}</div>
}

function DetailField({ label, value, className }: { label: string; value: unknown; className?: string }) {
  return <label className={cn("grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-1", className)}><span className="text-right">{label}</span><Input className="h-5 px-1 text-[9px]" readOnly value={valueText(value)} /></label>
}

const panelButtons: Record<string, readonly string[]> = {
  balance: ["Aux. doc.", "Productos", "Agrupar", "Gastos", "Coment", "Documenta", "PESOS", "Docto.", "Contrarecibo", "Relación de 'X'", "Referencia"],
  movements: ["Filtrar documentos saldados", "Ref pago"],
  invoices: ["Aux. doc.", "Productos", "Gastos", "Coment", "Relación de 'X'"],
  "ordered-products": ["Filtrar pedidos surtidos", "Asigna con lector", "Baja", "Filtrar almacén"],
  "quoted-products": ["Filtrar pedidos surtidos"],
  "purchased-products-detail": ["Último"],
  "work-in-progress": ["Salida maquila", "Filtra recibidos"],
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
  const [paymentReversalId, setPaymentReversalId] = useState<number | null>(null)
  const [marked, setMarked] = useState<Set<number>>(() => new Set())
  const [grouping, setGrouping] = useState<{ target: SupplierGroupingPosition; sources: SupplierGroupingPosition[] } | null>(null)
  const queryClient = useQueryClient()
  const query = useQuery(supplierPanelQueryOptions(props.supplier.id, props.panel))
  const payload = query.data?.data
  const detail = payload?.detail ?? {}
  const rows = payload?.items ?? []
  const tableHeight = "21rem"
  const totals = Object.entries(payload?.summary ?? {})
  const balancePanel = props.panel.key === "balance"
  const movementsPanel = props.panel.key === "movements"
  const paymentSelection = movementsPanel && rows.some(row => supplierReversiblePayment(row) !== null)
  const matchingIndex = rows.findIndex((row, index) => panelRowKey(row, index, movementsPanel) === selectedRow)
  const selectedIndex = balancePanel ? Math.max(0, matchingIndex) : matchingIndex
  const selectedBalance = balancePanel ? rows[selectedIndex] : undefined
  const receiptId = supplierBalanceReceiptId(selectedBalance)
  const selectedPayment = paymentSelection ? supplierReversiblePayment(rows[selectedIndex]) : null
  const target = supplierGroupingPosition(selectedBalance)
  const positions = balancePanel ? rows.flatMap((row) => supplierGroupingPosition(row) ?? []) : []
  const sources = positions.filter(({ id }) => marked.has(id))
  const staleMarks = sources.length !== marked.size
  const group = target && !query.isFetching && !marked.has(target.id) && !staleMarks && sources.length
    ? () => setGrouping({ target, sources }) : undefined

  return (
    <>
    <ErpDataDialog className="sm:max-w-[68rem]" description={`${props.panel.title} del proveedor.`}
      onOpenChange={(open) => { if (open || (!paymentReceipt && paymentReversalId === null && !grouping)) props.onOpenChange(open) }}
      title={props.panel.title} tone="payable">
      <ErpDataDialogBody>
        <LoadingOrError error={query.error} loading={query.isLoading} />
        {!query.isLoading && !query.error && (
          <>
            {props.panel.columns.length > 0 ? (
              <PanelTable columns={props.panel.columns} height={tableHeight} movements={movementsPanel} rows={rows}
                grouping={positions.length ? { marked, onMark: (id, checked) => setMarked((current) => {
                  const next = new Set(current)
                  if (checked) next.add(id)
                  else next.delete(id)
                  return next
                }) } : undefined}
                selection={balancePanel || paymentSelection ? {
                  index: selectedIndex,
                  onSelect: setSelectedRow,
                  allowsRow: paymentSelection ? row => supplierReversiblePayment(row) !== null : undefined,
                } : undefined} />
            ) : <div className="grid min-h-36 place-items-center"><div className="grid w-80 gap-1">{Object.entries(detail).map(([key, value]) => <DetailField key={key} label={key} value={value} />)}</div></div>}
            {props.panel.key === "annual-purchases-summary" && <AnnualChart rows={rows} />}
            {payload?.unavailableReason && <p className="mt-1 text-muted-foreground">{payload.unavailableReason}</p>}
            <div className="mt-1 flex items-end justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <PanelButtons labels={panelButtons[props.panel.key] ?? []} group={group} />
                {staleMarks && <Button onClick={() => setMarked(new Set())} size="xs" type="button" variant="outline">
                  Quitar marcas de agrupación
                </Button>}
                {balancePanel && <Button disabled={receiptId === null || Boolean(paymentReceipt) || query.isFetching}
                  onClick={() => {
                    if (receiptId === null) return
                    setPaymentReceipt({ id: receiptId, number: valueText(selectedBalance?.document),
                      date: supplierCalendarDate(selectedBalance?.date) })
                  }} size="xs" type="button" variant="outline">Paga</Button>}
                {paymentSelection && (
                  <Button disabled={!selectedPayment || paymentReversalId !== null || query.isFetching}
                    onClick={() => { if (selectedPayment) setPaymentReversalId(selectedPayment.id) }}
                    size="xs" type="button" variant="outline">
                    {selectedPayment?.reversal ? "Ver reversión" : "Revertir PP"}
                  </Button>
                )}
                {selectedPayment?.reversal && (
                  <span className="flex items-center gap-1" role="status">
                    PP revertido
                    <Link className="underline underline-offset-2" to={paths.accountingPolicy(selectedPayment.reversal.id)}>
                      Póliza {selectedPayment.reversal.policyNumber}
                    </Link>
                  </span>
                )}
              </div>
              <div className="flex gap-1">{totals.map(([key, value]) => <ErpDataMetric key={key} label={metricLabels[key] ?? key} value={moneyFormatter.format(Number(value) || 0)} />)}</div>
            </div>
          </>
        )}
      </ErpDataDialogBody>
    </ErpDataDialog>
    {grouping && <DesktopWindowIdentity id={`suppliers:${props.supplier.id}:balance-grouping`}>
      <SupplierGroupingDialog supplierId={props.supplier.id} {...grouping}
        onClose={() => { setGrouping(null); void query.refetch() }}
        onSaved={async () => {
          setMarked(new Set())
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: supplierKeys.detail(props.supplier.id) }),
            queryClient.invalidateQueries({ queryKey: purchaseReceptionKeys.all }),
          ])
          setGrouping(null)
        }} />
    </DesktopWindowIdentity>}
    {paymentReceipt && <DesktopWindowIdentity id={`suppliers:${props.supplier.id}:payments:${paymentReceipt.id}`}>
      <SupplierPaymentDialog documentNumber={paymentReceipt.number} onClose={() => setPaymentReceipt(null)}
        receiptDate={paymentReceipt.date} receiptId={paymentReceipt.id} supplierId={props.supplier.id} />
    </DesktopWindowIdentity>}
    {paymentReversalId !== null && (
      <DesktopWindowIdentity id={`suppliers:${props.supplier.id}:payment-reversal:${paymentReversalId}`}>
        <SupplierPaymentReversalDialog
          onClose={() => setPaymentReversalId(null)}
          paymentId={paymentReversalId}
          supplierId={props.supplier.id}
        />
      </DesktopWindowIdentity>
    )}
    </>
  )
}

export function SupplierPanelDialog(props: Props) {
  if (props.panel.key === "classifications") return <SupplierClassificationsDialog supplier={props.supplier} title={props.panel.title} onOpenChange={props.onOpenChange} />
  if (props.panel.key === "various") return <SupplierVariousDialog {...props} />
  if (props.panel.key === "events" || props.panel.key === "contacts") {
    return <SupplierActivityDialog {...props} kind={props.panel.key} />
  }
  return <GeneralPanelDialog {...props} />
}
