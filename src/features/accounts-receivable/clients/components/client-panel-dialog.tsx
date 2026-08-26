import { useQuery } from "@tanstack/react-query"

import { clientPanelQueryOptions } from "@/features/accounts-receivable/clients/logic"
import type {
  Client,
  ClientColumnFormat,
  ClientPanelColumn,
  ClientPanelDefinition,
} from "@/features/accounts-receivable/clients/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  ErpDataDialog,
  ErpDataDialogBody,
  ErpDataMetric,
  ErpDataTableViewport,
} from "@/shared/ui/erp-data-dialog"
import { Spinner } from "@/shared/ui/spinner"
import { cn } from "@/shared/utils/cn"

type ClientPanelDialogProps = {
  client: Client
  panel: ClientPanelDefinition
  onOpenChange: (open: boolean) => void
}

const numberFormatter = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 4 })
const moneyFormatter = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function pathValue(row: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) =>
    typeof value === "object" && value !== null ? (value as Record<string, unknown>)[key] : undefined,
  row)
}

function displayValue(value: unknown, format: ClientColumnFormat = "text") {
  if (value === null || value === undefined || value === "") return ""
  if (format === "boolean") return value ? "Sí" : "No"
  if (format === "money" && typeof value === "number") return moneyFormatter.format(value)
  if (format === "number" && typeof value === "number") return numberFormatter.format(value)
  if (format === "date" && typeof value === "string") {
    const date = value.slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Intl.DateTimeFormat("es-MX", { timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))
      : value
  }
  if (Array.isArray(value)) return value.map((item) => String(item)).join(" · ")
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function ClientDataTable({ rows, columns, emptyMessage = "Sin registros para este cliente" }: {
  rows: Array<Record<string, unknown>>
  columns: readonly ClientPanelColumn[]
  emptyMessage?: string
}) {
  return (
    <ErpDataTableViewport className="h-[20rem]" axes="xy">
      <table className="w-max min-w-full table-fixed border-collapse text-[9px]/none tabular-nums">
        <colgroup>{columns.map((column) => <col key={column.key} style={{ width: column.width ?? "6rem" }} />)}</colgroup>
        <thead className="sticky top-0 z-10 bg-background">
          <tr className="h-4 border-b border-input">
            {columns.map((column) => <th className={cn("whitespace-nowrap border-r px-1 text-left font-normal last:border-r-0", column.align === "right" && "text-right", column.align === "center" && "text-center")} key={column.key}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className={cn("h-4 hover:bg-muted/50", index === 0 && "bg-module-receivable text-module-receivable-foreground")} key={String(row.id ?? index)}>
              {columns.map((column) => {
                const value = displayValue(pathValue(row, column.key), column.format)
                return <td className={cn("truncate border-r px-1 last:border-r-0", column.align === "right" && "text-right", column.align === "center" && "text-center")} key={column.key} title={value}>{value}</td>
              })}
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="h-64 text-center text-muted-foreground" colSpan={Math.max(columns.length, 1)}>{emptyMessage}</td></tr>}
        </tbody>
      </table>
    </ErpDataTableViewport>
  )
}

const metricLabels: Record<string, string> = {
  totalBalance: "Saldo total",
  overdueBalance: "Vencido",
  notDueBalance: "Por vencer",
  documentCount: "Documentos",
  overdueDocumentCount: "Docs. vencidos",
  notDueDocumentCount: "Docs. por vencer",
  openingBalance: "Saldo inicial",
  charges: "Cargos",
  credits: "Abonos",
  netMovement: "Movimiento neto",
  closingBalance: "Saldo final",
  movementCount: "Movimientos",
}

function DetailPanel({ detail }: { detail: Record<string, unknown> }) {
  const entries = Object.entries(detail).filter(([key]) => key !== "event")
  const event = typeof detail.event === "object" && detail.event !== null
    ? detail.event as Record<string, unknown>
    : null
  return (
    <div className="grid gap-1 border border-input bg-background p-2 shadow-inner sm:grid-cols-3">
      {entries.map(([key, value]) => (
        <ErpDataMetric key={key} label={metricLabels[key] ?? key} value={displayValue(value, typeof value === "boolean" ? "boolean" : "text")} />
      ))}
      {event && (
        <div className="sm:col-span-3">
          <p className="mb-0.5 px-1">Evento de bloqueo</p>
          <pre className="min-h-24 whitespace-pre-wrap border border-input bg-muted/30 p-1 text-[9px]/tight">{displayValue(event.description)}</pre>
        </div>
      )}
    </div>
  )
}

export function ClientPanelDialog({ client, panel, onOpenChange }: ClientPanelDialogProps) {
  const query = useQuery(clientPanelQueryOptions(client.id, panel))
  const result = query.data

  return (
    <ErpDataDialog className="sm:max-w-[62rem]" description={`${panel.title} para ${client.code}.`} onOpenChange={onOpenChange} title={panel.title} tone="receivable">
      <ErpDataDialogBody>
        <div className="mb-1 grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)_8rem]">
          <ErpDataMetric label="Cliente" value={client.code} />
          <label className="grid gap-0.5"><span className="px-1">Razón social</span><output className="flex h-4 items-center border border-input bg-background px-1 shadow-inner">{client.name}</output></label>
          <ErpDataMetric label="Saldo" value={moneyFormatter.format(client.totals.currentBalance)} />
        </div>

        {query.isLoading && <div className="grid h-80 place-items-center"><Spinner /></div>}
        {query.isError && <Alert variant="destructive"><AlertTitle>No fue posible abrir la consulta</AlertTitle><AlertDescription>La API no devolvió información para este botón.</AlertDescription></Alert>}
        {result?.data.unavailableReason && <Alert><AlertTitle>Opción sin origen de datos</AlertTitle><AlertDescription>{result.data.unavailableReason}</AlertDescription></Alert>}
        {result?.data.detail && !result.data.unavailableReason && panel.columns.length === 0 && <DetailPanel detail={result.data.detail} />}
        {result && panel.columns.length > 0 && <ClientDataTable columns={panel.columns} rows={result.data.items} />}

        {result?.data.secondaryItems && (
          <div className="mt-1">
            <p className="mb-0.5 px-1">Opciones disponibles de agente</p>
            <ClientDataTable columns={[{ key: "code", label: "Código", width: "6rem" }, { key: "number", label: "Número", width: "5rem" }, { key: "description", label: "Descripción", width: "20rem" }]} rows={result.data.secondaryItems} />
          </div>
        )}

        {result?.data.summary && (
          <div className="mt-1 flex max-w-full flex-wrap justify-end gap-1">
            {Object.entries(result.data.summary).map(([key, value]) => (
              <ErpDataMetric key={key} label={metricLabels[key] ?? key} value={typeof value === "number" ? (key.toLowerCase().includes("count") ? numberFormatter.format(value) : moneyFormatter.format(value)) : displayValue(value)} />
            ))}
          </div>
        )}

        <div className="mt-1 flex justify-between">
          <span className="self-center px-1 text-muted-foreground">{result?.pagination ? `${result.pagination.total} registro(s)` : ""}</span>
          <Button onClick={() => onOpenChange(false)} size="xs" variant="outline">✓ OK</Button>
        </div>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
