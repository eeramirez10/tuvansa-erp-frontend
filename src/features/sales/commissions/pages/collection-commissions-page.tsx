import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { CollectionCommissionsTable } from "@/features/sales/commissions/components/collection-commissions-table"
import { collectionMoney, collectionOptionsQuery, collectionReportQuery } from "@/features/sales/commissions/logic"
import type { CollectionCriteria, CollectionOptions } from "@/features/sales/commissions/model"
import { downloadCollectionCommissions } from "@/features/sales/commissions/services/download-collection-commissions"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { notifications } from "@/shared/notifications/notifications"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { ReportSelect } from "@/shared/ui/report-select"
import { Spinner } from "@/shared/ui/spinner"
const schema = z.object({ from: z.iso.date(), to: z.iso.date(), branch: z.string(), agent: z.string() })
  .refine(v => v.from <= v.to && Date.parse(v.to) - Date.parse(v.from) <= 365 * 86400000, { path: ["to"], message: "Selecciona un rango válido de hasta 366 días." })

function Workspace({ options }: { options: CollectionOptions }) {
  const defaults = { from: options.defaultFrom, to: options.defaultTo, branch: options.branches.some(b => b.code === "01") ? "01" : "all", agent: "all" }
  const form = useForm<CollectionCriteria>({ resolver: zodResolver(schema), defaultValues: defaults }), current = useWatch({ control: form.control })
  const [criteria, setCriteria] = useState<CollectionCriteria | null>(null), [open, setOpen] = useState(true), [summary, setSummary] = useState(false), [page, setPage] = useState(1), [exporting, setExporting] = useState(false)
  const report = useQuery({ ...collectionReportQuery(criteria ?? defaults), enabled: criteria !== null })
  const matches = criteria !== null && criteria.from === current.from && criteria.to === current.to && criteria.branch === current.branch && criteria.agent === current.agent
  const ready = Boolean(matches && report.data && !report.data.empty && !report.isFetching && !report.isError), busy = report.isFetching || exporting
  const count = (summary ? report.data?.agents.length : report.data?.invoices.length) ?? 0, pages = Math.max(1, Math.ceil(count / 100))
  const generate = (next: CollectionCriteria) => { setPage(1); if (JSON.stringify(next) === JSON.stringify(criteria)) void report.refetch(); else setCriteria(next) }
  const download = async () => {
    if (!ready || !report.data || busy) return
    setExporting(true)
    try { await downloadCollectionCommissions(report.data) } catch (error) { notifications.error(getApiErrorMessage(error)) } finally { setExporting(false) }
  }
  return <>
    <h1 className="text-sm font-semibold">Comisiones por cobranza</h1>
    {!open && <Button className="mt-2 self-start" onClick={() => setOpen(true)}>Abrir reporte</Button>}
    {open && <DesktopWindowIdentity id="sales:reports:collection-commissions"><ErpDataDialog title="Comisiones por cobranza — Preliminar" description="Cobranza PA por fecha de pago, factura y agente" tone="sales" defaultWidth={1140} defaultHeight={Math.min(760, window.innerHeight - 150)} fillHeight onOpenChange={setOpen}>
      <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-2">
        <Alert className="shrink-0 border-amber-500"><AlertDescription>Preliminar: cobranza disponible. Costos, utilidad, LM y comisión pendientes del procedimiento faltante; no equivalen a cero.</AlertDescription></Alert>
        <form className="shrink-0 rounded-sm border bg-background p-2" onSubmit={form.handleSubmit(generate)}>
          <div className="grid grid-cols-2 items-end gap-2 md:grid-cols-[9rem_9rem_minmax(10rem,1fr)_minmax(12rem,1fr)_auto]">
            <div className="grid gap-1"><Label htmlFor="collection-from">Pagos desde</Label><Input id="collection-from" type="date" min="1901-01-01" max="2100-12-31" disabled={busy} {...form.register("from")} /></div>
            <div className="grid gap-1"><Label htmlFor="collection-to">Pagos hasta</Label><Input id="collection-to" type="date" min="1901-01-01" max="2100-12-31" disabled={busy} {...form.register("to")} /></div>
            <Controller control={form.control} name="branch" render={({ field }) => <ReportSelect id="collection-branch" label="Sucursal" value={field.value} options={[{ value: "all", label: "Todas las sucursales" }, ...options.branches.map(b => ({ value: b.code, label: b.code + " · " + b.name }))]} onChange={field.onChange} disabled={busy} />} />
            <Controller control={form.control} name="agent" render={({ field }) => <ReportSelect id="collection-agent" label="Agente" value={field.value} options={[{ value: "all", label: "Todos los agentes" }, ...options.agents.map(a => ({ value: a.code, label: (a.code || "—") + " · " + a.name }))]} onChange={field.onChange} disabled={busy} />} />
            <Button type="submit" disabled={busy}>{report.isFetching ? "Generando…" : "Vista previa"}</Button>
          </div><p className="mt-2 text-[10px]">Rango por fecha del pago (AFECHA), no por fecha de factura · Incluye pagos parciales PA · Importes sin IVA</p>
          {(form.formState.errors.from || form.formState.errors.to) && <p role="alert" className="mt-1 text-xs text-destructive">{form.formState.errors.to?.message ?? "Selecciona fechas válidas."}</p>}
        </form>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <Label htmlFor="collection-summary"><Checkbox id="collection-summary" checked={summary} onCheckedChange={value => { setSummary(value === true); setPage(1) }} />Resumen por agente</Label>
          {ready && <div className="flex items-center gap-2 text-[10px]"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button><span>Página {page} de {pages} · {count} {summary ? "agentes" : "facturas"}</span><Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente</Button></div>}
        </div>
        <div role="region" aria-label="Vista previa de comisiones por cobranza" aria-busy={report.isFetching} className="min-h-0 flex-1 overflow-auto rounded-sm border bg-background">
          {!criteria && <p className="p-3 text-xs">Selecciona periodo de pagos, sucursal y agente para consultar.</p>}
          {report.isFetching && <p role="status" className="flex items-center gap-2 p-3 text-xs"><Spinner />Leyendo pagos y sus facturas…</p>}
          {criteria && !matches && <p role="status" className="p-3 text-xs">Los filtros cambiaron. Genera de nuevo la vista previa antes de exportar.</p>}
          {matches && report.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(report.error)}</AlertDescription><Button onClick={() => void report.refetch()}>Reintentar</Button></Alert>}
          {matches && !report.isFetching && !report.isError && report.data?.empty && <p role="status" className="p-3 text-xs">No hay facturas con pagos PA en este periodo y filtros.</p>}
          {ready && <><div className="p-2 text-xs"><p className="font-semibold">{report.data!.company} · PRELIMINAR</p><p>Facturas: {report.data!.totals.invoices} · Pagos PA: {report.data!.totals.payments} · Pago sin IVA presentado: {collectionMoney(report.data!.totals.payment)}</p></div>
            {report.data!.invoices.some(r => r.invalidVatCount > 0) && <p role="alert" className="p-2 text-xs text-destructive">Hay movimientos con IVA inválido. Sus importes no están disponibles.</p>}
            <CollectionCommissionsTable report={report.data!} summary={summary} page={page} />
            <div className="space-y-1 p-2 text-[10px]">{report.data!.notes.map(note => <p key={note}>{note}</p>)}</div></>}
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-2 rounded-sm border bg-background p-2"><span className="text-[10px]">Excel incluye todo el detalle, movimientos FAX y partidas de origen.</span><div className="flex gap-2"><Button disabled={!ready || busy} onClick={() => void download()}>{exporting ? "Generando Excel…" : "Descargar Excel preliminar"}</Button><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button></div></footer>
      </ErpDataDialogBody>
    </ErpDataDialog></DesktopWindowIdentity>}
  </>
}
export function CollectionCommissionsPage() {
  const options = useQuery(collectionOptionsQuery())
  if (options.isPending) return <p role="status" className="flex items-center gap-2"><Spinner />Cargando opciones de cobranza…</p>
  if (options.isError) return <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(options.error)}</AlertDescription><Button onClick={() => void options.refetch()}>Reintentar</Button></Alert>
  return <Workspace options={options.data} />
}
