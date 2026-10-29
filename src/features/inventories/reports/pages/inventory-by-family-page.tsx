import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { createPortal, flushSync } from "react-dom"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { InventoryByFamilyDocument } from "@/features/inventories/reports/components/inventory-by-family-document"
import { inventoryByFamilyQuery, inventoryReportOptionsQuery } from "@/features/inventories/reports/logic"
import type { InventoryCriteria, InventoryOptions } from "@/features/inventories/reports/model"
import { downloadInventoryByFamily } from "@/features/inventories/reports/services/download-inventory-by-family"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"

const schema = z.object({ asOf: z.iso.date(), warehouse: z.string(), family: z.string() })
function ReportSelect({ id, label, value, options, onChange, disabled }: {
  id: string; label: string; value: string; options: Array<{ value: string; label: string }>
  onChange: (value: string) => void; disabled: boolean
}) {
  return <div className="grid gap-1"><Label htmlFor={id}>{label}</Label>
    <Select value={value} items={options} onValueChange={next => { if (next !== null) onChange(next) }} disabled={disabled} modal={false}>
      <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  </div>
}

function Workspace({ options }: { options: InventoryOptions }) {
  const defaults: InventoryCriteria = { asOf: options.defaultDate, warehouse: options.defaultWarehouse, family: "all" }
  const form = useForm<InventoryCriteria>({ resolver: zodResolver(schema), defaultValues: defaults })
  const current = useWatch({ control: form.control })
  const [criteria, setCriteria] = useState<InventoryCriteria | null>(null)
  const [open, setOpen] = useState(true)
  const [detail, setDetail] = useState(false)
  const [page, setPage] = useState(1)
  const [output, setOutput] = useState("pdf")
  const [exporting, setExporting] = useState(false)
  const [printing, setPrinting] = useState(false)
  useEffect(() => {
    // Materialize every detail row only for printing, keeping the interactive view paginated.
    const before = () => flushSync(() => setPrinting(true))
    const after = () => setPrinting(false)
    window.addEventListener("beforeprint", before); window.addEventListener("afterprint", after)
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after) }
  }, [])
  const report = useQuery({ ...inventoryByFamilyQuery(criteria ?? defaults), enabled: criteria !== null })
  const matches = criteria !== null && criteria.asOf === current.asOf && criteria.warehouse === current.warehouse && criteria.family === current.family
  const ready = Boolean(matches && report.data && !report.data.empty && !report.isFetching && !report.isError)
  const busy = report.isFetching || exporting
  const count = report.data?.groups.reduce((sum, group) => sum + group.products.length, 0) ?? 0
  const pages = Math.max(1, Math.ceil(count / 100))
  const generate = (next: InventoryCriteria) => {
    setPage(1)
    if (JSON.stringify(criteria) === JSON.stringify(next)) void report.refetch()
    else setCriteria(next)
  }
  const exportReport = async () => {
    if (!ready || !report.data || busy) return
    if (output === "pdf") { window.print(); return }
    setExporting(true)
    try { await downloadInventoryByFamily(report.data) }
    catch (error) { notifications.error(error instanceof Error ? error.message : "No se pudo generar Excel.") }
    finally { setExporting(false) }
  }
  return <>
    <h1 className="text-sm font-semibold">Inventario por familia</h1>
    {!open && <Button className="mt-2 self-start" onClick={() => setOpen(true)}>Abrir reporte</Button>}
    {open && <DesktopWindowIdentity id="inventories:reports:by-family">
      <ErpDataDialog title="Inventario por familia" description="Existencias a una fecha, agrupadas por IFAMB" defaultWidth={1040} defaultHeight={Math.min(700, window.innerHeight - 150)} fillHeight onOpenChange={setOpen}>
        <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-2" onKeyDown={event => {
          if (event.key === "Escape" && !event.defaultPrevented && !document.querySelector('[data-slot="select-content"], [data-slot="dropdown-menu-content"], [data-slot="dropdown-menu-sub-content"]')) {
            event.stopPropagation(); setOpen(false)
          }
        }}>
          <form onSubmit={form.handleSubmit(generate)} className="shrink-0 rounded-sm border bg-background p-2">
            <div className="grid grid-cols-2 items-end gap-2 md:grid-cols-[9rem_minmax(12rem,1fr)_minmax(12rem,1fr)_auto]">
              <div className="grid gap-1"><Label htmlFor="inventory-as-of">Inventario al</Label><Input id="inventory-as-of" type="date" min="1901-01-01" max="2100-12-31" disabled={busy} {...form.register("asOf")} /></div>
              <Controller control={form.control} name="warehouse" render={({ field }) => <ReportSelect id="inventory-warehouse" label="Almacén / sucursal" value={field.value} options={[{ value: "all", label: "Todos los almacenes" }, ...options.warehouses.map(w => ({ value: w.code, label: w.code + " · " + w.name }))]} onChange={field.onChange} disabled={busy} />} />
              <Controller control={form.control} name="family" render={({ field }) => <ReportSelect id="inventory-family" label="Familia IFAMB" value={field.value} options={[{ value: "all", label: "Todas las familias" }, ...options.families.map(f => ({ value: f.code, label: (f.code || "—") + " · " + f.name }))]} onChange={field.onChange} disabled={busy} />} />
              <Button type="submit" size="lg" disabled={busy}>{report.isFetching ? "Generando…" : "Vista previa"}</Button>
            </div>
            {form.formState.errors.asOf && <p role="alert" className="mt-1 text-xs text-destructive">Selecciona una fecha válida.</p>}
          </form>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <Label htmlFor="inventory-detail"><Checkbox id="inventory-detail" checked={detail} onCheckedChange={value => { setDetail(value === true); setPage(1) }} />Detalle por producto en pantalla y PDF</Label>
            {ready && detail && <div className="flex items-center gap-2 text-[10px]">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
              <span>Página {page} de {pages} · {count} productos / almacenes</span>
              <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente</Button>
            </div>}
          </div>
          <div role="region" aria-label="Vista previa de inventario por familia" aria-busy={report.isFetching} className="min-h-0 flex-1 overflow-auto rounded-sm border bg-background">
            {!criteria && <p className="p-3 text-xs">Selecciona fecha, almacén y familia. El cálculo recorre el historial del Auxiliar desde su inicio.</p>}
            {report.isFetching && <p role="status" className="flex items-center gap-2 p-3 text-xs"><Spinner />Calculando entradas y salidas…</p>}
            {criteria && !matches && <p role="status" className="p-3 text-xs">Los filtros cambiaron. Genera de nuevo la vista previa para exportar.</p>}
            {matches && report.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(report.error)}</AlertDescription><Button size="sm" onClick={() => void report.refetch()}>Reintentar</Button></Alert>}
            {matches && !report.isFetching && !report.isError && report.data?.empty && <p role="status" className="p-3 text-xs">No hay movimientos para este corte.</p>}
            {ready && <InventoryByFamilyDocument report={report.data!} detail={detail} page={page} />}
          </div>
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-sm border bg-background p-2">
            <div className="flex items-center gap-3"><span id="inventory-output-label" className="text-xs">Salida</span>
              <RadioGroup className="flex w-auto gap-3" aria-labelledby="inventory-output-label" value={output} onValueChange={setOutput} disabled={busy}>
                <Label htmlFor="inventory-output-excel"><RadioGroupItem id="inventory-output-excel" value="excel" />Excel</Label>
                <Label htmlFor="inventory-output-pdf"><RadioGroupItem id="inventory-output-pdf" value="pdf" />PDF</Label>
              </RadioGroup>
            </div>
            <div className="flex gap-2"><Button disabled={!ready || busy} onClick={() => void exportReport()}>{exporting ? "Generando Excel…" : output === "excel" ? "Descargar Excel" : "Imprimir / Guardar PDF"}</Button><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button></div>
          </footer>
        </ErpDataDialogBody>
      </ErpDataDialog>
    </DesktopWindowIdentity>}
    {open && ready && printing && createPortal(<div className="inventory-family-print-root"><InventoryByFamilyDocument report={report.data!} detail={detail} /></div>, document.body)}
  </>
}

export function InventoryByFamilyPage() {
  const options = useQuery(inventoryReportOptionsQuery())
  if (options.isPending) return <p role="status" className="flex items-center gap-2"><Spinner />Cargando opciones del reporte…</p>
  if (options.isError) return <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(options.error)}</AlertDescription><Button onClick={() => void options.refetch()}>Reintentar</Button></Alert>
  return <Workspace options={options.data} />
}
