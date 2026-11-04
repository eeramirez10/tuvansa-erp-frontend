import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { createPortal, flushSync } from "react-dom"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { SalesByFamilyDocument, SalesByFamilyPrintDocument } from "@/features/sales/reports/components/sales-by-family-document"
import { salesByFamilyQuery, salesReportOptionsQuery } from "@/features/sales/reports/logic"
import type { SalesCriteria, SalesMeasure, SalesOptions } from "@/features/sales/reports/model"
import { downloadSalesByFamily } from "@/features/sales/reports/services/download-sales-by-family"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { notifications } from "@/shared/notifications/notifications"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { ReportSelect } from "@/shared/ui/report-select"
import { Spinner } from "@/shared/ui/spinner"
const schema = z.object({ from: z.iso.date(), to: z.iso.date(), branch: z.string(), family: z.string() }).refine(value => value.from <= value.to, { path: ["to"], message: "Hasta debe ser igual o posterior a Desde." })
function Workspace({ options }: { options: SalesOptions }) {
  const defaults: SalesCriteria = { from: options.defaultFrom, to: options.defaultTo, branch: options.defaultBranch, family: "all" }
  const form = useForm<SalesCriteria>({ resolver: zodResolver(schema), defaultValues: defaults }), current = useWatch({ control: form.control })
  const [criteria, setCriteria] = useState<SalesCriteria | null>(null), [open, setOpen] = useState(true), [detail, setDetail] = useState(false)
  const [measure, setMeasure] = useState<SalesMeasure>("amount"), [page, setPage] = useState(1), [output, setOutput] = useState("pdf"), [exporting, setExporting] = useState(false), [printing, setPrinting] = useState(false)
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true)), after = () => setPrinting(false)
    window.addEventListener("beforeprint", before); window.addEventListener("afterprint", after)
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after) }
  }, [])
  const report = useQuery({ ...salesByFamilyQuery(criteria ?? defaults), enabled: criteria !== null })
  const matches = criteria !== null && criteria.from === current.from && criteria.to === current.to && criteria.branch === current.branch && criteria.family === current.family
  const ready = Boolean(matches && report.data && !report.data.empty && !report.isFetching && !report.isError), busy = report.isFetching || exporting
  const count = report.data?.groups.reduce((sum, group) => sum + group.products.length, 0) ?? 0, pages = Math.max(1, Math.ceil(count / 100))
  const generate = (next: SalesCriteria) => { setPage(1); if (JSON.stringify(criteria) === JSON.stringify(next)) void report.refetch(); else setCriteria(next) }
  const exportReport = async () => {
    if (!ready || !report.data || busy) return
    if (output === "pdf") { window.print(); return }
    setExporting(true)
    try { await downloadSalesByFamily(report.data, measure) } catch (error) { notifications.error(error instanceof Error ? error.message : "No se pudo generar Excel.") } finally { setExporting(false) }
  }
  return <>
    <h1 className="text-sm font-semibold">Ventas por familia</h1>
    {!open && <Button className="mt-2 self-start" onClick={() => setOpen(true)}>Abrir reporte</Button>}
    {open && <DesktopWindowIdentity id="sales:reports:by-family"><ErpDataDialog title="Ventas por familia" description="Ventas brutas del periodo por familia IFAMB, productos tipo 1" tone="sales" defaultWidth={1120} defaultHeight={Math.min(740, window.innerHeight - 150)} fillHeight onOpenChange={setOpen}>
      <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-2">
        <form onSubmit={form.handleSubmit(generate)} className="shrink-0 rounded-sm border bg-background p-2">
          <div className="grid grid-cols-2 items-end gap-2 md:grid-cols-[9rem_9rem_minmax(11rem,1fr)_minmax(11rem,1fr)_auto]">
            <div className="grid gap-1"><Label htmlFor="sales-from">Desde</Label><Input id="sales-from" type="date" min="1901-01-01" max="2100-12-31" disabled={busy} {...form.register("from")} /></div>
            <div className="grid gap-1"><Label htmlFor="sales-to">Hasta</Label><Input id="sales-to" type="date" min="1901-01-01" max="2100-12-31" disabled={busy} {...form.register("to")} /></div>
            <Controller control={form.control} name="branch" render={({ field }) => <ReportSelect id="sales-branch" label="Sucursal" value={field.value} options={[{ value: "all", label: "Todas las sucursales" }, ...options.branches.map(b => ({ value: b.code, label: b.code + " · " + b.name }))]} onChange={field.onChange} disabled={busy} />} />
            <Controller control={form.control} name="family" render={({ field }) => <ReportSelect id="sales-family" label="Familia IFAMB" value={field.value} options={[{ value: "all", label: "Todas las familias" }, ...options.families.map(f => ({ value: f.code, label: (f.code || "—") + " · " + f.name }))]} onChange={field.onChange} disabled={busy} />} />
            <Button type="submit" size="lg" disabled={busy}>{report.isFetching ? "Generando…" : "Vista previa"}</Button>
          </div><p className="mt-2 text-[10px]">Tipo de producto: 1 · Ventas brutas: sólo facturas al precio registrado, sin IVA · Periodo inclusivo</p>
          {(form.formState.errors.from || form.formState.errors.to) && <p role="alert" className="mt-1 text-xs text-destructive">{form.formState.errors.to?.message ?? "Selecciona fechas válidas."}</p>}
        </form>
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-2"><div className="flex items-end gap-3">
          <ReportSelect id="sales-measure" label="Mostrar" value={measure} options={[{ value: "amount", label: "Ventas brutas" }, { value: "meters", label: "Metros estimados" }]} onChange={value => setMeasure(value as SalesMeasure)} disabled={busy} />
          <Label htmlFor="sales-detail"><Checkbox id="sales-detail" checked={detail} onCheckedChange={value => { setDetail(value === true); setPage(1) }} />Detalle por producto en pantalla y PDF</Label>
        </div>{ready && detail && <div className="flex items-center gap-2 text-[10px]"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button><span>Página {page} de {pages} · {count} productos / sucursales</span><Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente</Button></div>}</div>
        <div role="region" aria-label="Vista previa de ventas por familia" aria-busy={report.isFetching} className="min-h-0 flex-1 overflow-auto rounded-sm border bg-background">
          {!criteria && <p className="p-3 text-xs">Selecciona periodo, sucursal y familia para consultar las ventas brutas.</p>}
          {report.isFetching && <p role="status" className="flex items-center gap-2 p-3 text-xs"><Spinner />Calculando ventas brutas…</p>}
          {criteria && !matches && <p role="status" className="p-3 text-xs">Los filtros cambiaron. Genera de nuevo la vista previa para exportar.</p>}
          {matches && report.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(report.error)}</AlertDescription><Button size="sm" onClick={() => void report.refetch()}>Reintentar</Button></Alert>}
          {matches && !report.isFetching && !report.isError && report.data?.empty && <p role="status" className="p-3 text-xs">No hay ventas para este periodo y filtros.</p>}
          {ready && <SalesByFamilyDocument report={report.data!} measure={measure} detail={detail} page={page} />}
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-sm border bg-background p-2"><div className="flex items-center gap-3"><span id="sales-output-label" className="text-xs">Salida</span><RadioGroup className="flex w-auto gap-3" aria-labelledby="sales-output-label" value={output} onValueChange={setOutput} disabled={busy}><Label htmlFor="sales-excel"><RadioGroupItem id="sales-excel" value="excel" />Excel</Label><Label htmlFor="sales-pdf"><RadioGroupItem id="sales-pdf" value="pdf" />PDF</Label></RadioGroup></div><div className="flex gap-2"><Button disabled={!ready || busy} onClick={() => void exportReport()}>{exporting ? "Generando Excel…" : output === "excel" ? "Descargar Excel" : "Imprimir / Guardar PDF"}</Button><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button></div></footer>
      </ErpDataDialogBody>
    </ErpDataDialog></DesktopWindowIdentity>}
    {open && ready && printing && createPortal(<div className="sales-family-print-root"><SalesByFamilyPrintDocument report={report.data!} measure={measure} detail={detail} /></div>, document.body)}
  </>
}
export function SalesByFamilyPage() {
  const options = useQuery(salesReportOptionsQuery())
  if (options.isPending) return <p role="status" className="flex items-center gap-2"><Spinner />Cargando opciones del reporte…</p>
  if (options.isError) return <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(options.error)}</AlertDescription><Button onClick={() => void options.refetch()}>Reintentar</Button></Alert>
  return <Workspace options={options.data} />
}
