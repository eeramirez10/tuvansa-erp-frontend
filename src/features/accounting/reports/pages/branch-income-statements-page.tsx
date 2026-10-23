import { useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { createPortal } from "react-dom"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { IncomeStatementToolbar } from "@/features/accounting/reports/components/income-statement-toolbar"
import { FinancialIncomeStatementDocument } from "@/features/accounting/reports/components/financial-income-statement-document"
import { branchIncomeStatementOptionsQuery, branchIncomeStatementsQuery } from "@/features/accounting/reports/logic"
import type { BranchIncomeStatementCriteria, BranchIncomeStatements, BranchIncomeStatementsOptions, IncomeStatementFormat } from "@/features/accounting/reports/model"
import { downloadIncomeStatementExcel } from "@/features/accounting/reports/services/download-income-statement-excel"
import { getApiErrorMessage } from "@/shared/api/api-error"
import { notifications } from "@/shared/notifications/notifications"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { DesktopWindowIdentity } from "@/shared/ui/desktop-window-context"
import { ErpDataDialog, ErpDataDialogBody } from "@/shared/ui/erp-data-dialog"
import { Label } from "@/shared/ui/label"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Spinner } from "@/shared/ui/spinner"

type Props = { onFormatChange: (format: IncomeStatementFormat) => void }
type Output = "pdf" | "excel"
const schema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  branch: z.enum(["all", "01", "02", "03", "04", "05", "06", "07"]),
})

function ReportSelect({ id, label, value, options, onChange, disabled }: {
  id: string; label: string; value: string; options: Array<{ value: string; label: string }>
  onChange: (value: string) => void; disabled: boolean
}) {
  return <div className="grid gap-1">
    <Label htmlFor={id}>{label}</Label>
    <Select value={value} items={options} onValueChange={next => { if (next !== null) onChange(next) }} disabled={disabled} modal={false}>
      <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
}

function Documents({ data }: { data: BranchIncomeStatements }) {
  return <div className="financial-statement-report-set">
    {data.branches.map(item => <FinancialIncomeStatementDocument key={item.branch.warehouseCode} report={item.report} />)}
    {data.consolidated && <FinancialIncomeStatementDocument report={data.consolidated} />}
  </div>
}

function Workspace({ options, onFormatChange }: { options: BranchIncomeStatementsOptions } & Props) {
  const defaults: BranchIncomeStatementCriteria = { month: options.defaultMonth, year: options.defaultYear, branch: options.defaultBranch }
  const form = useForm<BranchIncomeStatementCriteria>({ resolver: zodResolver(schema), defaultValues: defaults })
  const current = useWatch({ control: form.control })
  const [open, setOpen] = useState(true)
  const [output, setOutput] = useState<Output>("pdf")
  const [exporting, setExporting] = useState(false)
  const [criteria, setCriteria] = useState<BranchIncomeStatementCriteria | null>(null)
  const report = useQuery({ ...branchIncomeStatementsQuery(criteria ?? defaults), enabled: criteria !== null })
  const matches = criteria !== null && criteria.year === current.year && criteria.month === current.month && criteria.branch === current.branch
  const ready = Boolean(matches && report.data && !report.data.empty && !report.isFetching && !report.isError)
  const busy = report.isFetching || exporting
  const generate = (next: BranchIncomeStatementCriteria) => {
    if (!options.years.includes(next.year)) { form.setError("year", { message: "Selecciona un ejercicio disponible." }); return }
    if (JSON.stringify(next) === JSON.stringify(criteria)) void report.refetch()
    else setCriteria(next)
  }
  const exportReport = async () => {
    if (!ready || !report.data || exporting) return
    if (output === "pdf") { window.print(); return }
    setExporting(true)
    try { await downloadIncomeStatementExcel(report.data) }
    catch (error) { notifications.error(error instanceof Error ? error.message : "No se pudo generar el archivo Excel.") }
    finally { setExporting(false) }
  }
  return <>
    <IncomeStatementToolbar format="branches" onFormatChange={onFormatChange} onParameters={() => setOpen(true)} printable={false} showActions={false} />
    <h1 className="text-sm font-semibold">Estado de resultados</h1>
    {!open && <Button className="mt-2 self-start" onClick={() => setOpen(true)}>Abrir reporte</Button>}
    {open && <DesktopWindowIdentity id="accounting:income-statement:report">
      <ErpDataDialog defaultWidth={960} defaultHeight={Math.min(680, window.innerHeight - 150)} fillHeight title="Estado de resultados" description="Filtros, vista previa y exportación del reporte" onOpenChange={setOpen}>
        <ErpDataDialogBody className="flex min-h-0 flex-1 flex-col gap-2" onKeyDown={event => {
          // A popup handles its own Escape before it reaches the report window.
          if (event.key === "Escape" && !event.defaultPrevented && !document.querySelector('[data-slot="select-content"], [data-slot="dropdown-menu-content"]')) {
            event.stopPropagation(); setOpen(false)
          }
        }}>
          <form className="shrink-0 rounded-sm border bg-background p-2" onSubmit={form.handleSubmit(generate)}>
            <div className="grid grid-cols-2 items-end gap-2 md:grid-cols-[7rem_9rem_minmax(10rem,1fr)_auto]">
              <Controller control={form.control} name="year" render={({ field }) => <ReportSelect id="report-year" label="Año" value={String(field.value)} options={options.years.map(year => ({ value: String(year), label: String(year) }))} onChange={value => field.onChange(Number(value))} disabled={busy} />} />
              <Controller control={form.control} name="month" render={({ field }) => <ReportSelect id="report-month" label="Mes" value={String(field.value)} options={options.months.map(month => ({ value: String(month.value), label: month.label }))} onChange={value => field.onChange(Number(value))} disabled={busy} />} />
              <Controller control={form.control} name="branch" render={({ field }) => <ReportSelect id="report-branch" label="Sucursal" value={field.value} options={[{ value: "all", label: "Todas las sucursales" }, ...options.branches.map(branch => ({ value: branch.warehouseCode, label: branch.warehouseCode + " — " + branch.name.replace(/^SUC[.]?\s*/i, "") }))]} onChange={field.onChange} disabled={busy} />} />
              <Button size="lg" disabled={busy} type="submit">{report.isFetching ? "Generando…" : "Vista previa"}</Button>
            </div>
            {options.years.length === 1 && <p className="mt-2 text-[10px] text-muted-foreground">Ejercicio disponible: {options.years[0]}.</p>}
            {form.formState.errors.year && <p role="alert">{form.formState.errors.year.message}</p>}
          </form>
          <div role="region" aria-label="Vista previa del estado de resultados" aria-busy={report.isFetching} className="min-h-0 flex-1 overflow-auto rounded-sm border bg-background">
            {report.isFetching && <p role="status" className="flex items-center gap-2 p-3"><Spinner />Generando reporte…</p>}
            {matches && report.isError && <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(report.error)}</AlertDescription><Button size="sm" onClick={() => void report.refetch()}>Reintentar</Button></Alert>}
            {!criteria && <p className="p-3 text-xs">Selecciona año, mes y sucursal. Pulsa Vista previa para generar el reporte.</p>}
            {criteria && !matches && <p role="status" className="p-3 text-xs">Los filtros cambiaron. Genera la vista previa para actualizar el reporte y exportarlo.</p>}
            {matches && report.data?.empty && !report.isFetching && !report.isError && <p role="status" className="p-3 text-xs">No hay saldos ni movimientos para los filtros seleccionados.</p>}
            {ready && <div className="income-statement-preview"><Documents data={report.data!} /></div>}
          </div>
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-sm border bg-background p-2">
            <div className="flex items-center gap-3"><span id="report-output-label" className="text-xs">Salida</span>
              <RadioGroup aria-labelledby="report-output-label" className="flex w-auto gap-3" value={output} onValueChange={value => setOutput(value as Output)} disabled={exporting}>
                <Label htmlFor="report-output-excel"><RadioGroupItem id="report-output-excel" value="excel" />Excel</Label>
                <Label htmlFor="report-output-pdf"><RadioGroupItem id="report-output-pdf" value="pdf" />PDF</Label>
              </RadioGroup>
            </div>
            <div className="flex gap-2">
              <Button disabled={!ready || exporting} onClick={() => void exportReport()}>{exporting ? "Generando Excel…" : output === "excel" ? "Descargar Excel" : "Imprimir / Guardar PDF"}</Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            </div>
          </footer>
        </ErpDataDialogBody>
      </ErpDataDialog>
    </DesktopWindowIdentity>}
    {open && ready && createPortal(<div className="income-statement-print-root"><Documents data={report.data!} /></div>, document.body)}
  </>
}

export function BranchIncomeStatementsPage({ onFormatChange }: Props) {
  const options = useQuery(branchIncomeStatementOptionsQuery())
  if (options.isPending) return <p role="status" className="flex items-center gap-2"><Spinner />Cargando opciones del reporte…</p>
  if (options.isError) return <Alert variant="destructive"><AlertDescription>{getApiErrorMessage(options.error)}</AlertDescription><Button size="sm" onClick={() => void options.refetch()}>Reintentar</Button></Alert>
  return <Workspace options={options.data} onFormatChange={onFormatChange} />
}
