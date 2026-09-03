import { useQuery } from "@tanstack/react-query"
import { type FormEvent, useState } from "react"

import { clientAnalyticsQueryOptions } from "@/features/accounts-receivable/clients/logic"
import type {
  ClientAnalyticsCriteria,
  ClientAnalyticsItem,
  ClientRiskLevel,
} from "@/features/accounts-receivable/clients/model"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  ErpDataDialog,
  ErpDataDialogBody,
  ErpDataMetric,
  ErpDataTableViewport,
} from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { cn } from "@/shared/utils/cn"

type ClientAnalyticsDialogProps = {
  onOpenChange: (open: boolean) => void
}

const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
})
const numberFormatter = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat("es-MX", { timeZone: "UTC" })

const formatDate = (value: string | null) => {
  if (!value) return "—"
  return dateFormatter.format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
}

const riskLabels: Record<ClientRiskLevel, string> = {
  healthy: "Sin vencido",
  watch: "1–30 días",
  overdue: "> 30 días",
  critical: "Crítico",
}

const riskClasses: Record<ClientRiskLevel, string> = {
  healthy: "border-emerald-600/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  watch: "border-yellow-600/40 bg-yellow-400/20 text-yellow-800 dark:text-yellow-300",
  overdue: "border-orange-600/40 bg-orange-500/20 text-orange-800 dark:text-orange-300",
  critical: "border-red-600/50 bg-red-500/20 text-red-800 dark:text-red-300",
}

const initialCriteria: ClientAnalyticsCriteria = {
  status: "active",
  risk: "all",
  page: 1,
  pageSize: 25,
}

function ClientAnalyticsRow({ client }: { client: ClientAnalyticsItem }) {
  return (
    <tr className="h-5 border-b border-input/60 hover:bg-muted/60">
      <td className="sticky left-0 z-[1] border-r bg-background px-1">{client.code}</td>
      <td className="max-w-64 truncate border-r px-1" title={client.name}>{client.name}</td>
      <td className="border-r px-1 text-center">{client.branch}</td>
      <td className="border-r px-1 text-center">{client.paymentTermDays}</td>
      <td className="border-r px-1 text-right">{moneyFormatter.format(client.creditLimit)}</td>
      <td className="border-r px-1 text-right">{moneyFormatter.format(client.totalBalance)}</td>
      <td className="border-r px-1 text-right text-red-700 dark:text-red-300">{moneyFormatter.format(client.overdueBalance)}</td>
      <td className="border-r px-1 text-right">{moneyFormatter.format(client.notDueBalance)}</td>
      <td className="border-r px-1 text-right">{moneyFormatter.format(client.availableCredit)}</td>
      <td className="border-r px-1 text-right">{client.creditUsedPercentage === null ? "—" : `${numberFormatter.format(client.creditUsedPercentage)} %`}</td>
      <td className="border-r px-1 text-center">{client.pendingDocumentCount}</td>
      <td className="border-r px-1 text-center">{client.overdueDocumentCount}</td>
      <td className="border-r px-1 text-center">{formatDate(client.oldestOverdueDate)}</td>
      <td className="border-r px-1 text-right">{client.maximumDaysOverdue}</td>
      <td className="border-r px-1 text-center">{formatDate(client.lastPurchaseAt)}</td>
      <td className="border-r px-1 text-center">{formatDate(client.lastPaymentAt)}</td>
      <td className="border-r px-1 text-center">{formatDate(client.lastOrderAt)}</td>
      <td className="border-r px-1 text-right">{moneyFormatter.format(client.accumulatedSales)}</td>
      <td className="border-r px-1 text-center">{client.openOrderCount}</td>
      <td className="border-r px-1 text-right">{moneyFormatter.format(client.openOrderAmount)}</td>
      <td className="px-1 text-center">
        <Badge className={cn("h-4 whitespace-nowrap px-1 text-[8px]", riskClasses[client.risk])} variant="outline">
          {riskLabels[client.risk]}
        </Badge>
      </td>
    </tr>
  )
}

export function ClientAnalyticsDialog({ onOpenChange }: ClientAnalyticsDialogProps) {
  const [search, setSearch] = useState("")
  const [criteria, setCriteria] = useState(initialCriteria)
  const query = useQuery(clientAnalyticsQueryOptions(criteria))
  const report = query.data
  const summary = report?.data.summary
  const totalPages = Math.max(1, Math.ceil((report?.pagination.total ?? 0) / criteria.pageSize))

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const q = search.trim()
    setCriteria((current) => ({ ...current, ...(q ? { q } : { q: undefined }), page: 1 }))
  }

  const setFilter = <K extends "status" | "risk">(key: K, value: ClientAnalyticsCriteria[K]) => {
    setCriteria((current) => ({ ...current, [key]: value, page: 1 }))
  }

  return (
    <ErpDataDialog
      description="Análisis de cartera, crédito, antigüedad y pedidos de clientes de la sucursal 01 México."
      onOpenChange={onOpenChange}
      title="Reporte analítico de clientes · Sucursal 01 México"
      tone="receivable"
    >
      <ErpDataDialogBody className="flex min-h-0 flex-col gap-1.5">
        <form className="grid items-end gap-1 sm:grid-cols-[minmax(12rem,1fr)_8rem_8rem_auto]" onSubmit={submitSearch}>
          <label className="grid gap-0.5">
            <span className="px-1">Cliente</span>
            <Input className="h-6 text-[9px]" onChange={(event) => setSearch(event.target.value)} placeholder="Código o razón social" value={search} />
          </label>
          <label className="grid gap-0.5">
            <span className="px-1">Estatus</span>
            <select className="h-6 rounded-md border border-input bg-background px-1 text-[9px]" onChange={(event) => setFilter("status", event.target.value as ClientAnalyticsCriteria["status"])} value={criteria.status}>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="all">Todos</option>
            </select>
          </label>
          <label className="grid gap-0.5">
            <span className="px-1">Riesgo</span>
            <select className="h-6 rounded-md border border-input bg-background px-1 text-[9px]" onChange={(event) => setFilter("risk", event.target.value as ClientAnalyticsCriteria["risk"])} value={criteria.risk}>
              <option value="all">Todos</option>
              <option value="healthy">Sin vencido</option>
              <option value="watch">1–30 días</option>
              <option value="overdue">Más de 30 días</option>
              <option value="critical">Crítico</option>
            </select>
          </label>
          <Button className="h-6" disabled={query.isFetching} size="xs" type="submit">Buscar</Button>
        </form>

        {query.isError && <Alert variant="destructive"><AlertTitle>No fue posible generar el reporte</AlertTitle><AlertDescription>Verifica que la API esté disponible e inténtalo nuevamente.</AlertDescription></Alert>}
        {query.isLoading && <div className="grid h-72 place-items-center"><Spinner /></div>}

        {summary && (
          <>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-6">
              <ErpDataMetric label="Clientes" value={numberFormatter.format(summary.clientCount)} />
              <ErpDataMetric label="Cartera" value={moneyFormatter.format(summary.totalBalance)} />
              <ErpDataMetric className="text-red-700 dark:text-red-300" label="Vencido" value={moneyFormatter.format(summary.overdueBalance)} />
              <ErpDataMetric label="Por vencer" value={moneyFormatter.format(summary.notDueBalance)} />
              <ErpDataMetric label="Límite de crédito" value={moneyFormatter.format(summary.creditLimit)} />
              <ErpDataMetric label="Pedidos abiertos" value={`${summary.openOrderCount} · ${moneyFormatter.format(summary.openOrderAmount)}`} />
            </div>
            <fieldset className="grid grid-cols-2 gap-1 border border-input bg-background/40 p-1 sm:grid-cols-5">
              <legend className="px-1">Antigüedad de cartera</legend>
              <ErpDataMetric label="Por vencer" value={moneyFormatter.format(summary.aging.notDue)} />
              <ErpDataMetric label="1–30 días" value={moneyFormatter.format(summary.aging.days1To30)} />
              <ErpDataMetric label="31–60 días" value={moneyFormatter.format(summary.aging.days31To60)} />
              <ErpDataMetric label="61–90 días" value={moneyFormatter.format(summary.aging.days61To90)} />
              <ErpDataMetric label="> 90 días" value={moneyFormatter.format(summary.aging.over90)} />
            </fieldset>
          </>
        )}

        {report && (
          <ErpDataTableViewport axes="xy" className="h-[20rem]">
            <table className="w-[130rem] table-fixed border-collapse text-[9px]/none tabular-nums">
              <colgroup>
                {[6, 18, 6, 5, 8, 8, 8, 8, 8, 6, 5, 5, 7, 5, 7, 7, 7, 9, 5, 8, 7].map((width, index) => <col key={index} style={{ width: `${width}rem` }} />)}
              </colgroup>
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="h-5 border-b border-input">
                  {[
                    "Código", "Cliente", "Sucursal", "Plazo", "Crédito", "Saldo", "Vencido", "Por vencer", "Disponible", "% crédito", "Docs.", "Vencidos", "Vencido desde", "Días máx.", "Últ. compra", "Últ. pago", "Últ. pedido", "Venta acumulada", "Ped. abiertos", "Importe pedidos", "Riesgo",
                  ].map((label, index) => <th className={cn("border-r px-1 text-left font-normal", index === 0 && "sticky left-0 z-[2] bg-background")} key={label}>{label}</th>)}
                </tr>
              </thead>
              <tbody>
                {report.data.clients.map((client) => <ClientAnalyticsRow client={client} key={client.id} />)}
                {report.data.clients.length === 0 && <tr><td className="h-48 text-center text-muted-foreground" colSpan={21}>No hay clientes que coincidan con los filtros.</td></tr>}
              </tbody>
            </table>
          </ErpDataTableViewport>
        )}

        <footer className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">
            {report ? `${report.pagination.total} cliente(s) · Corte ${formatDate(report.data.scope.asOf)}` : "Sucursal fija: 01 México"}
            {query.isFetching && !query.isLoading ? " · Actualizando…" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button disabled={criteria.page <= 1 || query.isFetching} onClick={() => setCriteria((current) => ({ ...current, page: current.page - 1 }))} size="xs" variant="outline">Anterior</Button>
            <span className="min-w-14 text-center">{criteria.page} / {totalPages}</span>
            <Button disabled={criteria.page >= totalPages || query.isFetching} onClick={() => setCriteria((current) => ({ ...current, page: current.page + 1 }))} size="xs" variant="outline">Siguiente</Button>
            <Button onClick={() => onOpenChange(false)} size="xs" variant="outline">✓ OK</Button>
          </div>
        </footer>
      </ErpDataDialogBody>
    </ErpDataDialog>
  )
}
